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

// IDENTITY NORMALIZER: Corrects for inconsistent 'usr_' or 'biz_' prefixes in the database
const normalizeId = (id) => id ? id.replace(/^(usr_|biz_|ord_|req_|con_|not_|rev_|qu_)/, '') : '';
const compareIds = (id1, id2) => normalizeId(id1) === normalizeId(id2);

export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        
        const db = platform.env.DB;
        const body = await request.json();
        const myId = locals.user.id || locals.user.userid;

        console.log('[Review POST] Start:', { body, myId });
        
        let { item_id, business_id, rating, review_text, image_url, review_video_url, acceptance_id } = body;

        let finalBizId = business_id;
        
        // If business_id is missing but acceptance_id (Order ID) is present, look it up in the database.
        if (!finalBizId && acceptance_id) {
            const acc = await db.prepare('SELECT business_id, accepted_item FROM acceptances WHERE id = ?').bind(acceptance_id).first();
            if (acc) {
                finalBizId = acc.business_id;
                // If item_id is missing, try to extract it from the accepted_item JSON
                if (!item_id && acc.accepted_item) {
                    try {
                        const parsedItem = JSON.parse(acc.accepted_item);
                        if (parsedItem?.id) item_id = parsedItem.id;
                    } catch (e) {}
                }
            } 
        }

        // Fallback: If still missing but item_id is present, find the business that owns that item
        if (!finalBizId && item_id) {
            const item = await db.prepare('SELECT business_id FROM items WHERE id = ?').bind(item_id).first();
            if (item) finalBizId = item.business_id;
        }

        if (!finalBizId) {
            return json({ 
                message: 'business_id is required', 
                debug: { sent_biz_id: business_id, sent_acc_id: acceptance_id } 
            }, { status: 400 });
        }

        const id = 'rev_' + crypto.randomUUID().slice(0, 8);

        await db.prepare(`
            INSERT INTO reviews (
                id, item_id, business_id, user_id, acceptance_id,
                rating, review_text, image_url, review_video_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, item_id || null, finalBizId, myId, acceptance_id || null,
            rating || 0, review_text || null, 
            JSON.stringify(image_url || []), 
            JSON.stringify(review_video_url || [])
        ).run();

        return json({ message: 'Review added', id }, { status: 201 });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
