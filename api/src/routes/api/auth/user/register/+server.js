import { json } from '@sveltejs/kit';
import { hashPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const body = await request.json();

        // ── Step 1: Identity & Security ───────────────────────────────────────
        const { firstname, lastname, email, password, username } = body;

        if (!email || !password) {
            return json({ message: 'Email and password are required' }, { status: 400 });
        }
        if (!firstname || !lastname) {
            return json({ message: 'First name and last name are required' }, { status: 400 });
        }

        // ── Step 2: Location ──────────────────────────────────────────────────
        const { pincode, city, district, state } = body;

        // ── Mobile ────────────────────────────────────────────────────────────
        const mobile = body.mobile || null;

        // ── Step 3: Interests ─────────────────────────────────────────────────
        const rawInterests = Array.isArray(body.interests) ? body.interests : [];
        // ── Advanced location data parsed from UI ─────────────────────────────
        const address = body.address || null;
        const lat = body.lat ? parseFloat(body.lat) : null;
        const long = body.long ? parseFloat(body.long) : null;
        const avatarUrl = body.avatar_url || null;

        const interests = JSON.stringify(rawInterests.slice(0, 10));

        const db = platform.env.DB;

        // Check if user already exists and give accurate reason
        const existingEmail = await db.prepare('SELECT id FROM user_login WHERE email = ?').bind(email).first();
        if (existingEmail) return json({ message: `The email is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });

        if (mobile) {
            const existingMobile = await db.prepare('SELECT id FROM user_login WHERE mobile = ?').bind(mobile).first();
            if (existingMobile) return json({ message: `The mobile is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });
        }

        if (username) {
            const existingUsername = await db.prepare('SELECT id FROM user_login WHERE username = ?').bind(username).first();
            if (existingUsername) return json({ message: `The username is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });
        }

        const userId = 'usr_' + ulid(); // Generate primary key with custom prefix
        const hashedPassword = await hashPassword(password);
        
        // Use UI provided username, or auto-generate a fallback (e.g. jdoe_3f22 from jdoe@email.com and ID ...3f22)
        const finalUsername = username || (email.substring(0, email.indexOf('@')) + '_' + userId.slice(-4));

        // Insert into both tables atomically and create dynamic user request table
        await db.batch([
            db.prepare(
                'INSERT INTO user_login (id, username, email, mobile, password_hash) VALUES (?, ?, ?, ?, ?)'
            ).bind(userId, finalUsername, email, mobile, hashedPassword),

            db.prepare(
                `INSERT INTO user_data
                    (id, username, email, phone, firstname, lastname, city, pincode, district, state, interests, address, avatar_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                userId,
                finalUsername,
                email,
                mobile,
                firstname,
                lastname,
                city    || null,
                pincode || null,
                district|| null,
                state   || null,
                interests,
                address,
                avatarUrl
            ),

            db.prepare(`
                CREATE TABLE IF NOT EXISTS user_${finalUsername}_request (
                    request_id TEXT PRIMARY KEY NOT NULL,
                    description TEXT NOT NULL,
                    main_category TEXT,
                    sub_categories TEXT DEFAULT '[]',
                    lat REAL NOT NULL,
                    long REAL NOT NULL,
                    city TEXT NOT NULL,
                    district TEXT NOT NULL,
                    pincode TEXT NOT NULL,
                    address TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'accepted', 'b_completed', 'completed')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `)
        ]);

        const token = await createToken(
            { id: userId, userid: userId, role: 'user' },
            platform.env.JWT_SECRET
        );

        // Set token as HttpOnly cookie (Client Browser) for 15 minutes
        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Only allows cookie over HTTPS
            sameSite: 'none',
            maxAge: 15 * 60
        });

        return json({
            message: 'user created successfully',
            status: 'success'
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
