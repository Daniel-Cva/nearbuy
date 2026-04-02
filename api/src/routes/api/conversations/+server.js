import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';
export async function GET({ url, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const participantId = locals.user.bizId || locals.user.id;
        const db = platform.env.DB;
        
        const query = 'SELECT * FROM conversations WHERE participant1_id = ? OR participant2_id = ? ORDER BY last_message_at DESC';
        const { results } = await db.prepare(query).bind(participantId, participantId).all();
        return json(results);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        
        const myId = locals.user.bizId || locals.user.id;
        const otherId = body.other_id;
        if (!otherId) return json({message: 'other_id is required'}, {status: 400});

        // Lexicographical sorting to maintain uniqueness regardless of who starts the chat
        const p1 = myId < otherId ? myId : otherId;
        const p2 = myId < otherId ? otherId : myId;

        // Check if exists
        const ex = await db.prepare('SELECT id FROM conversations WHERE participant1_id = ? AND participant2_id = ?').bind(p1, p2).first();
        if (ex) return json({message: 'Conversation exists', id: ex.id}, {status: 200});

        const id = 'con_' + ulid();
        await db.prepare('INSERT INTO conversations (id, participant1_id, participant2_id, request_id) VALUES (?, ?, ?, ?)')
          .bind(id, p1, p2, body.request_id || null).run();
        return json({ message: 'Conversation started', id }, {status: 201});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}