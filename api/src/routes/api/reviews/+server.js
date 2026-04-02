import { json } from '@sveltejs/kit';

export async function GET({ url, platform }) {
    try {
        const db = platform.env.DB;
        const itemId = url.searchParams.get('item_id');
        const bizId = url.searchParams.get('business_id');
        
        let query = `
            SELECT reviews.*, user_data.firstname, user_data.lastname, user_data.avatar_url
            FROM reviews
            LEFT JOIN user_data ON reviews.user_id = user_data.id
        `;
        let params = [];

        if (itemId) {
            query += " WHERE reviews.item_id = ?";
            params.push(itemId);
        } else if (bizId) {
            query += " WHERE reviews.business_id = ?";
            params.push(bizId);
        } else {
            return json({ error: 'Missing item_id or business_id' }, { status: 400 });
        }

        query += " ORDER BY reviews.created_at DESC LIMIT 100";
        
        const { results } = await db.prepare(query).bind(...params).all();
        return json(results);
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        
        const db = platform.env.DB;
        const body = await request.json();
        
        const { item_id, business_id, rating, review_text, image_url, review_video_url, acceptance_id } = body;

        let finalBizId = business_id;
        
        // If business_id is missing but item_id is present, find it
        if (!finalBizId && item_id) {
            const item = await db.prepare('SELECT business_id FROM items WHERE id = ?').bind(item_id).first();
            if (item) finalBizId = item.business_id;
        }

        if (!finalBizId) return json({ message: 'business_id is required' }, { status: 400 });

        const id = 'rev_' + crypto.randomUUID().slice(0, 8);

        await db.prepare(`
            INSERT INTO reviews (
                id, item_id, business_id, user_id, acceptance_id,
                rating, review_text, image_url, review_video_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, item_id || null, finalBizId, locals.user.id || locals.user.userid, acceptance_id || null,
            rating || 0, review_text || null, 
            JSON.stringify(image_url || []), 
            JSON.stringify(review_video_url || [])
        ).run();

        return json({ message: 'Review added', id }, { status: 201 });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
