import { json } from '@sveltejs/kit';
import { verifyPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();
        const { email, mobile, username, password } = body;

        if ((!email && !mobile && !username) || !password) {
            return json({ message: 'Email/mobile/username and password are required' }, { status: 400 });
        }

        const db         = platform.env.DB;
        const identifier = email || mobile || username;

        // Real client IP (CF workers → proxies → fallback)
        const clientIp = request.headers.get('CF-Connecting-IP')
            || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
            || 'unknown';

        // ── Lookup user_login ────────────────────────────────────────────────
        // Note: user_login has 'mobile' column (user_data uses 'phone')
        const loginRecord = await db.prepare(
            'SELECT id, username, email, mobile, password_hash FROM user_login WHERE email = ? OR mobile = ? OR username = ?'
        ).bind(identifier, identifier, identifier).first();

        if (!loginRecord) {
            const type = email ? 'email' : mobile ? 'mobile' : 'username';
            return json({ message: `No account found with that ${type} on ${PUBLIC_APP_NAME}.` }, { status: 401 });
        }

        // ── Password verify ───────────────────────────────────────────────────
        const isMatch = await verifyPassword(password, loginRecord.password_hash);
        if (!isMatch) {
            try {
                await db.prepare('INSERT INTO user_login_log (log_id, userid, ip, success_status) VALUES (?, ?, ?, 0)')
                    .bind(ulid(), loginRecord.id, clientIp).run();
            } catch (_) {}
            return json({ message: 'Incorrect password' }, { status: 401 });
        }

        // ── Set HttpOnly session cookie ───────────────────────────────────────
        // JWT is only used server-side to verify the cookie — never sent to browser JS
        const token = await createToken(
            { id: loginRecord.id, userid: loginRecord.id, email: loginRecord.email, username: loginRecord.username, role: 'user' },
            platform.env.JWT_SECRET
        );

        cookies.set('token', token, {
            path:     '/',
            httpOnly: true,   // JS cannot access this
            secure:   true,
            sameSite: 'none',
            maxAge:   3 * 60 * 60  // 3 hours
        });

        // ── Audit log ─────────────────────────────────────────────────────────
        try {
            await db.prepare('INSERT INTO user_login_log (log_id, userid, ip, success_status) VALUES (?, ?, ?, 1)')
                .bind(ulid(), loginRecord.id, clientIp).run();
        } catch (_) {}

        // Cookie-only auth — UI calls /api/me separately when it needs profile data
        return json({ 
            message: 'Logged in successfully',
            user: {
                id: loginRecord.id,
                username: loginRecord.username,
                email: loginRecord.email,
                role: 'user'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Login error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
