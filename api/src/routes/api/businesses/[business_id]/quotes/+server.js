import { json } from '@sveltejs/kit';
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.bizId !== params.business_id) return json({message: 'Forbidden'}, {status: 403});
        const db = platform.env.DB;
        const { results } = await db.prepare('SELECT * FROM quotes WHERE business_id = ? AND status = ? ORDER BY created_at DESC').bind(params.business_id, 'pending').all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}