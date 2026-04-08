import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

// GET: List requirements (For users: their own, For businesses: matching their category/location)
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        const bizId = url.searchParams.get('bizId') || locals.user.biz_id || null;
        
        let query = 'SELECT * FROM requests';
        let params = [];

        if (locals.user.role === 'user') {
            // Users only see their own
            query += ' WHERE user_id = ? ORDER BY created_at DESC';
            params.push(locals.user.id);
        } else if (bizId) {
            // Businesses see requests matching their category OR location (within 50km if GPS available)
            // OR requests explicitly targeted to them 
            const biz = await db.prepare('SELECT categories, pincode, district, lat, long FROM biz_data WHERE id = ?').bind(bizId).first();
            if (biz) {
                const radius = 50; // 50km broadcast radius
                const latDelta = radius / 111;
                const lonDelta = radius / (111 * Math.cos(biz.lat * Math.PI / 180));
                
                // biz.categories might be a JSON string like '["Electronics","TV"]'
                let bizCats = [];
                try { bizCats = JSON.parse(biz.categories || '[]'); } catch(e) { bizCats = [biz.categories]; }
                
                const categoryClause = bizCats.length > 0 
                    ? bizCats.map(c => `category LIKE '%"${c}"%'`).join(' OR ')
                    : '1=0';

                query += ` WHERE (
                    (status = 'open') AND (
                        (target_business_ids LIKE ?) OR
                        ( (${categoryClause}) OR (pincode = ? OR district = ?) ) OR
                        (lat BETWEEN ? AND ? AND long BETWEEN ? AND ?)
                    )
                ) ORDER BY created_at DESC`;
                
                params.push(
                    `%"${bizId}"%`,
                    biz.pincode, biz.district,
                    biz.lat - latDelta, biz.lat + latDelta, 
                    biz.long - lonDelta, biz.long + lonDelta
                );
            } else {
                return json({ error: 'Business data not found' }, { status: 404 });
            }
        }

        const data = await db.prepare(query).bind(...params).all();
        
        // Safe JSON parsing helper
        const safeParse = (str, fallback) => {
            if (!str) return fallback;
            if (typeof str === 'object') return str;
            try { return JSON.parse(str); } catch(e) { return fallback; }
        };

        const results = data.results.map(r => ({
            ...r,
            description: safeParse(r.description, {}),
            category: safeParse(r.category, []),
            sub_categories: safeParse(r.sub_categories, [])
        }));

        return json(results); // Return array directly for the UI
    } catch(err) { 
        console.error('[API GET REQUESTS ERROR]', err);
        return json({error: err.message}, {status: 500}); 
    }
}

// POST: Create a new requirement and "Broadcast" it
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user || (locals.user.role !== 'user' && locals.user.role !== 'provider')) {
            // Allow both for testing/flexibility, but usually 'user'
        }
        
        let body;
        try {
            body = await request.json();
        } catch(e) {
            return json({error: 'Invalid JSON body'}, {status: 400});
        }

        const db = platform.env.DB;
        const id = 'req_' + ulid();
        
        // Use standard field names for the Centralized Table
        const desc = body.description || {};
        const title = body.title || desc.title || 'Untitled Requirement';
        const details = desc.details || desc.detail || body.details || '';
        const budget = body.budget || desc.budget || '';
        
        const descriptionStr = JSON.stringify({ title, details, budget });

        // FIX: Remove 'main_category' from INSERT, use 'long'
        const lat = parseFloat(body.lat);
        const longValue = parseFloat(body.long || body.lng);
        const status = body.item_id ? 'accepted' : 'open';

        // 1. Create the Request
        await db.prepare(`
            INSERT INTO requests (
                id, user_id, description, category, sub_categories, 
                lat, long, city, district, pincode, address, status,
                item_id, target_business_ids
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, 
            locals.user.id || locals.user.userid, 
            descriptionStr,
            JSON.stringify(body.category || []), 
            JSON.stringify(body.sub_categories || []), 
            isNaN(lat) ? null : lat, 
            isNaN(longValue) ? null : longValue, 
            body.city || null, 
            body.district || null, 
            body.pincode ? String(body.pincode).split('.')[0] : null, 
            body.address || null,
            status,
            body.item_id || null,
            JSON.stringify(body.target_business_ids || [])
        ).run();

        // 2. If Direct Interest, create the Order (Acceptance) record immediately
        if (body.item_id && body.target_business_ids?.length > 0) {
            const bizId = typeof body.target_business_ids[0] === 'string' 
                ? body.target_business_ids[0] 
                : null;
            if (bizId) {
                const orderId = 'ord_' + ulid();
                const itemData = { 
                    id: body.item_id, 
                    name: title, 
                    price: budget,
                    image: body.image || null
                };

                await db.batch([
                    // Create Acceptance record — no status column, accepted_item nullable
                    db.prepare(`
                        INSERT INTO acceptances (id, request_id, quote_id, business_id, user_id, accepted_item, final_price, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).bind(orderId, id, 'direct_' + ulid(), bizId, locals.user.id || locals.user.userid, JSON.stringify(itemData), budget || null),
                    // Notify business
                    db.prepare('INSERT INTO notifications (id, business_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)')
                        .bind('not_' + ulid(), bizId, 'order', orderId, `New direct order: ${title}! Check your active jobs.`)
                ]);
                
                return json({ message: 'Order created via direct interest', id, orderId }, {status: 201});
            }
        }


        return json({ message: 'Requirement posted successfully', id }, {status: 201});
    } catch(err) { 
        console.error('Request POST Error:', err);
        return json({error: err.message}, {status: 500}); 
    }
}