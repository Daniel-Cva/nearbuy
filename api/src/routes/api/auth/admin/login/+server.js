import { json } from '@sveltejs/kit';
import { verifyPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();
        
        // Admins can log in via email or mobile
        const email = body.email || null;
        const mobile = body.mobile || null;
        const password = body.password;

        if ((!email && !mobile) || !password) {
            return json({ message: 'Email or mobile, and password are required' }, { status: 400 });
        }

        const db = platform.env.DB;

        // Fetch Admin login info
        const admin = await db.prepare(
            'SELECT id, password_hash, email, username FROM sa_login WHERE email = ? OR mobile = ?'
        ).bind(email, mobile).first();

        // Check password validity
        const isValid = admin ? await verifyPassword(password, admin.password_hash) : false;

        if (!isValid) {
            // Log failed attempt if admin exists but password wrong
            if (admin) {
                await db.prepare('INSERT INTO sa_login_log (log_id, said, ip, success_status) VALUES (?, ?, ?, ?)')
                    .bind(ulid(), admin.id, request.headers.get('CF-Connecting-IP') || 'unknown', 0)
                    .run();
                return json({ message: 'Password is wrong' }, { status: 401 });
            } else {
                let errorType = 'email';
                if (mobile) errorType = 'mobile';
                return json({ message: `The ${errorType} is not registered with ${PUBLIC_APP_NAME}. Create a new account or try another registered email.` }, { status: 401 });
            }
        }

        // Log successful login
        await db.prepare('INSERT INTO sa_login_log (log_id, said, ip, success_status) VALUES (?, ?, ?, ?)')
            .bind(ulid(), admin.id, request.headers.get('CF-Connecting-IP') || 'unknown', 1)
            .run();

        const token = await createToken({ 
            id: admin.id, 
            userid: admin.id,
            username: admin.username,
            role: 'admin' 
        }, platform.env.JWT_SECRET);

        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Session requires HTTPS
            sameSite: 'none',
            maxAge: 5 * 60 * 60 // 5 hours
        });

        return json({
            login_status: 'success',
            user: {
                id: admin.id,
                username: admin.username
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Admin Login Error:", error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
