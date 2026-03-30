import { json } from '@sveltejs/kit';

/**
 * Path: /api/businesses/[bizId]/staff/[id]
 * Inspect, edit, or delete a staff profile within a given business.
 */

// ── GET: Inspect staff profile ─────────────────────────────────────────────
export async function GET({ params, platform, locals }) {
    try {
        const { bizId, id } = params;
        const payload = locals.user;

        // Security check: must be a member of this business
        if (!payload || payload.bizId !== bizId) {
            return json({ message: 'Unauthorized: you are not part of this business' }, { status: 403 });
        }

        const db = platform.env.DB;

        // Try to fetch from biz_staffs first
        let profile = await db.prepare('SELECT id, biz_id, name, email, role, phone, location, avatar_url, created_at, status FROM biz_staffs WHERE id = ? AND biz_id = ?')
            .bind(id, bizId)
            .first();

        // If not found in staffs, try checking if it's the founder
        if (!profile) {
            profile = await db.prepare('SELECT id, biz_id, name, email, phone, avatar_url, created_at FROM founder WHERE id = ? AND biz_id = ?')
                .bind(id, bizId)
                .first();
            if (profile) profile.role = 'founder';
        }

        if (!profile) return json({ message: 'Staff profile not found' }, { status: 404 });

        return json({ message: 'Staff profile fetched successfully', profile });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── PUT: Edit staff profile ────────────────────────────────────────────────
export async function PUT({ params, request, platform, locals }) {
    try {
        const { bizId, id } = params;
        const payload = locals.user;
        
        // 1. Authenticate Request
        if (!payload || payload.bizId !== bizId || !['founder', 'manager'].includes(payload.role)) {
            return json({ message: 'Unauthorized. Only business founders/managers can edit staff.' }, { status: 403 });
        }

        const body = await request.json();
        const db = platform.env.DB;

        // Validate the target staff belongs to the business and fetches their current role
        const targetStaff = await db.prepare('SELECT id, role, email FROM biz_staffs WHERE id = ? AND biz_id = ?').bind(id, bizId).first();
        if (!targetStaff) {
            // Check if they are accidentally trying to edit the founder this way
            const isFounder = await db.prepare('SELECT id FROM founder WHERE id = ? AND biz_id = ?').bind(id, bizId).first();
            if (isFounder) {
                return json({ message: 'Cannot edit the founder profile through this route. The founder must use /api/me' }, { status: 403 });
            }
            return json({ message: 'Staff profile not found' }, { status: 404 });
        }

        const { name, role, email, phone, location, status } = body;
        
        const profileUpdates = [];
        const profileValues = [];
        const loginUpdates = [];
        const loginValues = [];

        if (name !== undefined) { profileUpdates.push('name = ?'); profileValues.push(name); }
        if (role !== undefined && ['staff', 'manager'].includes(role)) { 
            profileUpdates.push('role = ?'); profileValues.push(role);
            loginUpdates.push('role = ?'); loginValues.push(role);
        }
        if (email !== undefined) { 
            profileUpdates.push('email = ?'); profileValues.push(email); 
            loginUpdates.push('email = ?'); loginValues.push(email);
        }
        if (phone !== undefined) { 
            profileUpdates.push('phone = ?'); profileValues.push(phone); 
            loginUpdates.push('mobile = ?'); loginValues.push(phone);
        }
        if (location !== undefined) { profileUpdates.push('location = ?'); profileValues.push(location); }
        if (status !== undefined) { profileUpdates.push('status = ?'); profileValues.push(status); }

        const batch = [];
        if (profileUpdates.length > 0) {
            batch.push(
                db.prepare(`UPDATE biz_staffs SET ${profileUpdates.join(', ')} WHERE id = ? AND biz_id = ?`)
                  .bind(...profileValues, id, bizId)
            );
        }

        if (loginUpdates.length > 0) {
            batch.push(
                db.prepare(`UPDATE biz_login SET ${loginUpdates.join(', ')} WHERE id = ? AND biz_id = ?`)
                  .bind(...loginValues, id, bizId)
            );
        }

        if (batch.length === 0) {
            return json({ message: 'No valid fields provided to update.' }, { status: 400 });
        }

        await db.batch(batch);

        return json({ message: 'Staff profile updated successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── DELETE: Remove staff profile ───────────────────────────────────────────
export async function DELETE({ params, platform, locals }) {
    try {
        const { bizId, id } = params;
        const payload = locals.user;
        
        // 1. Authenticate Request
        if (!payload || payload.bizId !== bizId || !['founder', 'manager'].includes(payload.role)) {
            return json({ message: 'Unauthorized. Only business founders/managers can delete staff.' }, { status: 403 });
        }

        // Prevent self-deletion
        if (payload.id === id || payload.userid === id) {
            return json({ message: 'You cannot delete your own account through this route.' }, { status: 400 });
        }

        const db = platform.env.DB;

        // Validate the target staff belongs to the business
        const targetStaff = await db.prepare('SELECT id, role FROM biz_staffs WHERE id = ? AND biz_id = ?').bind(id, bizId).first();
        if (!targetStaff) {
             const isFounder = await db.prepare('SELECT id FROM founder WHERE id = ? AND biz_id = ?').bind(id, bizId).first();
             if (isFounder) return json({ message: 'The founder profile cannot be deleted.' }, { status: 403 });
             return json({ message: 'Staff profile not found.' }, { status: 404 });
        }

        // Manager cannot delete another manager
        if (payload.role === 'manager' && targetStaff.role === 'manager') {
             return json({ message: 'Managers cannot delete other managers.' }, { status: 403 });
        }

        // Atomically delete from both biz_staffs and biz_login
        await db.batch([
            db.prepare('DELETE FROM biz_staffs WHERE id = ? AND biz_id = ?').bind(id, bizId),
            db.prepare('DELETE FROM biz_login WHERE id = ? AND biz_id = ?').bind(id, bizId)
        ]);

        return json({ message: 'Staff profile deleted successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
