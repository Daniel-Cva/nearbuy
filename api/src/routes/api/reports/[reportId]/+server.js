import { json } from '@sveltejs/kit';

/**
 * Path: /api/reports/[reportId]
 * Route: DELETE (Remove an invalid/spam report entirely)
 */
export async function DELETE({ params, platform, locals }) {
    try {
        const { reportId } = params;
        const payload = locals.user;
        
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const db = platform.env.DB;

        const report = await db.prepare('SELECT id FROM reports WHERE id = ?').bind(reportId).first();
        if (!report) {
            return json({ message: 'Report not found' }, { status: 404 });
        }

        await db.prepare('DELETE FROM reports WHERE id = ?').bind(reportId).run();

        return json({ message: 'Report deleted successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
