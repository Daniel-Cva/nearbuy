import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/orders
 * Unified marketplace order management. Replacement for /api/acceptances.
 */
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const bizId = locals.user.bizId || null;
        const status = url.searchParams.get('status');
        
        let query = `
            SELECT * FROM acceptances 
            WHERE (user_id = ? OR business_id = ?)
        `;
        let params = [locals.user.id, bizId];

        if (status) {
            query += " AND status = ?";
            params.push(status);
        }

        query += " ORDER BY created_at DESC";
        const { results } = await db.prepare(query).bind(...params).all();

        // UI Compatibility Mapping
        const orders = results.map(o => ({
            ...o,
            accepted_item: JSON.parse(o.accepted_item || '{}'),
            user_info: o.user_id === locals.user.id ? 'Self' : 'Buyer' // simplified for list
        }));

        return json({ orders });
    } catch(err) { 
        return json({error: err.message}, {status: 500}); 
    }
}

// POST: Accept a quote (Create an Order)
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });
        
        const db = platform.env.DB;
        const body = await request.json();
        const { quote_id, request_id, business_id, item_data, price } = body;

        if (!quote_id || !request_id || !business_id) return json({ message: 'Missing IDs' }, { status: 400 });

        const orderId = 'ord_' + ulid();

        // 1. Transactional Order Creation
        await db.batch([
            // Create the acceptance (order)
            db.prepare(`
                INSERT INTO acceptances (id, request_id, quote_id, business_id, user_id, status, accepted_item, price, created_at)
                VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?, CURRENT_TIMESTAMP)
            `).bind(orderId, request_id, quote_id, business_id, locals.user.id, JSON.stringify(item_data || {}), price || 0),
            // Update requirement status
            db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('accepted', request_id),
            // Update quote status
            db.prepare('UPDATE quotes SET status = ? WHERE id = ?').bind('accepted', quote_id),
            // Notify merchant
            db.prepare('INSERT INTO notifications (id, business_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)')
                .bind('not_' + ulid(), business_id, 'order', orderId, 'A customer accepted your quote! Prepare for pickup/delivery.')
        ]);

        return json({ message: 'Order created successfully', orderId }, { status: 201 });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
