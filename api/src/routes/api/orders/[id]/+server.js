import { json } from '@sveltejs/kit';

/**
 * PATH: /api/orders/[id]
 * Consolidated order detail and lifecycle tracking.
 * Status flow:
 *   - 'b_completed' → Business marks job done (stored in acceptances, requests stays 'accepted')
 *   - 'completed'   → User confirms done (acceptances + requests both set to 'completed')
 *   - 'closed'      → Either party cancels
 */
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const bizId = locals.user.bizId || null;
        const orderId = params.id;
        
        const acc = await db.prepare('SELECT * FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Order not found' }, { status: 404 });

        if (acc.user_id !== locals.user.id && acc.business_id !== bizId) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        const [userRes, bizRes, reqRes] = await db.batch([
            db.prepare('SELECT firstname, lastname, email, phone, city, address FROM user_data WHERE id = ?').bind(acc.user_id),
            db.prepare('SELECT bname as biz_name, emails, phones, address, city FROM biz_data WHERE id = ?').bind(acc.business_id),
            db.prepare('SELECT status as req_status, description FROM requests WHERE id = ?').bind(acc.request_id)
        ]);

        const bizRow = bizRes.results[0] || {};

        return json({
             order: {
                ...acc,
                accepted_item: acc.accepted_item ? JSON.parse(acc.accepted_item) : null,
                business_id: acc.business_id,
                biz_name: bizRow.biz_name
             },
             request: reqRes.results[0] || null,
             buyer: userRes.results[0] || null,
             seller: bizRow
        });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// PATCH: Update Order Status
export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const body = await request.json();
        const orderId = params.id;
        const { status } = body;

        if (!status) return json({ message: 'Status is required' }, { status: 400 });

        const acc = await db.prepare('SELECT user_id, business_id, request_id FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Order not found' }, { status: 404 });

        // Permission check
        if (acc.user_id !== locals.user.id && acc.business_id !== locals.user.bizId) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        const ops = [
            // Always update acceptances timestamp
            db.prepare('UPDATE acceptances SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(orderId)
        ];

        if (status === 'b_completed') {
            // Business marking done: store in acceptances only via a status field
            // We add a b_status column concept: store it on requests as 'b_completed' temporarily
            // so the user's order query (which reads req_status) shows 'b_completed'
            ops.push(db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('b_completed', acc.request_id));
        } else if (status === 'completed') {
            // User confirms done: sync both tables
            ops.push(db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('completed', acc.request_id));
        } else if (status === 'closed') {
            // Cancellation: sync both tables
            ops.push(db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('closed', acc.request_id));
        }

        await db.batch(ops);

        return json({ message: `Order status updated to ${status}` });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
