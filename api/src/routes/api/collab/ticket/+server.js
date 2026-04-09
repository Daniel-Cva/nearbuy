/**
 * GET /api/collab/ticket
 *
 * Reads the httpOnly JWT cookie (which JS cannot access directly),
 * verifies it, and returns a short-lived plaintext ticket the frontend
 * can safely embed in the WebSocket URL query string.
 *
 * The ticket IS the same JWT — we just expose it once for the WS handshake.
 */
import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

export async function GET({ cookies, platform }) {
    try {
        const token = cookies.get('token');

        if (!token) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }

        const secret = platform.env.JWT_SECRET || 'nearbuy_dev_secret_key_123';
        const payload = await verifyToken(token, secret);

        if (!payload) {
            return json({ error: 'Invalid or expired session' }, { status: 401 });
        }

        if (payload.role !== 'founder') {
            return json({ error: 'Founder accounts only' }, { status: 403 });
        }

        // Return the token so the UI can use it in the WebSocket URL
        return json({ ticket: token });

    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
