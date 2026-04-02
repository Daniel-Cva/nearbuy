import { json } from '@sveltejs/kit';

export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'admin') {
            return json({message: 'Unauthorized. Super Admin access only.'}, {status: 401});
        }
        
        const body = await request.json(); // expect status: 'resolved' or 'closed', plus resolutionNotes
        const db = platform.env.DB;

        await db.prepare('UPDATE reports SET status = ?, resolutionNotes = ?, resolvedAt = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(body.status, body.resolutionNotes || null, params.reportId).run();

        return json({ message: 'Report resolved successfully' }, { status: 200 });
    } catch(err) {
        return json({ error: err.message }, { status: 500 });
    }
}
