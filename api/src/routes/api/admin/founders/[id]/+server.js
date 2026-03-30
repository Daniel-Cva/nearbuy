import { json } from '@sveltejs/kit';

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const db = platform.env.DB;
        
        const founder = await db.prepare('SELECT * FROM founder WHERE id = ?').bind(id).first();
        if (!founder) return json({ message: 'Founder not found' }, { status: 404 });

        const business = await db.prepare('SELECT id, bname, bemail, bphone, btype, status FROM biz_data WHERE id = ?').bind(founder.biz_id).first();

        // Check if there's an avatar or anything hosted in R2 for this founder uniquely (business profile)
        return json({ message: 'Specific founder profile fetched', founder, business });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
