import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/conversations/[id]
 * Unified messaging hub for a specific conversation.
 * Replace /api/messages/ and nested /conversations/[id]/messages.
 */

// GET: Fetch messages for a conversation
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;
        const conversationId = params.id;

        // 1. Authorize: Check if participant is part of the conversation
        const con = await db.prepare(`
            SELECT id, participant1_id, participant2_id 
            FROM conversations 
            WHERE id = ?
        `).bind(conversationId).first();

        if (!con) return json({ message: 'Conversation not found' }, { status: 404 });
        if (con.participant1_id !== myId && con.participant2_id !== myId) {
            return json({ message: 'Forbidden' }, { status: 403 });
        }

        // Resolve the other participant's display name
        const otherId = con.participant1_id === myId ? con.participant2_id : con.participant1_id;
        const biz = await db.prepare('SELECT bname as name, avatar_url FROM biz_data WHERE id = ?').bind(otherId).first();
        const displayUser = biz || await db.prepare("SELECT firstname || ' ' || lastname as name, avatar_url FROM user_data WHERE id = ?").bind(otherId).first();
        const enrichedCon = { ...con, display_name: displayUser?.name || 'Contact', display_avatar: displayUser?.avatar_url || null };

        // 2. Fetch last 50 messages
        const { results: messages } = await db.prepare(`
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `).bind(conversationId).all();

        return json({ 
            conversation: enrichedCon, 
            messages: messages.reverse()
        });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// POST: Send a message to this conversation
export async function POST({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.bizId || locals.user.id;
        const conversationId = params.id;
        const body = await request.json();
        const { text, type = 'text' } = body;

        if (!text) return json({ message: 'Message text required' }, { status: 400 });

        // 1. Verify access
        const con = await db.prepare('SELECT participant1_id, participant2_id FROM conversations WHERE id = ?').bind(conversationId).first();
        if (!con) return json({ message: 'Conversation not found' }, { status: 404 });
        if (con.participant1_id !== myId && con.participant2_id !== myId) return json({ message: 'Forbidden' }, { status: 403 });

        const recipientId = con.participant1_id === myId ? con.participant2_id : con.participant1_id;
        const messageId = 'msg_' + ulid();
        const payload = JSON.stringify({ text, type });

        // 2. Sequential send + update conversation timestamp
        console.log(`[CHAT LOG] Inserting message ${messageId} into convo ${conversationId}`);
        await db.prepare(`
            INSERT INTO messages (id, conversation_id, sender_id, payload, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(messageId, conversationId, myId, payload).run();

        console.log(`[CHAT LOG] Updating last_message_at for convo ${conversationId}`);
        await db.prepare('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').bind(conversationId).run();

        return json({ message: 'Sent', id: messageId }, { status: 201 });

    } catch (e) {
        console.error('[CHAT POST ERROR]', e.message);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
