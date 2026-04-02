import { json } from '@sveltejs/kit';

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        
        // Fetch user profile
        const user = await db.prepare('SELECT id, firstname, lastname, email, phone, city, district, state, avatar_url, created_at FROM user_data WHERE id = ?').bind(params.user_id).first();
        if (!user) return json({ message: 'User not found' }, {status: 404});
        
        // Return user details for chat or job exchange
        return json(user);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}