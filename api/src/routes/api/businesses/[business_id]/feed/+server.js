import { json } from '@sveltejs/kit';
export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user || locals.user.bizId !== params.business_id) return json({message: 'Forbidden'}, {status: 403});
        const db = platform.env.DB;

        // Fetch business details for matching
        const biz = await db.prepare('SELECT category, pincode, district FROM biz_data WHERE id = ?').bind(params.business_id).first();
        if (!biz) return json({message: 'Business not found'}, {status: 404});

        // Match based on Category OR Location
        const query = `
            SELECT * FROM requests 
            WHERE (category LIKE ? OR pincode = ? OR district = ?) 
            AND status = 'open' 
            ORDER BY created_at DESC
        `;
        const categoryMatch = `%${biz.category}%`;
        const { results } = await db.prepare(query).bind(categoryMatch, biz.pincode, biz.district).all();
        
        // Safe JSON parsing for the UI
        const data = results.map(r => ({
            ...r,
            description: JSON.parse(r.description || '{}'),
            category: JSON.parse(r.category || '[]')
        }));

        return json({ requests: data });
    } catch(err) { return json({error: err.message}, {status: 500}); }
}