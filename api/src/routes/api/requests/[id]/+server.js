import { json } from '@sveltejs/kit';

/**
 * GET: Fetch single requirement details
 * PATH: /api/requests/[id]
 */
export async function GET({ params, platform, locals }) {
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
