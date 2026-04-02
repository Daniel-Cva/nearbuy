import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
    try {
        const db = platform.env.DB;
        const biz = await db.prepare('SELECT id, bname, btype, categories, about, city, district, state, pincode, address, lat, long, avatar_url, created_at, emails, phones, status, IsVerified FROM biz_data WHERE id = ?').bind(params.business_id).first();
        if (!biz) return json({ message: 'Business not found' }, {status: 404});
        // We removed founder_id for privacy, exposing only public biz details and contact mechanisms
        return json(biz);
    } catch(err) { return json({error: err.message}, {status: 500}); }
}