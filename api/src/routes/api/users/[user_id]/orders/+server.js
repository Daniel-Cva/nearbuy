import { json } from '@sveltejs/kit';

/**
 * 🚩 DEPRECATED: Consolidated into /api/orders.
 */
export async function GET({ url }) {
    console.warn(`[DEPRECATION] GET call to legacy route: ${url.pathname}`);
    return json({ 
        message: 'This endpoint is deprecated. Use /api/orders instead.' 
    }, { status: 410 });
}