import { json } from '@sveltejs/kit';

/**
 * PATH: /api/orders/[id]
 * Consolidated order detail and lifecycle tracking. Handles status updates (accepted, ready, delivered, completed).
 */
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const bizId = locals.user.bizId || null;
        const orderId = params.id;
        
        // 1. Fetch the Order (Acceptance) record
        const acc = await db.prepare('SELECT * FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Order not found' }, { status: 404 });

        // Ensure only participants see the sensitive contact data
        if (acc.user_id !== locals.user.id && acc.business_id !== bizId) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch user, business, and requirement details simultaneously
        const [userRes, bizRes, reqRes] = await db.batch([
            db.prepare('SELECT firstname, lastname, email, phone, city, address, lat, long FROM user_data WHERE id = ?').bind(acc.user_id),
            db.prepare('SELECT bname as biz_name, emails, phones, address, lat, long FROM biz_data WHERE id = ?').bind(acc.business_id),
            db.prepare('SELECT status as req_status, description as requirement_desc FROM requests WHERE id = ?').bind(acc.request_id)
        ]);

        return json({
             order: {
                ...acc,
                accepted_item: JSON.parse(acc.accepted_item || '{}')
             },
             request: reqRes.results[0] || null,
             buyer: userRes.results[0] || null,
             seller: bizRes.results[0] || null
        });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// PATCH: Update Order Status (Mark as Ready, Delivered, etc.)
export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const body = await request.json();
        const orderId = params.id;
        const { status } = body;

        if (!status) return json({ message: 'Status is required' }, { status: 400 });

        // 1. Verify existence and permission
        const acc = await db.prepare('SELECT user_id, business_id, request_id FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Order not found' }, { status: 404 });

        // Permission: Both buyer and seller can update (buyer for completed, seller for delivered)
        if (acc.user_id !== locals.user.id && acc.business_id !== locals.user.bizId) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        // 2. Update status
        await db.prepare('UPDATE acceptances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, orderId).run();

        // 3. Optional: Sync requirement status if order is completed
        if (status === 'completed') {
            await db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('completed', acc.request_id).run();
        }

        return json({ message: `Order status updated to ${status}` });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
