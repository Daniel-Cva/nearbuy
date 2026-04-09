/**
 * inject-do.js — Post-build script
 *
 * After `npm run build`, adapter-cloudflare generates:
 *   .svelte-kit/cloudflare/_worker.js
 *
 * This script:
 *  1. Inlines the CollabTracker Durable Object class
 *  2. Wraps the default fetch export to intercept WebSocket upgrades
 *     to /api/collab/ws BEFORE SvelteKit processes them.
 *     (SvelteKit cannot pass 101 WebSocket responses through correctly.)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = resolve(__dirname, '.svelte-kit/cloudflare/_worker.js');

if (!existsSync(workerPath)) {
    console.error('❌  Build output not found. Run npm run build first.');
    process.exit(1);
}

// Read CollabTracker source and inline it directly into _worker.js
const doSrc = resolve(__dirname, 'src/lib/server/CollabTracker.js');
const doCode = readFileSync(doSrc, 'utf-8');

let workerCode = readFileSync(workerPath, 'utf-8');

// ── Step 1: Inline CollabTracker class ────────────────────────────────────────
if (!workerCode.includes('class CollabTracker')) {
    const classBody = doCode
        .replace(/^import\s+.*from\s+['"]cloudflare:workers['"];?\r?\n?/m, '')
        .trim();

    if (!workerCode.includes('DurableObject')) {
        workerCode = `import { DurableObject } from 'cloudflare:workers';\n` + workerCode;
    }

    workerCode += `\n\n// ── CollabTracker DO (inlined by inject-do.js) ──\n${classBody}\n`;
    console.log('✅  CollabTracker DO injected.');
} else {
    console.log('ℹ️   CollabTracker already present, skipping class injection.');
}

// ── Step 2: Wrap the default export to bypass SvelteKit for WebSocket upgrades ─
// SvelteKit's request pipeline cannot pass a 101 WebSocket response through.
// We intercept /api/collab/ws upgrades here, verify the JWT manually, and
// forward directly to the Durable Object.

const WS_BYPASS_FUNC = `
// ── WebSocket bypass (injected by inject-do.js) ──────────────────────────────
async function _verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [hB64, pB64, sB64] = parts;
        const key = await crypto.subtle.importKey(
            'raw', new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );
        const sig  = Uint8Array.from(atob(sB64.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
        const body = new TextEncoder().encode(hB64 + '.' + pB64);
        const ok   = await crypto.subtle.verify('HMAC', key, sig, body);
        if (!ok) return null;
        const payload = JSON.parse(atob(pB64.replace(/-/g,'+').replace(/_/g,'/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return payload;
    } catch { return null; }
}

async function _wrapped_fetch_handler(request, env, ctx, sveltekit_export) {
    const url = new URL(request.url);
    const isWsUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';

    if (url.pathname === '/api/collab/ws' && isWsUpgrade) {
        // Bypass SvelteKit — handle WebSocket directly
        const token  = url.searchParams.get('token') || '';
        const secret = env.JWT_SECRET || 'nearbuy_dev_secret_key_123';

        if (!token) {
            return new Response(JSON.stringify({ message: 'Token required' }), { status: 401 });
        }

        const payload = await _verifyJWT(token, secret);
        if (!payload) {
            return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }
        if (payload.role !== 'founder') {
            return new Response(JSON.stringify({ message: 'Founder accounts only' }), { status: 403 });
        }

        if (!env.COLLAB_TRACKER) {
            return new Response('CollabTracker binding missing', { status: 500 });
        }

        const id   = env.COLLAB_TRACKER.idFromName('global');
        const stub = env.COLLAB_TRACKER.get(id);
        return stub.fetch(request); // Direct forwarding — no SvelteKit interference
    }

    // Everything else goes through SvelteKit normally
    return sveltekit_export.fetch(request, env, ctx);
}
`;

if (!workerCode.includes('_wrapped_fetch_handler')) {
    // Inject the helper functions
    workerCode += WS_BYPASS_FUNC;

    // Detect export style
    if (workerCode.includes('export default {')) {
        // Style 1: export default { fetch(...) { ... } }
        workerCode = workerCode.replace(
            /export default \{/,
            'const _sveltekit_export = {'
        );
        workerCode += '\nexport default { fetch: (req, env, ctx) => _wrapped_fetch_handler(req, env, ctx, _sveltekit_export) };\n';
        console.log('✅  WebSocket bypass patch injected (Style 1).');
    } else if (workerCode.includes('worker_default as default')) {
        // Style 2: export { worker_default as default }
        workerCode = workerCode.replace(
            /worker_default as default/,
            '_wrapped_fetch as default'
        );
        workerCode += '\nconst _wrapped_fetch = { fetch: (req, env, ctx) => _wrapped_fetch_handler(req, env, ctx, worker_default) };\n';
        console.log('✅  WebSocket bypass patch injected (Style 2).');
    } else {
        console.warn('⚠️  Could not detect export style in _worker.js. Bypass not injected.');
    }
} else {
    console.log('ℹ️   WebSocket bypass already present, skipping.');
}

writeFileSync(workerPath, workerCode, 'utf-8');
console.log('✅  _worker.js patched successfully.');
