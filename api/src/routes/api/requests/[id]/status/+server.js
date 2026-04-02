import { json } from '@sveltejs/kit';
export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json();
        const db = platform.env.DB;
        
        // Validate ownership 
        const reqResult = await db.prepare('SELECT user_id, status FROM requests WHERE id = ?').bind(params.id).first();
        if (!reqResult) return json({message: 'Not found'}, {status: 404});
        
        if (reqResult.user_id !== locals.user.id) return json({message: 'Forbidden'}, {status: 403});

        await db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind(body.status, params.id).run();
        return json({ message: 'Status updated' }, {status: 200});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}