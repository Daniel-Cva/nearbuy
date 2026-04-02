import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, platform, locals }) {
    try {
        const { id: bizId } = params;
        const db = platform.env.DB;

        // 1. Authorization: Only Super Admin can approve
        const adminPayload = locals.user;
        if (!adminPayload || adminPayload.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Existing check
        const biz = await db.prepare('SELECT status, bname, username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz) {
            return json({ message: 'Business not found' }, { status: 404 });
        }

        if (!biz.username) {
            return json({ message: 'Business username not found. Cannot create dynamic tables.' }, { status: 400 });
        }

        if (biz.status !== 'pending') {
            return json({ message: `Business is already ${biz.status}` }, { status: 400 });
        }

        // 3. Approval & Dynamic Table Creation (Batch)
        const tablePrefix = biz.username;

        await db.batch([
            // Update Status
            db.prepare("UPDATE biz_data SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(bizId),
            
            // Log this action
            db.prepare("INSERT INTO sa_activity_log (nos, said, action) VALUES (?, ?, ?)")
              .bind(ulid(), adminPayload.id, `APPROVE Business "${biz.bname}" (ID: ${bizId})`)
        ]);

        return json({ message: `Business "${biz.bname}" approved and activated successfully.` });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
