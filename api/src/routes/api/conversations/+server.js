import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/conversations
 * Unified conversation list for users and merchants.
 */
export async function GET({ platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;

        // 1. Fetch conversations where user is a participant
        // We join to get both participant names (user and business) for UI context
        const { results } = await db.prepare(`
            SELECT c.*, 
                   ud.firstname || ' ' || ud.lastname as user_name, ud.avatar_url as user_avatar,
                   bd.bname as biz_name, bd.avatar_url as biz_avatar
            FROM conversations c
            LEFT JOIN user_data ud ON (c.participant1_id = ud.id OR c.participant2_id = ud.id)
            LEFT JOIN biz_data bd ON (c.participant1_id = bd.id OR c.participant2_id = bd.id)
            WHERE (c.participant1_id = ? OR c.participant2_id = ?)
            ORDER BY c.updated_at DESC
        `).bind(myId, myId).all();

        return json({
            user_id: myId,
            conversations: results.map(c => {
                // Determine the other participant's info for the UI
                const isP1 = (c.participant1_id === myId);
                const otherPId = isP1 ? c.participant2_id : c.participant1_id;
                const otherName = (c.biz_name && otherPId === c.participant1_id) || (c.biz_name && otherPId === c.participant2_id) ? c.biz_name : c.user_name || 'Contact';

                return {
                    ...c,
                    display_name: otherName,
                    display_avatar: c.biz_avatar || c.user_avatar || null
                };
            })
        });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// POST: Start a new conversation
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;
        const body = await request.json();
        const { recipient_id, reference_id, type = 'general' } = body;

        if (!recipient_id) return json({ message: 'Recipient ID required' }, { status: 400 });

        // 1. Check if conversation already exists for this reference (e.g., specific requirement)
        let con = await db.prepare(`
            SELECT id FROM conversations 
            WHERE (participant1_id = ? AND participant2_id = ?) 
               OR (participant1_id = ? AND participant2_id = ?)
        `).bind(myId, recipient_id, recipient_id, myId).first();

        if (con) return json({ id: con.id, message: 'Existing conversation found' });

        // 2. Create new conversation
        const id = 'con_' + ulid();
        await db.prepare(`
            INSERT INTO conversations (id, participant1_id, participant2_id, type, reference_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(id, myId, recipient_id, type, reference_id || null).run();

        return json({ id, message: 'Conversation started' }, { status: 201 });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}