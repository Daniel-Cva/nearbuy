import { json } from '@sveltejs/kit';

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const db = platform.env.DB;
        
        const user = await db.prepare('SELECT * FROM user_data WHERE id = ?').bind(id).first();
        if (!user) return json({ message: 'User not found' }, { status: 404 });

        return json({ message: 'Specific user profile fetched', user });
    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
