/**
 * /api/collab/ws — WebSocket upgrade endpoint for Founder Collab Mode.
 *
 * The client sends a token as a query param:
 *   wss://your-api/api/collab/ws?token=JWT_TOKEN
 *
 * This route verifies the token, then hands the connection off to
 * the CollabTracker Durable Object (single global instance).
 */
import { verifyToken } from '$lib/server/auth';

export async function GET({ request, platform, url }) {
    const env = platform?.env;

    // 1. Verify token from query param (cookies don't survive WS upgrade on some browsers)
    const token = url.searchParams.get('token');
    if (!token) {
        return new Response(JSON.stringify({ message: 'Token required' }), { status: 401 });
    }

    const secret = env?.JWT_SECRET || 'nearbuy_dev_secret_key_123';
    const payload = await verifyToken(token, secret);
    if (!payload) {
        return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
    }

    // 2. Only business founders may use collab mode
    if (payload.role !== 'founder') {
        return new Response(JSON.stringify({ message: 'Founder accounts only' }), { status: 403 });
    }

    // 3. Route to Durable Object — single global room
    if (!env?.COLLAB_TRACKER) {
        return new Response('CollabTracker binding missing', { status: 500 });
    }

    const id      = env.COLLAB_TRACKER.idFromName('global');
    const stub    = env.COLLAB_TRACKER.get(id);

    // Forward the request including the WebSocket upgrade headers
    return stub.fetch(request);
}
