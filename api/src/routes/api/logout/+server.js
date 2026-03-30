import { json } from '@sveltejs/kit';

/** 
 * Nearbuy API - Global Logout
 * 
 * Clears the HttpOnly token cookie for any logged-in user 
 * (buyer, founder, or platform admin) across the entire platform.
 * 
 * @type {import('./$types').RequestHandler} 
 */
export async function POST({ cookies }) {
    // SvelteKit automatically deletes the cookie by sending a set-cookie header
    // with max-age=0 and an expiry date in the past.
    cookies.delete('token', { 
        path: '/',
        secure: true,
        sameSite: 'none'
    });
    
    return json({
        message: 'Logged out successfully',
        action: 'redirect_to_login'
    }, { status: 200 });
}
