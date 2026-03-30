import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * Path: /api/reports/user
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
        const reportId = 'rep_usr_' + ulid();

        // 1. Verify target user exists
        const userExists = await db.prepare('SELECT id FROM user_data WHERE id = ?').bind(targetId).first();
        if (!userExists) return json({ message: 'Target user not found' }, { status: 404 });

        // 2. Insert report
        await db.prepare(`
            INSERT INTO reports (id, type, targetId, reportedBy, reason, details)
            VALUES (?, 'user', ?, ?, ?, ?)
        `).bind(reportId, targetId, payload.id || payload.userid, reason, details || null).run();

        return json({ message: 'User reported successfully', reportId }, { status: 201 });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
