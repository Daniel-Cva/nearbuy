import { json } from '@sveltejs/kit';
import { verifyPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();
        
        // Accept email, mobile, or username
        const email = body.email || null;
        const mobile = body.mobile || null;
        const username = body.username || null;
        const password = body.password;

        if ((!email && !mobile && !username) || !password) {
            return json({ message: 'Email, mobile, or username, and password are required' }, { status: 400 });
        }

        const db = platform.env.DB;
        const identifier = email || mobile || username;

        // Find the business credential by any identifier
        const cred = await db.prepare(
            'SELECT id, biz_id, username, role, password_hash, email FROM biz_login WHERE email = ? OR mobile = ? OR username = ?'
        ).bind(identifier, identifier, identifier).first();

        // Check password validity
        const isValid = cred ? await verifyPassword(password, cred.password_hash) : false;

        if (!isValid) {
            // Log failed attempt if cred is found but password wrong
            if (cred) {
                await db.prepare('INSERT INTO biz_login_log (log_id, bizid, ip, success_status) VALUES (?, ?, ?, ?)')
                    .bind(ulid(), cred.biz_id, request.headers.get('CF-Connecting-IP') || 'unknown', 0)
                    .run();
                return json({ message: 'Password is wrong' }, { status: 401 });
            } else {
                let errorType = 'email';
                if (username) errorType = 'username';
                if (mobile) errorType = 'mobile';
                return json({ message: `The ${errorType} is not registered with ${PUBLIC_APP_NAME}. Create a new account or try another registered email.` }, { status: 401 });
            }
        }

        // Fetch complete business profile using biz_id
        const bizData = await db.prepare('SELECT * FROM biz_data WHERE id = ?').bind(cred.biz_id).first();
        
        if (!bizData || bizData.status === 'pending') {
            return json({ message: 'Your business account is currently pending verification by the Super Admin and cannot login yet.' }, { status: 403 });
        }

        if (bizData.status === 'banned') {
            return json({ message: 'Your business has been restricted or banned.' }, { status: 403 });
        }
        
        // Fetch personal profile based on their role
        let userProfile = null;
        if (cred.role === 'founder') {
            userProfile = await db.prepare('SELECT id, name, email, phone, avatar_url FROM founder WHERE id = ?').bind(cred.id).first();
        } else if (cred.role === 'staff') {
            userProfile = await db.prepare('SELECT id, name, email, mobile, role, location FROM biz_staffs WHERE id = ?').bind(cred.id).first();
        }

        // Log successful login
        await db.prepare('INSERT INTO biz_login_log (log_id, bizid, ip, success_status) VALUES (?, ?, ?, ?)')
            .bind(ulid(), cred.biz_id, request.headers.get('CF-Connecting-IP') || 'unknown', 1)
            .run();

        const token = await createToken({ 
            id: cred.id, 
            userid: cred.id,
            bizId: cred.biz_id, 
            role: cred.role 
        }, platform.env.JWT_SECRET);

        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Requires session capture over HTTPS
            sameSite: 'none',
            maxAge: 5 * 60 * 60 // 5 hours
        });

        return json({
            login_status: 'success',
            profile: userProfile || { id: cred.id, name: cred.username, email: cred.email, biz_id: cred.biz_id },
            business: bizData,
            userid: cred.id,
            role: cred.role
        }, { status: 200 });

    } catch (error) {
        console.error("Login error:", error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
