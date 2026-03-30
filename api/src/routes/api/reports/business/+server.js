import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * Path: /api/reports/business
 */
export async function POST({ request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload) return json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { targetId, reason, details } = body;

        if (!targetId || !reason) {
            return json({ message: 'targetId and reason are required' }, { status: 400 });
        }

        const db = platform.env.DB;
        const reportId = 'rep_biz_' + ulid();

        // 1. Verify target business exists
        const bizExists = await db.prepare('SELECT id FROM biz_data WHERE id = ?').bind(targetId).first();
        if (!bizExists) return json({ message: 'Target business not found' }, { status: 404 });

        // 2. Insert report
        await db.prepare(`
            INSERT INTO reports (id, type, targetId, reportedBy, reason, details)
            VALUES (?, 'business', ?, ?, ?, ?)
        `).bind(reportId, targetId, payload.id || payload.userid, reason, details || null).run();

        return json({ message: 'Business reported successfully', reportId }, { status: 201 });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
