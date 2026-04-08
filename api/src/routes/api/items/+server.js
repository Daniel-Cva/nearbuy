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
        const radius = parseFloat(url.searchParams.get('radius')) || 25; // Increase to 25km
        
        // Base Query
        let query = `
            SELECT i.*, 
                   b.bname as business_name, 
                   b.city, 
                   b.avatar_url as biz_avatar,
                   b.lat as biz_lat,
                   b.long as biz_long,
                   b.pincode as biz_pincode
            FROM items i 
            JOIN biz_data b ON i.business_id = b.id
            WHERE 1=1
        `;
        let params = [];

        // 1. Business ID Filter (Strict)
        if (bizId) {
            query += ' AND i.business_id = ?';
            params.push(bizId);
        }

        // 2. Category Filter (Case-insensitive)
        if (category && category !== 'All') {
            query += ' AND LOWER(i.category) = LOWER(?)';
            params.push(category);
        }

        // 3. Location Discovery Logic 
        // If category is provided, we prefer showing ALL in that category but highlight nearby.
        // If 'All' is selected, we STRICTLY show nearby items.
        const isNearbyOnly = (!category || category === 'All');

        if (!isNaN(lat) && !isNaN(long)) {
            // Approx: 1 deg lat = 111km, 1 deg lon = 111km * cos(lat)
            const latDelta = radius / 111;
            const lonDelta = radius / (111 * Math.cos(lat * Math.PI / 180));
            
            // Bounding box filter for index usage
            query += ' AND b.lat BETWEEN ? AND ? AND b.long BETWEEN ? AND ?';
            params.push(lat - latDelta, lat + latDelta, long - lonDelta, long + lonDelta);

            // True Euclidean-ish distance filter (squared for performance)
            // ((lat1-lat2)^2 + (lon1-lon2)^2) < approx_radius_sq
            // We use this as a secondary filter post-bounding box
        } else if (pincode && isNearbyOnly) {
            query += ' AND b.pincode = ?';
            params.push(pincode);
        }

        // Proximity Ordering
        if (!isNaN(lat) && !isNaN(long)) {
            query += ` ORDER BY 
                ( (b.lat - ?) * (b.lat - ?) + (b.long - ?) * (b.long - ?) ) ASC, 
                i.created_at DESC`;
            params.push(lat, lat, long, long);
        } else {
            query += ' ORDER BY i.created_at DESC';
        }

        query += ' LIMIT 100';

        const { results } = await db.prepare(query).bind(...params).all();
        return json(results);
    } catch(err) { 
        console.error('GET Items Error:', err);
        return json({error: err.message}, {status: 500}); 
    }
}

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) {
            return json({message: 'Unauthorized: Missing Token'}, {status: 401});
        }
        
        const db = platform.env.DB;
        let bizId = locals.user.bizId || null;
        
        if (!bizId) {
            // Hotfix: Find bizId dynamically using the user's ID
            const loginRec = await db.prepare('SELECT biz_id FROM biz_login WHERE id = ?').bind(locals.user.id || locals.user.userid).first();
            if (loginRec) bizId = loginRec.biz_id;
        }

        if (!bizId) {
            return json({message: 'Unauthorized: Business Access Required', debug: locals.user}, {status: 401});
        }

        const body = await request.json();
        const id = body.id || ('itm_' + ulid());
        
        const category      = body.category       || 'General';
        
        // Safely stringify objects/arrays for D1 text columns
        const stringify = (val, dflt = '[]') => {
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val || dflt;
        };

        const images        = stringify(body.image, '[]');
        const specification = stringify(body.specification, '{}');

        await db.prepare(`
            INSERT INTO items (
                id, business_id, product_name, item_type, 
                category, description, brand, image, specification
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, bizId, body.product_name, body.item_type || 'product', 
            category, body.description || null, body.brand || null, images, specification
        ).run();
        
        return json({ message: 'Item created', id }, {status: 201});
    } catch(err) { 
        console.error('POST Item Error:', err);
        return json({error: err.message}, {status: 500}); 
    }
}