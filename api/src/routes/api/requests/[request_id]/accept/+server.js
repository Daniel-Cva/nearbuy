import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';
export async function POST({ params, request, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'user') return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        
        const reqResult = await db.prepare('SELECT user_id FROM requests WHERE id = ?').bind(params.request_id).first();
        if (!reqResult || reqResult.user_id !== locals.user.id) return json({message: 'Forbidden'}, {status: 403});

        const quote = await db.prepare('SELECT business_id, product_info FROM quotes WHERE id = ?').bind(body.quote_id).first();
        if (!quote) return json({message: 'Quote not found'}, {status: 404});

        const id = 'acc_' + ulid();
        await db.batch([
            db.prepare('INSERT INTO acceptances (id, request_id, quote_id, user_id, business_id, accepted_item) VALUES (?, ?, ?, ?, ?, ?)').bind(id, params.request_id, body.quote_id, locals.user.id, quote.business_id, quote.product_info),
            db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind('accepted', params.request_id),
            db.prepare('UPDATE quotes SET status = ? WHERE id = ?').bind('accepted', body.quote_id)
        ]);
        return json({ message: 'Quote accepted', id }, {status: 201});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}