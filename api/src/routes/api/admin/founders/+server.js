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
        
        const [totalRes, founders] = await db.batch([
            db.prepare('SELECT COUNT(*) as total FROM founder'),
            db.prepare(`
                SELECT f.*, b.bname 
                FROM founder f 
                LEFT JOIN biz_data b ON f.biz_id = b.id 
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `).bind(limit, offset)
        ]);

        const totalFounders = totalRes.results[0]?.total || 0;
        
        return json({ 
            message: 'Founders fetched successfully', 
            founders: founders.results,
            pagination: {
                total: totalFounders,
                page,
                limit,
                totalPages: Math.ceil(totalFounders / limit)
            }
        });
    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
