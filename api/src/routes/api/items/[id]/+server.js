import { json } from '@sveltejs/kit';
export async function GET({ params, platform }) {
    try {
        const db = platform.env.DB;
        const item = await db.prepare(`
            SELECT i.*, b.bname as business_name, b.city, b.state, b.district, b.address as biz_address, b.avatar_url as biz_avatar, b.lat, b.long, b.phones as mobile, b.emails as email
            FROM items i
            JOIN biz_data b ON i.business_id = b.id
            WHERE i.id = ?
        `).bind(params.id).first();

        if (!item) return json({ message: 'Item not found' }, { status: 404 });
        return json(item);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}
export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized: Missing Token'}, {status: 401});
        const db = platform.env.DB;
        let bizId = locals.user.bizId || null;
        if (!bizId) {
            const loginRec = await db.prepare('SELECT biz_id FROM biz_login WHERE id = ?').bind(locals.user.id || locals.user.userid).first();
            if (loginRec) bizId = loginRec.biz_id;
        }
        if (!bizId) return json({message: 'Unauthorized: Business Access Required'}, {status: 401});

        const body = await request.json();
        const item = await db.prepare('SELECT business_id FROM items WHERE id = ?').bind(params.id).first();
        if (!item || item.business_id !== bizId) return json({message: 'Forbidden'}, {status: 403});
        
        const updates = [];
        const values  = [];
        const add = (col, val) => {
            if (val === undefined) return;
            updates.push(`${col} = ?`);
            values.push((typeof val === 'object' && val !== null) ? JSON.stringify(val) : val);
        };

        add('product_name',   body.product_name);
        add('item_type',      body.item_type);
        add('description',    body.description);
        add('brand',          body.brand);
        add('category',       body.category);
        add('image',          body.image);
        
        if (body.specification !== undefined || body.specs !== undefined) {
            add('specification', body.specification ?? body.specs);
        }

        if (updates.length > 0) {
            values.push(params.id);
            const sql = `UPDATE items SET ${updates.join(', ')} WHERE id = ?`;
            await db.prepare(sql).bind(...values).run();
            return json({ message: 'Item updated successfully' });
        }
        
        return json({ message: 'No changes provided' }, {status: 400});
    } catch(err) { 
        console.error('PATCH Item Error:', err.message);
        return json({
            message: `Update Failed: ${err.message}`,
            error: err.message,
            stack: err.stack
        }, {status: 500}); 
    }
}
export async function DELETE({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized: Missing Token'}, {status: 401});
        const db = platform.env.DB;
        let bizId = locals.user.bizId || null;
        if (!bizId) {
            const loginRec = await db.prepare('SELECT biz_id FROM biz_login WHERE id = ?').bind(locals.user.id || locals.user.userid).first();
            if (loginRec) bizId = loginRec.biz_id;
        }
        if (!bizId) return json({message: 'Unauthorized: Business Access Required'}, {status: 401});

        const item = await db.prepare('SELECT business_id FROM items WHERE id = ?').bind(params.id).first();
        if (!item || item.business_id !== bizId) return json({message: 'Forbidden'}, {status: 403});
        
        await db.prepare('DELETE FROM items WHERE id = ?').bind(params.id).run();
        return json({ message: 'Item deleted' }, {status: 200});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}