import { json } from '@sveltejs/kit';

/**
 * Path: /api/reports
 * Super Admin Management: View all reports dynamically with optional filters
 */
export async function GET({ platform, locals, url }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const db = platform.env.DB;

        // Extract pagination and filters safely
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        const status = url.searchParams.get('status'); // 'open', 'resolved', 'closed'
        const type = url.searchParams.get('type');     // 'business', 'user'

        const whereClauses = [];
        const bindValues = [];

        if (status) {
            whereClauses.push('status = ?');
            bindValues.push(status);
        }

        if (type) {
            whereClauses.push('type = ?');
            bindValues.push(type);
        }

        const whereString = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Run queries in parallel
        const [totalRes, reports] = await db.batch([
            db.prepare(`SELECT COUNT(*) as total FROM reports ${whereString}`).bind(...bindValues),
            db.prepare(`
                SELECT * FROM reports 
                ${whereString} 
                ORDER BY createdAt DESC 
                LIMIT ? OFFSET ?
            `).bind(...bindValues, limit, offset)
        ]);

        const totalReports = totalRes.results[0]?.total || 0;

        return json({
            message: 'Reports fetched successfully',
            reports: reports.results,
            pagination: {
                total: totalReports,
                page,
                limit,
                totalPages: Math.ceil(totalReports / limit)
            }
        });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
