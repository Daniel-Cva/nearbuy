import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/orders
 * Unified marketplace order management.
 */
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const bizId = locals.user.bizId || locals.user.biz_id || null;
        const userId = locals.user.id || locals.user.userid;
        const status = url.searchParams.get('status');
        
        let query = `
            SELECT a.*, 
                   r.status as req_status, r.description as req_description,
                   ud.firstname || ' ' || ud.lastname as user_name, ud.email as user_email, ud.phone as user_phone, ud.avatar_url as user_avatar, ud.address as user_address, ud.city as user_city,
                   bd.bname as biz_name, bd.emails as biz_emails, bd.phones as biz_phones, bd.avatar_url as biz_avatar, bd.address as biz_address, bd.city as biz_city, bd.lat as biz_lat, bd.long as biz_long,
                   f.name as founder_name, f.email as founder_email, f.phone as founder_phone
            FROM acceptances a
            JOIN requests r ON a.request_id = r.id
            LEFT JOIN user_data ud ON a.user_id = ud.id
            LEFT JOIN biz_data bd ON a.business_id = bd.id
            LEFT JOIN founder f ON bd.id = f.biz_id
            WHERE (a.user_id = ? OR a.business_id = ? OR a.business_id IN (SELECT biz_id FROM biz_login WHERE id = ?))
        `;
        let params = [userId, bizId || userId, userId];

        if (status) {
            const statusArray = status.split(',').map(s => s.trim());
            const placeholders = statusArray.map(() => '?').join(',');
            query += ` AND r.status IN (${placeholders})`;
            params.push(...statusArray);
        }

        query += " ORDER BY a.created_at DESC";
        const { results } = await db.prepare(query).bind(...params).all();

        const orders = results.map(o => ({
            ...o,
            status: o.req_status,
            accepted_item: o.accepted_item ? JSON.parse(o.accepted_item) : null,
            user_info: {
                name: o.user_name || 'Buyer',
                email: o.user_email,
                phone: o.user_phone,
                avatar: o.user_avatar,
                address: o.user_address,
                city: o.user_city
            },
            biz_info: {
                name: o.biz_name,
                emails: JSON.parse(o.biz_emails || '[]'),
                phones: JSON.parse(o.biz_phones || '[]'),
                avatar: o.biz_avatar,
                address: o.biz_address,
                city: o.biz_city,
                lat: o.biz_lat,
                long: o.biz_long,
                founder: {
                    name: o.founder_name,
                    email: o.founder_email,
                    phone: o.founder_phone
                }
            }
        }));

        return json({ 
            orders, 
            debug: { 
                userId, 
                bizId, 
                localsUser: locals.user,
                params
            } 
        });
    } catch(err) { 
        return json({error: err.message, stack: err.stack}, {status: 500}); 
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
        const finalPrice = price != null ? String(price) : null;

        await db.batch([
            // Create the acceptance — accepted_item is nullable (null for services)
            db.prepare(`
                INSERT INTO acceptances (id, request_id, quote_id, business_id, user_id, accepted_item, final_price, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(orderId, request_id, quote_id, business_id, locals.user.id, item_data ? JSON.stringify(item_data) : null, finalPrice),
            // Update requirement status
            db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('accepted', request_id),
            // Update quote status
            db.prepare('UPDATE quotes SET status = ? WHERE id = ?').bind('accepted', quote_id),
            // Notify merchant
            db.prepare('INSERT INTO notifications (id, business_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)')
                .bind('not_' + ulid(), business_id, 'order', orderId, 'A customer accepted your quote! Get in touch with them.')
        ]);

        return json({ message: 'Order created successfully', orderId }, { status: 201 });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
