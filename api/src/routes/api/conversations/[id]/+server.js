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
        // Accept either bizId OR personal founderId/userId — covers all conversation types
        const bizId   = locals.user.bizId || null;
        const userId  = locals.user.userid || locals.user.id || null;
        const conversationId = params.id;

        // 1. Authorize: Check if participant is part of the conversation
        const con = await db.prepare(`
            SELECT id, participant1_id, participant2_id 
            FROM conversations 
            WHERE id = ?
        `).bind(conversationId).first();

        if (!con) return json({ message: 'Conversation not found' }, { status: 404 });
        const myIds = [bizId, userId].filter(Boolean);
        const isMember = myIds.includes(con.participant1_id) || myIds.includes(con.participant2_id);
        if (!isMember) return json({ message: 'Forbidden' }, { status: 403 });
        
        // Determine the effective self ID and other ID
        const selfId  = myIds.find(id => id === con.participant1_id || id === con.participant2_id);
        const otherId = con.participant1_id === selfId ? con.participant2_id : con.participant1_id;

        // Resolve display name — check biz_data, then founder, then user_data
        const biz     = await db.prepare('SELECT bname as name, avatar_url FROM biz_data WHERE id = ?').bind(otherId).first();
        const founder = !biz ? await db.prepare('SELECT name, avatar_url FROM founder WHERE id = ?').bind(otherId).first() : null;
        const user    = (!biz && !founder) ? await db.prepare("SELECT firstname || ' ' || lastname as name, avatar_url FROM user_data WHERE id = ?").bind(otherId).first() : null;
        const display = biz || founder || user;
        const enrichedCon = { ...con, display_name: display?.name || 'Founder', display_avatar: display?.avatar_url || null };

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
        // Accept either bizId OR personal founderId/userId
        const bizId  = locals.user.bizId || null;
        const userId = locals.user.userid || locals.user.id || null;
        const myIds  = [bizId, userId].filter(Boolean);
        const conversationId = params.id;
        const body = await request.json();
        const { text, type = 'text' } = body;

        if (!text) return json({ message: 'Message text required' }, { status: 400 });

        // 1. Verify access
        const con = await db.prepare('SELECT participant1_id, participant2_id FROM conversations WHERE id = ?').bind(conversationId).first();
        if (!con) return json({ message: 'Conversation not found' }, { status: 404 });
        const isMember = myIds.includes(con.participant1_id) || myIds.includes(con.participant2_id);
        if (!isMember) return json({ message: 'Forbidden' }, { status: 403 });

        // Use whichever of our IDs is actually in this conversation as the sender
        const myId = myIds.find(id => id === con.participant1_id || id === con.participant2_id);

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
