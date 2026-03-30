import { json } from '@sveltejs/kit';

export async function GET({ platform, locals, url }) {
    try {
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        const db = platform.env.DB;

        // Run queries in parallel for efficiency
        const [totalRes, users] = await db.batch([
            db.prepare('SELECT COUNT(*) as total FROM user_data'),
            db.prepare(`
                SELECT id, firstname, lastname, email, phone, city, state, status, created_at 
                FROM user_data 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `).bind(limit, offset)
        ]);

        const totalUsers = totalRes.results[0]?.total || 0;

        return json({ 
            message: 'Users fetched successfully', 
            users: users.results,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
