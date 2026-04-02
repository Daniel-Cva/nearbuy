import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';
export async function POST({ params, request, platform, locals }) {
    try {
        if (!locals.user || !locals.user.bizId) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        
        // Fetch Biz Name quickly
        const biz = await db.prepare('SELECT bname FROM biz_data WHERE id = ?').bind(locals.user.bizId).first();
        const bname = biz ? biz.bname : 'Unknown Business';

        const id = 'qot_' + ulid();
        await db.prepare('INSERT INTO quotes (id, request_id, business_id, business_name, product_info) VALUES (?, ?, ?, ?, ?)')
          .bind(id, params.request_id, locals.user.bizId, bname, JSON.stringify(body.product_info)).run();
        return json({ message: 'Quote submitted', id }, {status: 201});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        
        const reqObj = await db.prepare('SELECT user_id FROM requests WHERE id = ?').bind(params.request_id).first();
        if (!reqObj || reqObj.user_id !== locals.user.id) return json({message: 'Forbidden'}, {status: 403});

        const { results } = await db.prepare('SELECT * FROM quotes WHERE request_id = ? ORDER BY created_at DESC').bind(params.request_id).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}