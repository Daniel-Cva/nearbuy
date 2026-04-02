import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;
        
        const con = await db.prepare('SELECT participant1_id, participant2_id FROM conversations WHERE id = ?').bind(body.conversation_id).first();
        if (!con) return json({message: 'Conversation not found'}, {status: 404});
        
        if (con.participant1_id !== myId && con.participant2_id !== myId) return json({message: 'Forbidden'}, {status: 403});

        const id = 'msg_' + ulid();
        await db.batch([
            db.prepare('INSERT INTO messages (id, conversation_id, sender_id, payload) VALUES (?, ?, ?, ?)').bind(id, body.conversation_id, myId, JSON.stringify(body.payload)),
            db.prepare('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').bind(body.conversation_id)
        ]);
        return json({ message: 'Message sent', id }, {status: 201});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}