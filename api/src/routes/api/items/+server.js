import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

export async function GET({ url, platform }) {
    try {
        const db = platform.env.DB;
        const bizId = url.searchParams.get('business_id');
        const pincode = url.searchParams.get('pincode');
        const category = url.searchParams.get('category');
        const lat = parseFloat(url.searchParams.get('lat'));
        const long = parseFloat(url.searchParams.get('long'));
        
        // Base Query
        let query = `
            SELECT i.*, 
                   b.bname as business_name, 
                   b.city as biz_city, 
                   b.avatar_url as biz_avatar,
                   b.lat as biz_lat,
                   b.long as biz_long,
                   b.pincode as biz_pincode
            FROM items i 
            JOIN biz_data b ON i.business_id = b.id
            WHERE 1=1
        `;
        let params = [];

        if (bizId) {
            query += ' AND i.business_id = ?';
            params.push(bizId);
        }

        if (category && category !== 'All') {
            query += ' AND LOWER(i.category) = LOWER(?)';
            params.push(category);
        }

        // If specific pincode provided
        if (pincode) {
            query += ' AND b.pincode = ?';
            params.push(pincode);
        }

        // Proximity Sorting in SQL if coordinates are provided
        if (!isNaN(lat) && !isNaN(long)) {
            query += ` ORDER BY ( (b.lat - ?) * (b.lat - ?) + (b.long - ?) * (b.long - ?) ) ASC, i.created_at DESC`;
            params.push(lat, lat, long, long);
        } else {
            query += ' ORDER BY i.created_at DESC';
        }

        query += ' LIMIT 500'; // High limit to allow frontend sorting/filtering

        const { results } = await db.prepare(query).bind(...params).all();
        return json(results);
    } catch(err) { 
        console.error('GET Items Error:', err);
        return json({error: err.message}, {status: 500}); 
    }
}

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        let bizId = locals.user.bizId || null;
        if (!bizId) {
            const loginRec = await db.prepare('SELECT biz_id FROM biz_login WHERE id = ?').bind(locals.user.id || locals.user.userid).first();
            if (loginRec) bizId = loginRec.biz_id;
        }
        if (!bizId) return json({message: 'Business Access Required'}, {status: 401});

        const body = await request.json();
        const id = body.id || ('itm_' + ulid());
        const images = JSON.stringify(body.image || []);
        const specification = JSON.stringify(body.specification || {});

        await db.prepare(`
            INSERT INTO items (id, business_id, product_name, item_type, category, description, brand, image, specification)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, bizId, body.product_name, body.item_type || 'product', body.category || 'General', body.description || null, body.brand || null, images, specification).run();
        
        return json({ message: 'Item created', id }, {status: 201});
    } catch(err) { 
        return json({error: err.message}, {status: 500}); 
    }
}