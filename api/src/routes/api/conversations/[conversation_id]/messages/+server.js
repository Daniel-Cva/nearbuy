import { json } from '@sveltejs/kit';
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;
        
        // Authorize access
        const con = await db.prepare('SELECT p1_id, p2_id FROM (SELECT participant1_id as p1_id, participant2_id as p2_id FROM conversations WHERE id = ?)').bind(params.conversation_id).first();
        if (!con) return json({message: 'Not found'}, {status: 404});
        if (con.p1_id !== myId && con.p2_id !== myId) return json({message: 'Forbidden'}, {status: 403});

        const { results } = await db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 50').bind(params.conversation_id).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}