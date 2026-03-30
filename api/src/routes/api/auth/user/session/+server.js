import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

/**
 * Nearbuy API - Session Check
 * 
 * Flow:
 * 1. Extract token from secure HTTP-only cookie
 * 2. Cryptographically verify and look up in session registry
 * 3. Return the payload contents (userid, email, username, role)
 * 
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ cookies, platform }) {
    try {
        const token = cookies.get('token');

        if (!token) {
            return json({ 
                authenticated: false, 
                message: 'No session token found' 
            }, { status: 401 });
        }

        const secret = platform.env.JWT_SECRET;
        const payload = await verifyToken(token, secret);

        if (!payload) {
            return json({ 
                authenticated: false, 
                message: 'Invalid or expired session' 
            }, { status: 401 });
        }

        // Return the decrypted/verified payload
        return json({
            authenticated: true,
            session: {
                userid: payload.userid,
                email: payload.email,
                username: payload.username,
                role: payload.role || 'user'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Session check error:', error);
        return json({ 
            authenticated: false, 
            message: 'Internal server error',
            error: error.message 
        }, { status: 500 });
    }
}
