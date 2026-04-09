import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, params, platform, locals }) {
    try {
        const { id: bizId } = params;
        const db = platform.env.DB;

        // 1. Authorization: Only Super Admin can approve
        const adminPayload = locals.user;
        if (!adminPayload || adminPayload.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Existing check
        const biz = await db.prepare('SELECT status, bname, username, avatar_url FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz) {
            return json({ message: 'Business not found' }, { status: 404 });
        }

        if (biz.status !== 'pending') {
            return json({ message: `Business is already ${biz.status}` }, { status: 400 });
        }
        // 3. Process Action (Approve or Reject)
        const reqJson = await request.json().catch(() => ({}));
        const isReject = reqJson.action === 'reject';
        
        const newStatus = isReject ? 'rejected' : 'active';
        const logAction = isReject ? 'REJECT' : 'APPROVE';

        await db.batch([
            // Update Status
            db.prepare("UPDATE biz_data SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newStatus, bizId),
            
            // Log this action
            db.prepare("INSERT INTO sa_activity_log (nos, said, action) VALUES (?, ?, ?)")
              .bind(ulid(), adminPayload.id, `${logAction} Business "${biz.bname}" (ID: ${bizId})`)
        ]);

        return json({ message: `Business "${biz.bname}" ${newStatus} successfully.` });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
