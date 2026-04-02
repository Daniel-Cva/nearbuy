import { json } from '@sveltejs/kit';

/**
 * PATH: /api/me/request/[id]
 */

// ── GET: Inspect a specific requirement ─────────────────────────────────────
export async function GET({ params, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId     = payload.id;
        const requestId  = params.id;
        const db         = platform.env.DB;
        const tableName  = `user_${userId}_request`;

        const request = await db.prepare(`SELECT * FROM ${tableName} WHERE request_id = ?`).bind(requestId).first();
        if (!request) return json({ message: 'Requirement not found' }, { status: 404 });

        // Parse JSON fields
        request.description = JSON.parse(request.description || '{}');
        request.category   = JSON.parse(request.category || '[]');
        request.sub_categories = JSON.parse(request.sub_categories || '[]');

        return json({ request });

    } catch (e) {
        console.error('Error fetching requirement detail:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── DELETE: Close or Delete a requirement ──────────────────────────────────
export async function DELETE({ params, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId     = payload.id;
        const requestId  = params.id;
        const db         = platform.env.DB;
        const tableName  = `user_${userId}_request`;

        await db.prepare(`UPDATE ${tableName} SET status = 'closed' WHERE request_id = ?`).bind(requestId).run();
        
        return json({ message: 'Requirement closed successfully' });

    } catch (e) {
        console.error('Error closing requirement:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
