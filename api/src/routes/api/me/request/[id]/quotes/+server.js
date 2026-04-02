import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/me/request/[id]/quotes
 * Listing replies from businesses for a specific user requirement and accepting one.
 */

// ── GET: See all quotes from different businesses for THIS requirement ──────
export async function GET({ params, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const requestId  = params.id;
        const db         = platform.env.DB;

        // 1. Get businesses that are active (could have replied)
        const businesses = await db.prepare("SELECT id, bname, avatar_url FROM biz_data WHERE status = 'active'").all();
        
        let allQuotes = [];

        // Check each active business's dynamic table for replies matching this requestId
        for (const biz of businesses.results) {
             const repliesTable = `biz_${biz.id}_replies`;
             try {
                // Table might not exist yet if business hasn't sent any quotes ever
                const check = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(repliesTable).first();
                if (!check) continue;

                const bizQuotes = await db.prepare(`SELECT * FROM ${repliesTable} WHERE request_id = ?`).bind(requestId).all();
                if (bizQuotes.results.length > 0) {
                     bizQuotes.results.forEach(q => {
                         allQuotes.push({
                             ...q,
                             business_id:   biz.id,
                             business_name: biz.bname,
                             business_avatar: biz.avatar_url,
                             product_info: JSON.parse(q.product_info || '{}')
                         });
                    });
                }
             } catch (_) { /* Table non-existent is skipped */ }
        }

        return json({ quotes: allQuotes });

    } catch (e) {
        console.error('Error listing quotes for requirement:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── POST: Accept a specific quote (from a business) ─────────────────────────
export async function POST({ params, request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId     = payload.id;
        const requestId  = params.id;
        const db         = platform.env.DB;
        const body       = await request.json();
        
        const { businessId, acceptedItemInfo } = body;

        if (!businessId) return json({ message: 'Missing business ID' }, { status: 400 });

        const userReqTable = `user_${userId}_request`;
        const bizAcceptanceTable = `biz_${businessId}_acceptance`;

        // 1. Update user's requirement status to 'accepted'
        await db.prepare(`UPDATE ${userReqTable} SET status = 'accepted' WHERE request_id = ?`).bind(requestId).run();

        // 2. Insert into the business's acceptance table (making it an order/job)
        // Schema: nos (ULID), accepted_item (JSON info), user_id
        await db.prepare(`
            INSERT INTO ${bizAcceptanceTable} (nos, accepted_item, user_id)
            VALUES (?, ?, ?)
        `).bind(
            'acc_' + ulid(),
            JSON.stringify(acceptedItemInfo || {}),
            userId
        ).run();

        return json({ message: 'Quote accepted successfully. The business is notified.' });

    } catch (e) {
        console.error('Error accepting quote:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
