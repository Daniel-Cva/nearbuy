import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

// GET: List requirements (For users: their own, For businesses: matching their category/location)
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        const bizId = locals.user.bizId || null;
        
        let query = 'SELECT * FROM requests';
        let params = [];

        if (locals.user.role === 'user') {
            // Users only see their own
            query += ' WHERE user_id = ? ORDER BY created_at DESC';
            params.push(locals.user.id);
        } else if (bizId) {
            // Businesses see requests matching their category OR location
            const biz = await db.prepare('SELECT category, pincode, district FROM biz_data WHERE id = ?').bind(bizId).first();
            if (biz) {
                query += ` WHERE (category = ? OR pincode = ? OR district = ?) AND status = 'open' ORDER BY created_at DESC`;
                params.push(biz.category, biz.pincode, biz.district);
            }
        }

        const data = await db.prepare(query).bind(...params).all();
        
        // Parse JSON strings back to objects for the UI
        const results = data.results.map(r => ({
            ...r,
            description: JSON.parse(r.description || '{}'),
            category: JSON.parse(r.category || '[]'),
            sub_categories: JSON.parse(r.sub_categories || '[]')
        }));

        return json({ requests: results });
    } catch(err) { 
        return json({error: err.message}, {status: 500}); 
    }
}

// POST: Create a new requirement and "Broadcast" it
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'user') {
            return json({message: 'Unauthorized: User Access Required'}, {status: 401});
        }
        
        const body = await request.json();
        const db = platform.env.DB;
        const id = 'req_' + ulid();
        
        // Use standard field names for the Centralized Table
        const descriptionStr = JSON.stringify({
            title: body.title || body.description?.title,
            details: body.details || body.description?.detail || body.description?.details,
            budget: body.budget || body.description?.budget
        });

        await db.prepare(`
            INSERT INTO requests (
                id, user_id, description, category, sub_categories, 
                lat, lng, city, district, pincode, address, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `).bind(
            id, 
            locals.user.id, 
            descriptionStr,
            JSON.stringify(body.category || []), 
            JSON.stringify(body.sub_categories || []), 
            body.lat || null, 
            body.lng || null, 
            body.city || null, 
            body.district || null, 
            body.pincode || null, 
            body.address || null
        ).run();

        return json({ message: 'Requirement posted successfully', id }, {status: 201});
    } catch(err) { 
        console.error('Request POST Error:', err);
        return json({error: err.message}, {status: 500}); 
    }
}