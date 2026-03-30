import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ platform }) {
	if (!platform?.env?.DB) {
		return json({
			success: false,
			message: 'D1 Database binding (DB) not found. Are you running with "npx wrangler dev"?'
		}, { status: 500 });
	}

	try {
		// Use a simple query that always works if the DB is connected
		const result = await platform.env.DB.prepare('SELECT 1 as "is_connected"').first();

		return json({
			success: true,
			message: 'Welcome to Nearbuy API',
			status: 'Online',
			database: result?.is_connected ? 'Connected' : 'Error',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json({
			success: false,
			message: `Database error: ${error.message}`
		}, { status: 500 });
	}
}
