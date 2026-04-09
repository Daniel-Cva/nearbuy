/**
 * CollabTracker — Cloudflare Durable Object (WebSocket Hibernation API)
 *
 * Must extend DurableObject from 'cloudflare:workers'.
 * Uses the WebSocket Hibernation API (state.acceptWebSocket) for
 * persistent connections that survive Worker restarts.
 *
 * One instance per "room" (keyed as "global" for now).
 */
import { DurableObject } from 'cloudflare:workers';

const RADIUS_M       = 500;    // 500 metre bounding box
const STALE_TIMEOUT  = 30_000; // prune sessions silent for >30s

export class CollabTracker extends DurableObject {
    constructor(state, env) {
        super(state, env);
        this.env   = env;
        // Metadata per WebSocket is stored in the Hibernation tag (JSON string).
        // We don't use an in-memory Map so the DO can hibernate safely.
    }

    // ── Entry: WebSocket upgrade request ──────────────────────────────────────
    async fetch(request) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
            return new Response('Expected WebSocket', { status: 426 });
        }

        const { 0: client, 1: server } = new WebSocketPair();

        this.ctx.acceptWebSocket(server, ['pending']); // 'pending' until first heartbeat
        return new Response(null, { status: 101, webSocket: client });
    }

    // ── WebSocket message handler (Hibernation API) ───────────────────────────
    webSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);

            if (data.type === 'heartbeat') {
                // Store metadata in the WS tag natively (Cloudflare supports object attachments)
                const tag = {
                    founderId:   data.founderId,
                    bizId:       data.bizId || null,
                    bizName:     data.bizName || '',
                    founderName: data.founderName || 'Founder',
                    bizCategory: data.bizCategory || '',
                    lat:         data.lat,
                    lng:         data.lng,
                    lastSeen:    Date.now()
                };

                // Store data in the socket's serializedAttachment using Structured Clone algorithm natively
                ws.serializeAttachment(tag);

                // Broadcast updated list
                this._broadcast();
            }

        } catch (e) {
            console.error('[CollabTracker] message error:', e.message);
        }
    }

    webSocketClose(ws, code, reason) {}

    webSocketError(ws, error) {
        console.error('[CollabTracker] socket error:', error.message);
    }

    // ── Broadcast nearby founders to all live sockets ─────────────────────────
    _broadcast() {
        const now     = Date.now();
        const sockets = this.ctx.getWebSockets();

        // Build list of all known founder positions exactly 1:1 with sockets
        const allFounders = sockets.map(ws => {
            try {
                const f = ws.deserializeAttachment();
                return (f && f.founderId && f.lat !== null && (now - f.lastSeen) < STALE_TIMEOUT) ? f : null;
            } catch { return null; }
        });

        // For each socket, send the founders within RADIUS_M
        for (let i = 0; i < sockets.length; i++) {
            const ws = sockets[i];
            const me = allFounders[i];
            
            if (!me) continue; // Skip if this specific socket has no valid data yet

            try {
                const nearby = allFounders
                    .filter((f, index) => f && index !== i) // Exclude exactly THIS socket, allowing same-account testing on multiple devices
                    .filter(f => haversineM(me.lat, me.lng, f.lat, f.lng) <= RADIUS_M)
                    .map(f => ({
                        founderId:   f.founderId,
                        bizId:       f.bizId,
                        bizName:     f.bizName,
                        founderName: f.founderName,
                        bizCategory: f.bizCategory,
                        lat:         f.lat,
                        lng:         f.lng,
                        distanceM:   Math.round(haversineM(me.lat, me.lng, f.lat, f.lng))
                    }));

                ws.send(JSON.stringify({ type: 'founders', founders: nearby }));
            } catch (e) {
                // Socket may be dead
            }
        }
    }
}

// Haversine distance in metres
function haversineM(lat1, lon1, lat2, lon2) {
    const R  = 6_371_000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
