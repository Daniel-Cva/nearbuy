import { json } from '@sveltejs/kit';

/**
 * Path: /api/reports/business/[reportId]
 */
export async function GET({ params, platform, locals }) {
    try {
        const { reportId } = params;
        const payload = locals.user;
        if (!payload) return json({ message: 'Unauthorized' }, { status: 401 });

        const db = platform.env.DB;
        const report = await db.prepare('SELECT * FROM reports WHERE id = ? AND type = ?').bind(reportId, 'business').first();

        if (!report) return json({ message: 'Report not found' }, { status: 404 });

        // Security: only admins or the person who reported it can view
        if (payload.role !== 'admin' && report.reportedBy !== (payload.id || payload.userid)) {
            return json({ message: 'Forbidden' }, { status: 403 });
        }

        // optionally fetch business name for convenience
        const target = await db.prepare('SELECT bname FROM biz_data WHERE id = ?').bind(report.targetId).first();
        if (target) report.targetName = target.bname;

        return json({ message: 'Report fetched successfully', report });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
