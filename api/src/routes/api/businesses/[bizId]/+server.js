import { json } from '@sveltejs/kit';

/**
 * PUBLIC Route: GET business profile
 * PRIVATE Routes: PUT, PATCH, DELETE business profile
 */

export async function GET({ params, platform }) {
    try {
        const { bizId } = params;
        const db = platform.env.DB;

        const business = await db.prepare('SELECT * FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!business) return json({ message: 'Business not found' }, { status: 404 });

        return json({ message: 'Business profile fetched successfully', business });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

export async function PUT({ params, request, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        if (!payload || payload.bizId !== bizId || !['founder', 'manager'].includes(payload.role)) {
            return json({ message: 'Unauthorized: only founder or manager can update' }, { status: 403 });
        }

        const body = await request.json();
        const db = platform.env.DB;

        const { bname, btype, about, address, city, district, state, pincode, avatar_url, categories, theme } = body;

        await db.prepare(`
            UPDATE biz_data SET
                bname = ?, btype = ?, about = ?,
                address = ?, city = ?, district = ?, state = ?, pincode = ?,
                avatar_url = ?, categories = ?, theme = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            bname ?? null, btype ?? 'product', about ?? null,
            address ?? null, city ?? null, district ?? null, state ?? null, pincode ?? null,
            avatar_url ?? null,
            JSON.stringify(Array.isArray(categories) ? categories : []),
            theme ?? 'light',
            bizId
        ).run();

        return json({ message: 'Business profile updated successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

export async function PATCH({ params, request, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        if (!payload || !['founder', 'manager'].includes(payload.role)) {
            return json({ message: 'Unauthorized' }, { status: 403 });
        }

        if (payload.bizId !== bizId) {
            return json({ message: 'Forbidden: you do not own this business profile' }, { status: 403 });
        }

        const body = await request.json();
        const db = platform.env.DB;

        const allowed = ['bname', 'btype', 'about', 'address', 'city', 'district', 'state', 'pincode', 'avatar_url', 'theme'];
        const fields = [];
        const values = [];

        for (const key of allowed) {
            if (body[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(body[key]);
            }
        }

        if (body.categories !== undefined && Array.isArray(body.categories)) {
            fields.push('categories = ?');
            values.push(JSON.stringify(body.categories));
        }

        if (fields.length === 0) return json({ message: 'No valid fields provided' }, { status: 400 });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(bizId);

        await db.prepare(`UPDATE biz_data SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

        return json({ message: 'Business profile updated successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

export async function DELETE({ params, platform, locals, cookies }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        if (!payload || payload.bizId !== bizId || payload.role !== 'founder') {
            return json({ message: 'Unauthorized: only the founder may delete this business' }, { status: 403 });
        }

        const db = platform.env.DB;

        await db.batch([
            db.prepare('DELETE FROM biz_login WHERE biz_id = ?').bind(bizId),
            db.prepare('DELETE FROM biz_staffs WHERE biz_id = ?').bind(bizId),
            db.prepare('DELETE FROM biz_activity_log WHERE bizid = ?').bind(bizId),
            db.prepare('DELETE FROM biz_data WHERE id = ?').bind(bizId),
        ]);

        cookies.delete('token', { 
            path: '/',
            secure: true,
            sameSite: 'none'
        });

        return json({ message: 'Business account deleted successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
