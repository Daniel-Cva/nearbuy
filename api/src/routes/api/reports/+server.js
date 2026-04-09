import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;

        // Reporter is either the user id, or the biz id.
        const reportedBy = locals.user.bizId || locals.user.id || locals.user.userid;
        if (!reportedBy) return json({message: 'Unknown reporter'}, {status: 400});

        const id = 'rpt_' + ulid();
        await db.prepare('INSERT INTO reports (id, type, targetId, reportedBy, reason, details) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(id, body.type, body.targetId, reportedBy, body.reason, body.details || null).run();

        return json({ message: 'Report submitted successfully', id }, { status: 201 });
    } catch(err) {
        return json({ error: err.message }, { status: 500 });
    }
}
