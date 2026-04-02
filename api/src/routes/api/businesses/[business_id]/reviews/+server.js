import { json } from '@sveltejs/kit';
export async function GET({ params, platform }) {
    try {
        const db = platform.env.DB;
        const { results } = await db.prepare('SELECT * FROM reviews WHERE business_id = ? ORDER BY created_at DESC').bind(params.business_id).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}