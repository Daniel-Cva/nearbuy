import { json } from '@sveltejs/kit';
export async function PATCH({ params, request, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const body = await request.json(); // expect status: 'b_completed' or 'completed'
        const db = platform.env.DB;
        
        const acc = await db.prepare('SELECT request_id, business_id, user_id FROM acceptances WHERE id = ?').bind(params.id).first();
        if (!acc) return json({message: 'Job not found'}, {status: 404});

        // If business is marking it complete:
        if (body.status === 'b_completed' && acc.business_id !== locals.user.bizId) return json({message: 'Forbidden'}, {status: 403});
        
        // If user is marking it complete:
        if (body.status === 'completed' && acc.user_id !== locals.user.id) return json({message: 'Forbidden'}, {status: 403});

        await db.prepare('UPDATE requests SET status = ? WHERE id = ?').bind(body.status, acc.request_id).run();
        return json({ message: 'Job status updated' }, {status: 200});
    } catch(err) { return json({error: err.message}, {status: 500}); }
}