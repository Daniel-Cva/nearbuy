import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/me/request
 * Identity derived from HttpOnly cookie token via locals.
 */

// ── GET: List all requirements posted by this user ──────────────────────────
export async function GET({ platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id;
        const db = platform.env.DB;
        const tableName = `user_${userId}_request`;

        // Check if the dynamic table exists (it's created on registration)
        const checkTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(tableName).first();
        if (!checkTable) {
             return json({ requests: [] });
        }

        const data = await db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all();
        
        // Parse JSON fields (description, category, sub_categories)
        const requests = data.results.map(row => ({
            ...row,
            description: JSON.parse(row.description || '{}'),
            category: JSON.parse(row.category || '[]'),
            sub_categories: JSON.parse(row.sub_categories || '[]')
        }));

        return json({ requests });

    } catch (e) {
        console.error('Error listing user requests:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── POST: Create a new requirement ──────────────────────────────────────────
export async function POST({ request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id;
        const body   = await request.json();
        const db     = platform.env.DB;
        
        const { title, details, budget, main_category, sub_categories, lat, long, city, district, pincode, address } = body;
        
        if (!title && !details) return json({ message: 'Title or details required' }, { status: 400 });

        const requestId = 'req_' + ulid();
        const tableName = `user_${userId}_request`;
        
        // description is a JSON object with title, details, and optional budget
        const descriptionObj = { title, details, budget: budget || null };
        
        await db.prepare(`
            INSERT INTO ${tableName} (request_id, description, category, sub_categories, lat, long, city, district, pincode, address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `).bind(
            requestId,
            JSON.stringify(descriptionObj),
            JSON.stringify(main_category ? [main_category] : []),
            JSON.stringify(sub_categories || []),
            lat || null,
            long || null,
            city || null,
            district || null,
            pincode || null,
            address || null
        ).run();

        // ── BROADCASTING logic ────────────────────────────────────────────────
        // BroadCast to businesses that match the category or location
        // For simplicity: Find businesses matching the category and broadcast to them.
        let matchingBusinesses = [];
        if (main_category) {
            const biz = await db.prepare(`SELECT id, username FROM biz_data WHERE categories LIKE ? AND status = 'active'`)
                .bind(`%${main_category}%`).all();
            matchingBusinesses = biz.results;
        }

        const broadcastBatch = matchingBusinesses.map(biz => {
             const bizReqTable = `biz_${biz.id}_request`;
             return db.prepare(`
                INSERT INTO ${bizReqTable} (nos, request_id, user_id, main_category, sub_category, lat, long, city, district, pincode, address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `).bind(
                 'brc_' + ulid(),
                 requestId,
                 userId,
                 main_category || null,
                 null, // sub_category specific if needed
                 lat || null, long || null, city || null, district || null, pincode || null, address || null
             );
        });

        if (broadcastBatch.length > 0) {
            await db.batch(broadcastBatch);
        }

        return json({ message: 'Requirement posted successfully', requestId }, { status: 201 });

    } catch (e) {
        console.error('Error posting user requirement:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
