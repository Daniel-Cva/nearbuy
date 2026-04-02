import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';
export async function POST({ params, request, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'user') return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        
        const acc = await db.prepare('SELECT business_id, user_id FROM acceptances WHERE id = ?').bind(params.acceptance_id).first();
        if (!acc || acc.user_id !== locals.user.id) return json({message: 'Forbidden'}, {status: 403});

        const id = 'rev_' + ulid();
        await db.prepare('INSERT INTO reviews (id, acceptance_id, business_id, user_id, rating, review_text, review_video_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, params.acceptance_id, acc.business_id, locals.user.id, body.rating, body.review_text || null, JSON.stringify(body.review_video_url || []), JSON.stringify(body.image_url || [])).run();
        return json({ message: 'Review submitted', id }, {status: 201});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}