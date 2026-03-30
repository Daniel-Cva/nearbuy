import { json } from '@sveltejs/kit';

/** 
 * Nearbuy API - Pincode Lookup
 * 
 * Fetches location details (City, District, State) for a given pincode.
 * Useful for auto-filling address forms during registration or searching.
 * 
 * @type {import('./$types').RequestHandler} 
 */
export async function GET({ params, platform }) {
    try {
        const { pincode } = params;

        if (!pincode) {
            return json({ message: 'Pincode parameter is required' }, { status: 400 });
        }

        const db = platform.env.PINCODEDB;

        // Fetch all location details from the dynamic PINCODEDB database
        const location = await db.prepare(
            'SELECT city, district, state, latitude as lat, longitude as long FROM pincodes WHERE pincode = ?'
        ).bind(pincode).all();

        if (location.results.length === 0) {
            return json({ message: 'Pincode not found' }, { status: 404 });
        }

        return json({
            message: 'Pincode found',
            data: location.results
        }, { status: 200 });

    } catch (error) {
        console.error('Pincode fetch error:', error);
        return json({ 
            message: 'Internal server error', 
            error: error.message 
        }, { status: 500 });
    }
}
