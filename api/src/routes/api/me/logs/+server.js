import { json } from '@sveltejs/kit';

/**
 * GET: Fetch the activity history for the authenticated user/business.
 * Path: /api/me/logs
 */
export async function GET({ platform, locals, url }) {
    try {
        const payload = locals.user;
        if (!payload) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const db = platform.env.DB;
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        let query = '';
        let countQuery = '';
        let targetId = '';

        if (payload.role === 'admin') {
            // My actions as an Admin
            targetId = payload.id || payload.userid;
            query = 'SELECT nos, action, timestamp FROM sa_activity_log WHERE said = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM sa_activity_log WHERE said = ?';
        } else if (payload.role === 'user') {
            // My actions as a Shopper
            targetId = payload.id || payload.userid;
            query = 'SELECT nos, action, timestamp FROM user_activity_log WHERE userid = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM user_activity_log WHERE userid = ?';
        } else {
            // Actions performed within my Business (Founders/Managers/Staff)
            targetId = payload.bizId;
            if (!targetId) {
                return json({ message: 'No business associated with this account' }, { status: 400 });
            }
            query = 'SELECT nos, action, timestamp FROM biz_activity_log WHERE bizid = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            countQuery = 'SELECT COUNT(*) as total FROM biz_activity_log WHERE bizid = ?';
        }

        const [totalRes, logs] = await db.batch([
            db.prepare(countQuery).bind(targetId),
            db.prepare(query).bind(targetId, limit, offset)
        ]);

        const total = totalRes.results[0]?.total || 0;

        return json({
            message: 'Activity logs fetched successfully',
            logs: logs.results,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (e) {
        console.error('Logs Fetch Error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
