import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/quotes
 * Unified quote management for merchants (posting) and users (viewing).
 */
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const requestId = url.searchParams.get('requestId');
        const bizId = locals.user.bizId || null;

        let query = `
            SELECT q.*, b.bname as business_name, b.avatar_url as business_avatar 
            FROM quotes q 
            JOIN biz_data b ON q.business_id = b.id
        `;
        let params = [];

        if (requestId) {
            query += " WHERE q.request_id = ?";
            params.push(requestId);
        } else if (bizId) {
            query += " WHERE q.business_id = ?";
            params.push(bizId);
        } else if (locals.user.role === 'user') {
            // All quotes for the user's active requests
            query += " WHERE q.request_id IN (SELECT id FROM requests WHERE user_id = ?)";
            params.push(locals.user.id);
        }

        query += " ORDER BY q.created_at DESC";
        const { results } = await db.prepare(query).bind(...params).all();

        return json({ 
            quotes: results.map(q => ({ 
                ...q, 
                product_info: JSON.parse(q.product_info || '{}'),
                nos: JSON.parse(q.nos || '{}') // for compatibility
            })) 
        });
    } catch(err) { 
        return json({error: err.message}, {status: 500}); 
    }
}

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user?.bizId) return json({ message: 'Unauthorized: Merchant access required' }, { status: 401 });
        
        const db = platform.env.DB;
        const body = await request.json();
        const { requestId, product_info, price, delivery_time } = body;

        if (!requestId || !product_info) return json({ message: 'Request ID and product info required' }, { status: 400 });

        const id = 'qte_' + ulid();

        await db.prepare(`
            INSERT INTO quotes (
                id, request_id, business_id, product_info, status, created_at
            ) VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `).bind(
            id, requestId, locals.user.bizId, 
            JSON.stringify({ ...product_info, price, delivery_time })
        ).run();

        // Notify user
        const req = await db.prepare('SELECT user_id, description FROM requests WHERE id = ?').bind(requestId).first();
        if (req) {
            const desc = JSON.parse(req.description || '{}');
            await db.prepare('INSERT INTO notifications (id, user_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)')
                .bind('not_' + ulid(), req.user_id, 'quote', requestId, `New quote received for your request: ${desc.title || 'Requirement'}`);
        }

        return json({ message: 'Quote submitted successfully', id }, { status: 201 });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
