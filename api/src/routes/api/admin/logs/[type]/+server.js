import { json } from '@sveltejs/kit';

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { type } = params;
        const db = platform.env.DB;
        let query = '';

        if (type === 'users') {
            query = 'SELECT l.*, u.email FROM user_activity_log l LEFT JOIN user_data u ON l.userid = u.id ORDER BY l.timestamp DESC LIMIT 100';
        } else if (type === 'businesses') {
            query = 'SELECT l.*, b.bname, b.bemail FROM biz_activity_log l LEFT JOIN biz_data b ON l.bizid = b.id ORDER BY l.timestamp DESC LIMIT 100';
        } else if (type === 'sa') {
            query = 'SELECT l.*, s.email FROM sa_activity_log l LEFT JOIN sa_login s ON l.said = s.id ORDER BY l.timestamp DESC LIMIT 100';
        } else {
            return json({ message: 'Invalid log type requested. Supported: users, businesses, sa' }, { status: 400 });
        }

        const logs = await db.prepare(query).all();
        return json({ message: `${type} logs fetched`, logs: logs.results });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
