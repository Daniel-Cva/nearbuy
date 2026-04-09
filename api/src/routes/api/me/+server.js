import { json } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/auth';
import { ulid } from 'ulid';

/**
 * Path: /api/me
 * Identity is cross-referenced with the HttpOnly cookie token.
 */

export async function GET({ platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload) return json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id || payload.userid;
        const db = platform.env.DB;
        let profile = null;

        if (payload.role === 'admin') {
            profile = await db.prepare('SELECT id, email, mobile, username as name, created_at FROM sa_login WHERE id = ?').bind(userId).first();
            if (profile) profile.role = 'admin';
        } else if (payload.role === 'founder') {
            profile = await db.prepare('SELECT id, biz_id, name, email, phone as mobile, avatar_url, bio, collab_mode, created_at FROM founder WHERE id = ?').bind(userId).first();
        } else if (payload.role === 'user') {
            profile = await db.prepare('SELECT id, firstname, lastname, email, phone as mobile, address, city, pincode, district, state, avatar_url, theme, interests, status, created_at FROM user_data WHERE id = ?').bind(userId).first();
            if (profile) {
                profile.name = `${profile.firstname} ${profile.lastname}`.trim();
                if (profile.pincode) profile.pincode = String(profile.pincode).split('.')[0];
                try { profile.interests = profile.interests ? JSON.parse(profile.interests) : []; } catch(e) { profile.interests = []; }
            }
        } else {
            profile = await db.prepare('SELECT id, biz_id, name, email, mobile, role, status, created_at FROM biz_staffs WHERE id = ?').bind(userId).first();
        }

        if (!profile) return json({ message: 'Profile not found' }, { status: 404 });

        let business = null;
        if (profile.biz_id) {
            const bizQuery = `SELECT id, bname, btype as category, emails, phones, address, city, district, state, pincode, lat, long as lng, avatar_url, status, about, created_at FROM biz_data WHERE id = ?`;
            business = await db.prepare(bizQuery).bind(profile.biz_id).first();
            if (business) {
                if (business.pincode) business.pincode = String(business.pincode).split('.')[0];
                try {
                    business.emails = JSON.parse(business.emails || '[]');
                    business.phones = JSON.parse(business.phones || '[]');
                } catch(e) {
                    business.emails = [business.emails];
                    business.phones = [business.phones];
                }
            }
        }

        return json({ 
            message: 'Identity fetched', 
            profile, 
            business,
            role: payload.role 
        });

    } catch (e) {
        console.error('[API ME ERROR]', e.message);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

export async function PUT({ request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload) return json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id || payload.userid;
        const body = await request.json();
        const db = platform.env.DB;

        const { name, email, mobile, password, avatar_url, bio, collab_mode } = body;
        const isFounder = payload.role === 'founder';
        const isUser    = payload.role === 'user';
        const table    = isUser ? 'user_data' : (isFounder ? 'founder' : 'biz_staffs');
        
        const updates = [];
        const vals = [];

        if (isUser) {
            const { firstname, lastname } = body;
            if (firstname !== undefined) { updates.push('firstname = ?'); vals.push(firstname); }
            if (lastname !== undefined)  { updates.push('lastname = ?');  vals.push(lastname); }
            if (avatar_url !== undefined) { updates.push('avatar_url = ?'); vals.push(avatar_url); }
            if (mobile !== undefined)    { updates.push('phone = ?');      vals.push(mobile); }
            const fields = ['address', 'city', 'district', 'state', 'pincode', 'theme', 'interests'];
            for (const f of fields) {
                if (body[f] !== undefined) {
                    updates.push(`${f} = ?`);
                    vals.push(f === 'interests' ? JSON.stringify(body[f]) : body[f]);
                }
            }
        } else {
            if (name !== undefined)       { updates.push('name = ?');       vals.push(name); }
            if (email !== undefined)      { updates.push('email = ?');      vals.push(email); }
            if (mobile !== undefined)     { updates.push('phone = ?');      vals.push(mobile); }
            if (avatar_url !== undefined) { updates.push('avatar_url = ?'); vals.push(avatar_url); }
            if (isFounder && bio !== undefined)         { updates.push('bio = ?');         vals.push(bio); }
            if (isFounder && collab_mode !== undefined) { updates.push('collab_mode = ?'); vals.push(collab_mode); }
        }
        
        if (updates.length > 0) {
            await db.prepare(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`).bind(...vals, userId).run();
        }

        return json({ message: 'Profile updated' });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
