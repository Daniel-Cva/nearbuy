import { json } from '@sveltejs/kit';
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.id !== params.user_id) return json({message: 'Forbidden'}, {status: 403});
        const db = platform.env.DB;
        const { results } = await db.prepare('SELECT * FROM acceptances WHERE user_id = ? ORDER BY created_at DESC').bind(params.user_id).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}