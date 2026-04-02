import { json } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/auth';
import { ulid } from 'ulid';

/**
 * Path: /api/me
 * Identity is cross-referenced with the HttpOnly cookie token.
 */

// ── GET: View the authenticated user's profile ─────────────────────────────
export async function GET({ platform, locals }) {
    try {
        const payload = locals.user;
        
        if (!payload) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.id || payload.userid;
        const db = platform.env.DB;
        let profile = null;

        if (payload.role === 'founder') {
            profile = await db.prepare('SELECT id, biz_id, name, email, phone as mobile, avatar_url, bio, collab_mode, created_at FROM founder WHERE id = ?').bind(userId).first();
        } else if (payload.role === 'user') {
            // Support for shoppers / regular users
            profile = await db.prepare('SELECT id, firstname, lastname, email, phone as mobile, address, city, pincode, district, state, avatar_url, theme, interests, status, created_at FROM user_data WHERE id = ?').bind(userId).first();
            if (profile) {
                profile.name = `${profile.firstname} ${profile.lastname}`.trim();
            }
        } else {
            profile = await db.prepare('SELECT id, biz_id, name, email, phone as mobile, role, avatar_url, status, created_at FROM biz_staffs WHERE id = ?').bind(userId).first();
        }

        if (!profile) return json({ message: 'Profile not found' }, { status: 404 });

        return json({ message: 'Profile fetched successfully', profile });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── PUT: Update the authenticated user's profile ────────────────────────────
export async function PUT({ request, platform, locals }) {
    try {
        const payload = locals.user;
        
        if (!payload) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.id || payload.userid;
        const body = await request.json();
        const db = platform.env.DB;

        const { name, email, mobile, password, avatar_url, bio, collab_mode } = body;
        
        const isFounder = payload.role === 'founder';
        const isUser    = payload.role === 'user';
        const table     = isUser ? 'user_data' : (isFounder ? 'founder' : 'biz_staffs');
        
        const profileUpdates = [];
        const profileValues = [];

        // Distinguish between separate names (user) and combined name (founder/staff)
        if (isUser) {
            const { firstname, lastname } = body;
            if (firstname !== undefined) { profileUpdates.push('firstname = ?'); profileValues.push(firstname); }
            if (lastname !== undefined)  { profileUpdates.push('lastname = ?');  profileValues.push(lastname); }
            if (avatar_url !== undefined) { profileUpdates.push('avatar_url = ?'); profileValues.push(avatar_url); }
            if (mobile !== undefined)    { profileUpdates.push('phone = ?');      profileValues.push(mobile); }
            // Optional address fields
            const fields = ['address', 'city', 'district', 'state', 'pincode', 'theme', 'interests'];
            for (const f of fields) {
                if (body[f] !== undefined) {
                    profileUpdates.push(`${f} = ?`);
                    profileValues.push(f === 'interests' ? JSON.stringify(body[f]) : body[f]);
                }
            }
        } else {
            if (name !== undefined)       { profileUpdates.push('name = ?');       profileValues.push(name); }
            if (email !== undefined)      { profileUpdates.push('email = ?');      profileValues.push(email); }
            if (mobile !== undefined)     { profileUpdates.push('phone = ?');      profileValues.push(mobile); }
            if (avatar_url !== undefined) { profileUpdates.push('avatar_url = ?'); profileValues.push(avatar_url); }
            if (isFounder && bio !== undefined)         { profileUpdates.push('bio = ?');         profileValues.push(bio); }
            if (isFounder && collab_mode !== undefined) { profileUpdates.push('collab_mode = ?'); profileValues.push(collab_mode); }
        }
        
        const loginTable = isUser ? 'user_login' : 'biz_login';
        const loginUpdates = [];
        const loginValues = [];
        
        if (email !== undefined) { loginUpdates.push('email = ?'); loginValues.push(email); }
        if (mobile !== undefined) { loginUpdates.push('mobile = ?'); loginValues.push(mobile); }
        if (password) { 
            const hashedPassword = await hashPassword(password);
            loginUpdates.push('password_hash = ?'); 
            loginValues.push(hashedPassword); 
        }

        const batch = [];
        
        if (profileUpdates.length > 0) {
            batch.push(
                db.prepare(`UPDATE ${table} SET ${profileUpdates.join(', ')} WHERE id = ?`)
                  .bind(...profileValues, userId)
            );
        }
        
        if (loginUpdates.length > 0) {
            batch.push(
                db.prepare(`UPDATE ${loginTable} SET ${loginUpdates.join(', ')} WHERE id = ?`)
                  .bind(...loginValues, userId)
            );
        }

        if (batch.length === 0) {
            return json({ message: 'No fields to update provided' }, { status: 400 });
        }

        await db.batch(batch);

        // 3. Log the Activity
        try {
            const entryId = 'log_' + ulid();
            if (isUser) {
                await db.prepare('INSERT INTO user_activity_log (nos, userid, action) VALUES (?, ?, ?)')
                        .bind(entryId, userId, 'Updated Profile Info').run();
            } else if (payload.bizId) {
                await db.prepare('INSERT INTO biz_activity_log (nos, bizid, action) VALUES (?, ?, ?)')
                        .bind(entryId, payload.bizId, `Updated Profile Info for member: ${payload.id}`).run();
            } else if (payload.role === 'admin') {
                 await db.prepare('INSERT INTO sa_activity_log (nos, said, action) VALUES (?, ?, ?)')
                        .bind(entryId, userId, 'Updated Admin Profile Info').run();
            }
        } catch (logErr) {
            console.error('Activity Logging failed (silent):', logErr);
        }

        return json({ message: 'Profile updated successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
