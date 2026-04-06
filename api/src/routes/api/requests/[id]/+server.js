import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PATH: /api/requests/[id]
 * Consolidated requirement detail, status updates, and business notifications.
 */

// --- GET: Fetch single requirement details ---
export async function GET({ params, platform, locals }) {
    console.log(`[API] GET request details for: ${params.id}`);
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        
        const req = await db.prepare('SELECT * FROM requests WHERE id = ?').bind(params.id).first();
        if (!req) return json({message: 'Requirement not found'}, {status: 404});

        // Parse JSON fields
        const data = {
            ...req,
            description: JSON.parse(req.description || '{}'),
            category: JSON.parse(req.category || '[]'),
            sub_categories: JSON.parse(req.sub_categories || '[]')
        };

        return json(data);
    } catch(err) { 
        return json({error: err.message}, {status: 500}); 
    }
}

// --- PATCH: Notify businesses (Direct Request) AND update status ---
export async function PATCH({ params, request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId     = payload.id;
        const requestId  = params.id;
        const body       = await request.json();
        const db         = platform.env.DB;
        
        // 1. Fetch requirement details and verify ownership
        const req = await db.prepare('SELECT user_id, status, description FROM requests WHERE id = ?').bind(requestId).first();
        if (!req) return json({ message: 'Requirement not found' }, { status: 404 });
        if (req.user_id !== userId) return json({ message: 'Forbidden' }, { status: 403 });

        // A. Handle Status Update
        if (body.status) {
            await db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind(body.status, requestId).run();
            return json({ message: `Status updated to ${body.status}` });
        }

        // B. Handle Business Notifications (Direct Request)
        const { target_business_ids } = body;
        if (!target_business_ids || !Array.isArray(target_business_ids)) {
            return json({ message: 'Nothing to update (status or target_business_ids required)' }, { status: 400 });
        }
        
        const descObj = JSON.parse(req.description || '{}');
        const title = descObj.title || 'New Requirement';

        // 2. Update the requirement with stringified IDs
        await db.prepare('UPDATE requests SET target_business_ids = ? WHERE id = ?').bind(JSON.stringify(target_business_ids), requestId).run();

        // 3. Create Notifications
        const notificationBatch = target_business_ids.map(bizId => {
            return db.prepare(`INSERT INTO notifications (id, business_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)`).bind(
                'not_' + ulid(),
                bizId,
                'requirement',
                requestId,
                `Requirement found near you: ${title}`
            );
        });

        if (notificationBatch.length > 0) {
            await db.batch(notificationBatch);
        }

        return json({ message: `Successfully notified ${target_business_ids.length} businesses.`, count: target_business_ids.length });

    } catch (e) {
        console.error('Error in PATCH /api/requests/[id]:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// --- DELETE: Close a requirement ---
export async function DELETE({ params, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'user') return json({ message: 'Unauthorized' }, { status: 401 });

        const userId     = payload.id;
        const requestId  = params.id;
        const db         = platform.env.DB;

        await db.prepare(`UPDATE requests SET status = 'closed' WHERE id = ? AND user_id = ?`).bind(requestId, userId).run();
        
        return json({ message: 'Requirement closed successfully' });

    } catch (e) {
        console.error('Error closing requirement:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
