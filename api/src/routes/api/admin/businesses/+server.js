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
        
        const [totalRes, businesses] = await db.batch([
            db.prepare('SELECT COUNT(*) as total FROM biz_data'),
            db.prepare(`
                SELECT id, bname, emails, phones, btype, city, state, status, created_at 
                FROM biz_data 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `).bind(limit, offset)
        ]);
        
        const totalBusinesses = totalRes.results[0]?.total || 0;

        return json({ 
            message: 'All businesses fetched successfully', 
            businesses: businesses.results,
            pagination: {
                total: totalBusinesses,
                page,
                limit,
                totalPages: Math.ceil(totalBusinesses / limit)
            }
        });
    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
