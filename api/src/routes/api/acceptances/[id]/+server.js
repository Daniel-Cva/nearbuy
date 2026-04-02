import { json } from '@sveltejs/kit';

export async function GET({ params, platform, locals }) {
    try {
        if (!locals.user) return json({message: 'Unauthorized'}, {status: 401});
        const db = platform.env.DB;
        
        const acc = await db.prepare('SELECT * FROM acceptances WHERE id = ?').bind(params.id).first();
        if (!acc) return json({message: 'Job not found'}, {status: 404});

        // Ensure only participants can see the sensitive contact data
        if (acc.user_id !== locals.user.id && acc.business_id !== locals.user.bizId) {
             return json({message: 'Forbidden'}, {status: 403});
        }

        // Fetch user and business profiles simultaneously
        const [userRes, bizRes, reqRes] = await db.batch([
            db.prepare('SELECT firstname, lastname, email, phone, city, address, lat, long as lng FROM user_data WHERE id = ?').bind(acc.user_id),
            db.prepare('SELECT bname, emails, phones, address, lat, long as lng FROM biz_data WHERE id = ?').bind(acc.business_id),
            db.prepare('SELECT status, description as requirement_desc FROM requests WHERE id = ?').bind(acc.request_id)
        ]);

        return json({
             job: acc,
             request: reqRes.results[0] || null,
             buyer: userRes.results[0] || null,
             seller: bizRes.results[0] || null
        });

    } catch(err) { return json({error: err.message}, {status: 500}); }
}