import { json } from '@sveltejs/kit';

/**
 * Path: /api/reports/[reportId]/resolve
 * SUPER ADMIN Route: Resolve a report and add mitigation notes.
 */
export async function PUT({ params, request, platform, locals }) {
    try {
        const { reportId } = params;
        const payload = locals.user;
        
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const body = await request.json();
        const { status, resolutionNotes } = body;

        // Default to closing/resolving the report natively
        const newStatus = status === 'closed' ? 'closed' : 'resolved';

        const db = platform.env.DB;

        const report = await db.prepare('SELECT id FROM reports WHERE id = ?').bind(reportId).first();
        if (!report) {
            return json({ message: 'Report not found' }, { status: 404 });
        }

        await db.prepare(`
            UPDATE reports 
            SET status = ?, resolutionNotes = ?, resolvedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(newStatus, resolutionNotes || null, reportId).run();

        return json({ message: 'Report resolved successfully' });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
