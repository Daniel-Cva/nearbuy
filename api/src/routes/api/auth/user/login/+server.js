import { json } from '@sveltejs/kit';
import { verifyPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** 
 * Nearbuy API - User Login
 * 
 * Flow:
 * 1. Accept email/mobile and password from request body
 * 2. Lookup user in user_login by email or mobile
 * 3. Verify bcrypt password hash
 * 4. Generate short-lived JWT (5m expiry)
 * 5. Retrieve full profile from user_data
 * 6. (Optional) Audit log the login attempt
 * 
 * @type {import('./$types').RequestHandler} 
 */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();
        const { email, mobile, username, password } = body;

        // ── Step 1: Validation ────────────────────────────────────────────────
        // Require at least one identifier (email, mobile, or username) and a password
        if ((!email && !mobile && !username) || !password) {
            return json({ 
                message: 'Identifier (Email, Mobile, or Username) and password are required' 
            }, { status: 400 });
        }

        const db = platform.env.DB;
        const identifier = email || mobile || username;

        // ── Step 2: Authentication ────────────────────────────────────────────
        // Search in user_login for matching record using any identifier
        const loginRecord = await db.prepare(
            'SELECT id, username, email, mobile, password_hash FROM user_login WHERE email = ? OR mobile = ? OR username = ?'
        ).bind(identifier, identifier, identifier).first();

        if (!loginRecord) {
            let errorType = 'email';
            if (username) errorType = 'username';
            if (mobile) errorType = 'mobile';
            return json({ message: `The ${errorType} is not registered with ${PUBLIC_APP_NAME}. Create a new account or try another registered email.` }, { status: 401 });
        }

        // Verify password using bcryptjs (via lib/server/auth)
        const isMatch = await verifyPassword(password, loginRecord.password_hash);
        if (!isMatch) {
            try {
                const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
                await db.prepare(
                    'INSERT INTO user_login_log (log_id, userid, ip, success_status) VALUES (?, ?, ?, ?)'
                ).bind(ulid(), loginRecord.id, clientIp, 0).run();
            } catch (e) {
                console.warn('Failed to log failed login attempt:', e);
            }
            return json({ message: 'Password is wrong' }, { status: 401 });
        }

        // ── Step 3: Data Retrieval ────────────────────────────────────────────
        // Fetch full profile from user_data using the linked email
        const profile = await db.prepare(
            'SELECT * FROM user_data WHERE email = ?'
        ).bind(loginRecord.email).first();

        // ── Step 4: Token Generation ──────────────────────────────────────────
        const token = await createToken(
            { 
                userid: loginRecord.id, 
                email: loginRecord.email, 
                username: loginRecord.username, 
                role: 'user' 
            }, 
            platform.env.JWT_SECRET
        );

        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Forces cookie to work over HTTPS
            sameSite: 'none',
            maxAge: 180 * 60 // 3 hours
        });

        // ── Step 5: Audit Logging ─────────────────────────────────────────────
        // Log successful login attempt
        try {
            const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
            await db.prepare(
                'INSERT INTO user_login_log (log_id, userid, ip, success_status) VALUES (?, ?, ?, ?)'
            ).bind(ulid(), profile?.id || loginRecord.id, clientIp, 1).run();
        } catch (logError) {
            console.warn('Failed to log login attempt:', logError);
            // Don't fail the request if logging fails
        }

        const rawInterests = profile?.interests ? JSON.parse(profile.interests) : [];

        // ── Response ──────────────────────────────────────────────────────────
        return json({
            login_status: 'success',
            id: loginRecord.id
        }, { status: 200 });

    } catch (error) {
        console.error('Login internal error:', error);
        return json({ 
            message: 'Internal server error', 
            error: error.message 
        }, { status: 500 });
    }
}
