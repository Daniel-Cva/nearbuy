import { json } from '@sveltejs/kit';
import { hashPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();

        const { firstname, lastname, email, password, username } = body;

        if (!email || !password) {
            return json({ message: 'Email and password are required' }, { status: 400 });
        }
        if (!firstname || !lastname) {
            return json({ message: 'First name and last name are required' }, { status: 400 });
        }

        const { pincode, city, district, state } = body;
        const mobile    = body.mobile    || null;
        const address   = body.address   || null;
        const avatarUrl = body.avatar_url || null;

        const rawInterests = Array.isArray(body.interests) ? body.interests : [];
        const interests    = JSON.stringify(rawInterests.slice(0, 10));

        const db = platform.env.DB;

        // ── Duplicate checks ─────────────────────────────────────────────────
        const existingEmail = await db.prepare('SELECT id FROM user_login WHERE email = ?').bind(email).first();
        if (existingEmail) return json({ message: `Email is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });

        if (mobile) {
            const existingMobile = await db.prepare('SELECT id FROM user_login WHERE mobile = ?').bind(mobile).first();
            if (existingMobile) return json({ message: `Mobile is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });
        }

        if (username) {
            const existingUsername = await db.prepare('SELECT id FROM user_login WHERE username = ?').bind(username).first();
            if (existingUsername) return json({ message: 'Username is already taken.' }, { status: 400 });
        }

        const userId         = 'usr_' + ulid();
        const hashedPassword = await hashPassword(password);
        const finalUsername  = username || (email.substring(0, email.indexOf('@')) + '_' + userId.slice(-4));

        // ── Atomic insert ────────────────────────────
        await db.batch([
            db.prepare(
                'INSERT INTO user_login (id, username, email, mobile, password_hash) VALUES (?, ?, ?, ?, ?)'
            ).bind(userId, finalUsername, email, mobile, hashedPassword),

            db.prepare(
                `INSERT INTO user_data (id, username, email, phone, firstname, lastname, city, pincode, district, state, interests, address, avatar_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                userId, finalUsername, email,
                mobile,      // stored as 'phone' in user_data
                firstname, lastname,
                city || null, pincode || null, district || null, state || null,
                interests, address, avatarUrl
            )
        ]);

        // ── HttpOnly cookie — JWT lives only on the server side ───────────────
        const secret = platform.env.JWT_SECRET || 'nearbuy_dev_secret_key_123';
        const token = await createToken({ 
            userid: userId, 
            role: 'user', 
            firstname 
        }, secret);

        cookies.set('token', token, {
            path:     '/',
            httpOnly: true,   // JS cannot read this
            secure:   true,
            sameSite: 'none',
            maxAge:   3 * 60 * 60  // 3 hours
        });

        // Cookie-only auth — no token or profile data in the response body
        return json({ message: 'Account created successfully' }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
