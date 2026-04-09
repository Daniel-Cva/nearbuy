import { json } from '@sveltejs/kit';

export async function GET({ locals, platform }) {
    return json({
        status: "API is active",
        version: "1.0.5 (Diagnostics Active)",
        user: locals.user,
        env: {
            database: platform?.env?.DB ? "Connected" : "Missing"
        }
    });
}
