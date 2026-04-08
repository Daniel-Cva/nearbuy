import { json } from '@sveltejs/kit';

/**
 * GET /api/businesses
 * Retrieves a list of businesses. Supports discovery based on location if lat/long/radius provided.
 */
export async function GET({ url, platform }) {
    try {
        const db = platform.env.DB;
        const lat = parseFloat(url.searchParams.get('lat'));
        const long = parseFloat(url.searchParams.get('long'));
        const radius = parseFloat(url.searchParams.get('radius')) || 15; // default 15km
        const category = url.searchParams.get('category');

        let query = `SELECT id, bname, btype, categories, about, city, district, state, pincode, address, lat, long, avatar_url, IsVerified, status FROM biz_data WHERE status = 'active'`;
        const params = [];

        if (!isNaN(lat) && !isNaN(long)) {
            const latDelta = radius / 111;
            const longDelta = radius / (111 * Math.cos(lat * Math.PI / 180));
            query += ' AND lat BETWEEN ? AND ? AND long BETWEEN ? AND ?';
            params.push(lat - latDelta, lat + latDelta, long - longDelta, long + longDelta);
        }

        if (category && category !== 'All') {
            query += ' AND (btype = ? OR categories LIKE ?)';
            params.push(category, `%${category}%`);
        }

        const { results } = await db.prepare(query).bind(...params).all();
        return json(results);
    } catch (err) {
        console.error('[API GET BUSINESSES ERROR]', err);
        return json({ error: err.message }, { status: 500 });
    }
}
