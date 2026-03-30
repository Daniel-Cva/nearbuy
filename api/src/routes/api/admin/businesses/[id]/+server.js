import { json } from '@sveltejs/kit';

/** 
 * Admin Route: Fetch absolute full details of a specific Business + Founder + Docs
 * @type {import('./$types').RequestHandler} 
 */
export async function GET({ params, platform, locals }) {
    try {
        // 1. Authorize super admin only!
        const admin = locals.user;
        if (!admin || admin.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ message: 'Business ID is required' }, { status: 400 });

        const db = platform.env.DB;

        // 2. Fetch the COMPLETE Business object
        const business = await db.prepare('SELECT * FROM biz_data WHERE id = ?').bind(id).first();
        if (!business) return json({ message: 'Business not found' }, { status: 404 });

        // 3. Fetch the COMPLETE Founder object
        const founder = await db.prepare('SELECT * FROM founder WHERE biz_id = ?').bind(id).first();

        // 4. Fetch the FULL extent of uploaded documents from Cloudflare R2
        const bucket = platform.env.nearbuy_storage;
        const prefix = `business/business_id_${id}/docs/`;
        const objects = await bucket.list({ prefix });
        
        // Return exactly the public keys so the frontend can display/download the PDFs and Images
        const uploadedDocs = objects.objects.map(obj => obj.key);

        // 5. Return Master Payload
        return json({
            message: 'Business details fetched successfully',
            business,
            founder: founder || null,  // In case the row is missing
            custom_kyc_docs: uploadedDocs
        });

    } catch (error) {
        console.error('Super Admin Fetch Business Details Error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
