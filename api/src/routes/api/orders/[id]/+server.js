import { json } from '@sveltejs/kit';

const normalize = (id) => String(id || '').replace(/^(usr_|biz_|ord_|req_|con_|not_|rev_|qu_)/, '').toLowerCase().trim();
const isMatch = (a, b) => normalize(a) === normalize(b);

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const myId = locals.user.id || locals.user.userid;
        const myBizId = locals.user.bizId || locals.user.biz_id || null;
        const orderId = params.id;
        
        const acc = await db.prepare('SELECT * FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Order not found' }, { status: 404 });

        // EXTREMELY PERMISSIVE CHECK FOR DEBUGGING
        const isOwner = isMatch(acc.user_id, myId);
        const isMerchant = myBizId && (isMatch(acc.business_id, myBizId) || isMatch(acc.business_id, myId));

        if (!isOwner && !isMerchant) {
             console.warn(`[PERM] Denied: User ${myId} tried to access Order ${orderId} (Owner: ${acc.user_id}, Merchant: ${acc.business_id})`);
             return json({ 
                 message: 'Forbidden', 
                 diagnostics: {
                     your_id: myId,
                     your_biz: myBizId,
                     order_owner: acc.user_id,
                     order_merchant: acc.business_id,
                     match_found: { isOwner, isMerchant }
                 }
             }, { status: 403 });
        }

        const [userRes, bizRes, reqRes] = await db.batch([
            db.prepare('SELECT firstname, lastname, email, phone, city, address FROM user_data WHERE id = ?').bind(acc.user_id),
            db.prepare('SELECT bname as biz_name, emails, phones, address, city FROM biz_data WHERE id = ?').bind(acc.business_id),
            db.prepare('SELECT status as req_status, description FROM requests WHERE id = ?').bind(acc.request_id)
        ]);

        const bizRow = bizRes.results[0] || {};
        return json({
             order: {
                ...acc,
                accepted_item: acc.accepted_item ? JSON.parse(acc.accepted_item) : null,
                business_id: acc.business_id,
                biz_name: bizRow.biz_name
             },
             request: reqRes.results[0] || null,
             buyer: userRes.results[0] || null,
             seller: bizRow
        });

    } catch (e) {
        return json({ message: 'Server Error', error: e.message }, { status: 500 });
    }
}

export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const orderId = params.id;
        const { status } = await request.json();
        const acc = await db.prepare('SELECT user_id, business_id, request_id FROM acceptances WHERE id = ?').bind(orderId).first();
        if (!acc) return json({ message: 'Not found' }, { status: 404 });

        const myId = locals.user.id || locals.user.userid;
        const myBizId = locals.user.bizId || locals.user.biz_id || null;

        if (!isMatch(acc.user_id, myId) && !isMatch(acc.business_id, myBizId)) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        const ops = [db.prepare('UPDATE acceptances SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(orderId)];
        if (status === 'b_completed' || status === 'completed' || status === 'closed') {
            ops.push(db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind(status, acc.request_id));
        }
        await db.batch(ops);
        return json({ message: 'Updated' });
    } catch (e) {
        return json({ message: 'Error', error: e.message }, { status: 500 });
    }
}
