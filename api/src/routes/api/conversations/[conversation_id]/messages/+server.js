import { json } from '@sveltejs/kit';
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        // Collect all IDs this user could be a participant under
        const myIds = [locals.user.bizId, locals.user.id, locals.user.userid].filter(Boolean);
        
        // Authorize access
        const con = await db.prepare('SELECT participant1_id as p1_id, participant2_id as p2_id FROM conversations WHERE id = ?').bind(params.conversation_id).first();
        if (!con) return json({message: 'Not found'}, {status: 404});
        if (!myIds.includes(con.p1_id) && !myIds.includes(con.p2_id)) return json({message: 'Forbidden'}, {status: 403});

        const { results } = await db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 50').bind(params.conversation_id).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}