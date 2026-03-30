import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, platform, locals }) {
    try {
        const { id: bizId } = params;
        const db = platform.env.DB;

        // 1. Authorization: Only Super Admin can approve
        const adminPayload = locals.user;
        if (!adminPayload || adminPayload.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Existing check
        const biz = await db.prepare('SELECT status, bname, username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz) {
            return json({ message: 'Business not found' }, { status: 404 });
        }

        if (!biz.username) {
            return json({ message: 'Business username not found. Cannot create dynamic tables.' }, { status: 400 });
        }

        if (biz.status !== 'pending') {
            return json({ message: `Business is already ${biz.status}` }, { status: 400 });
        }

        // 3. Approval & Dynamic Table Creation (Batch)
        const tablePrefix = biz.username;

        await db.batch([
            // Update Status
            db.prepare("UPDATE biz_data SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(bizId),
            
            // Dynamic Tables creation logic
            db.prepare(`CREATE TABLE IF NOT EXISTS biz_${tablePrefix}_items (
                nos TEXT PRIMARY KEY, image TEXT, description TEXT, product_name TEXT NOT NULL,
                brand TEXT, selling_price REAL NOT NULL, mrp REAL, sold_via_platform INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`),
            db.prepare(`CREATE TABLE IF NOT EXISTS biz_${tablePrefix}_reviews (
                review_id TEXT PRIMARY KEY, item_nos TEXT NOT NULL, user_id TEXT NOT NULL, rating INTEGER DEFAULT 0,
                review_text TEXT, review_video_url TEXT DEFAULT '[]', image_url TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`),
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_biz_${tablePrefix}_reviews_item ON biz_${tablePrefix}_reviews(item_nos)`),
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_biz_${tablePrefix}_reviews_user ON biz_${tablePrefix}_reviews(user_id)`),
            db.prepare(`CREATE TABLE IF NOT EXISTS biz_${tablePrefix}_request (
                nos TEXT PRIMARY KEY, main_category TEXT, sub_category TEXT, user_id TEXT,
                lat REAL, long REAL, city TEXT, district TEXT, pincode TEXT, address TEXT,
                request_id TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`),
            db.prepare(`CREATE TABLE IF NOT EXISTS biz_${tablePrefix}_replies (
                nos TEXT PRIMARY KEY, businessid TEXT NOT NULL, business_name TEXT, 
                product_info TEXT NOT NULL, request_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`),
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_biz_${tablePrefix}_replies_req_id ON biz_${tablePrefix}_replies(request_id)`),
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_biz_${tablePrefix}_replies_biz_id ON biz_${tablePrefix}_replies(businessid)`),
            db.prepare(`CREATE TABLE IF NOT EXISTS biz_${tablePrefix}_acceptance (
                nos TEXT PRIMARY KEY, accepted_item TEXT NOT NULL, user_id TEXT NOT NULL, 
                date DATETIME DEFAULT CURRENT_TIMESTAMP
            )`),
            
            // Log this action
            db.prepare("INSERT INTO sa_activity_log (nos, said, action) VALUES (?, ?, ?)")
              .bind(ulid(), adminPayload.id, `APPROVE Business "${biz.bname}" (ID: ${bizId})`)
        ]);

        return json({ message: `Business "${biz.bname}" approved and activated successfully.` });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
