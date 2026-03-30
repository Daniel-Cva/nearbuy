import { json } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';

/** 
 * Admin Route: Fetch all unverified businesses sitting in the queue.
 * @type {import('./$types').RequestHandler} 
 */
export async function GET({ platform, locals, url }) {
    try {
        // 1. Authorize super admin (already verified by hooks.server.js, but we check role again to be safe)
        const admin = locals.user;
        if (!admin || admin.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        const db = platform.env.DB;

        // 2. Fetch total count and paginated businesses where IsVerified = 0 or status = 'pending'
        const [totalRes, pendingBiz] = await db.batch([
            db.prepare(`
                SELECT COUNT(*) as total 
                FROM biz_data 
                WHERE status = 'pending'
            `),
            db.prepare(`
                SELECT 
                    b.id, b.bname, b.emails, b.phones, b.btype,
                    b.city, b.state, b.status, b.created_at,
                    f.name as founder_name, f.email as founder_email
                FROM biz_data b
                LEFT JOIN founder f ON b.founder_id = f.id
                WHERE b.status = 'pending'
                ORDER BY b.created_at ASC
                LIMIT ? OFFSET ?
            `).bind(limit, offset)
        ]);

        const totalPending = totalRes.results[0]?.total || 0;

        // 3. (Optional but awesome) Check R2 storage exactly to see what Document proofs they provided!
        const bucket = platform.env.nearbuy_storage;
        const results = await Promise.all(pendingBiz.results.map(async (biz) => {
            
            // Look into their exact private R2 folder to see what KYC docs exist
            const prefix = `business/business_id_${biz.id}/docs/`;
            const objects = await bucket.list({ prefix });
            
            // Map the objects into clean paths the admin frontend can view/download
            const uploadedDocs = objects.objects.map(obj => obj.key);

            return {
                ...biz,
                custom_kyc_docs: uploadedDocs
            };
        }));

        return json({
            message: 'Pending businesses fetched successfully',
            businesses: results,
            pagination: {
                total: totalPending,
                page,
                limit,
                totalPages: Math.ceil(totalPending / limit)
            }
        });

    } catch (error) {
        console.error('Super Admin Fetch Error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
