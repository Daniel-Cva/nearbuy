import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/conversations
 * Conversation list for users and merchants. Each conversation has two participants
 * (either user↔user, user↔biz, or biz↔biz).
 */
export async function GET({ platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.id;
        const bizId = locals.user.bizId || null;

        // Fetch conversations where I am a participant (personal OR business)
        const { results } = await db.prepare(`
            SELECT c.*
            FROM conversations c
            WHERE (c.participant1_id = ? OR c.participant2_id = ? OR c.participant1_id = ? OR c.participant2_id = ?)
            ORDER BY c.last_message_at DESC
        `).bind(myId, myId, bizId, bizId).all();

        // For each conversation, resolve the OTHER participant's display name
        const enriched = await Promise.all(results.map(async (c) => {
            // Determine which ID is 'me' for this specific conversation
            const isMeP1 = (c.participant1_id === myId || c.participant1_id === bizId);
            const isMeP2 = (c.participant2_id === myId || c.participant2_id === bizId);
            const otherId = isMeP1 ? c.participant2_id : c.participant1_id;
            const selfId = isMeP1 ? c.participant1_id : c.participant2_id;

            // Try biz_data first, then user_data
            const biz = await db.prepare('SELECT bname as name, avatar_url FROM biz_data WHERE id = ?').bind(otherId).first();
            if (biz) {
                return { ...c, display_name: biz.name, display_avatar: biz.avatar_url };
            }
            const user = await db.prepare("SELECT firstname || ' ' || lastname as name, avatar_url FROM user_data WHERE id = ?").bind(otherId).first();
            return { ...c, self_id: selfId, display_name: user?.name || 'User', display_avatar: user?.avatar_url || null };
        }));

        return json({ user_id: myId, biz_id: bizId, conversations: enriched });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// POST: Start a new conversation (or find existing)
export async function POST({ request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const body = await request.json();
        const { recipient_id, reference_id, type = 'general' } = body;

        // IDENTITY RESOLUTION: 
        // If it's an 'order' type chat (Buyer <-> Merchant), use the personal ID.
        // Otherwise, prefer bizId for business contexts.
        const myId = (type === 'order' || type === 'user') ? locals.user.id : (locals.user.bizId || locals.user.id);

        if (!recipient_id) return json({ message: 'Recipient ID required' }, { status: 400 });

        // Check if conversation already exists between these two participants
        const existing = await db.prepare(`
            SELECT id FROM conversations 
            WHERE (participant1_id = ? AND participant2_id = ?) 
               OR (participant1_id = ? AND participant2_id = ?)
        `).bind(myId, recipient_id, recipient_id, myId).first();

        if (existing) return json({ id: existing.id, message: 'Existing conversation found' });

        // Create new
        const id = 'con_' + ulid();
        await db.prepare(`
            INSERT INTO conversations (id, participant1_id, participant2_id, request_id, created_at, last_message_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(id, myId, recipient_id, reference_id || null).run();

        return json({ id, message: 'Conversation started' }, { status: 201 });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}