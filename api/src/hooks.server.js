import { verifyToken } from '$lib/server/auth';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    // 🛡️ Path Normalization: Fix //api/ paths to /api/
    if (event.url.pathname.includes('//')) {
        const normalizedPath = event.url.pathname.replace(/\/+/g, '/');
        event.url.pathname = normalizedPath;
    }

	// 🛡️ Handle CORS Preflight correctly
	if (event.request.method === 'OPTIONS') {
        const origin = event.request.headers.get('origin');
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': origin || 'http://localhost:5173',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sveltekit-action',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
			}
		});
	}

    // 🛡️ AUTHENTICATION: Read and Verify Token from HttpOnly Cookie
    const token = event.cookies.get('token');
    event.locals.user = null; // Default to unauthenticated

    if (token) {
        console.log(`[AUTH DEBUG] Token Found:`, token.substring(0, 15) + '...');
        try {
            const secret = event.platform?.env?.JWT_SECRET;
            if (secret) {
                const payload = await verifyToken(token, secret);
                if (payload) {
                    console.log(`[AUTH DEBUG] Success! Extracted ID: ${payload.id || payload.userid}, Role: ${payload.role}`);
                    event.locals.user = payload; // Inject verified identity into locals
                }
            }
        } catch (e) {
            console.error('[hooks] Token verification error:', e.message);
        }
    } else {
        console.log(`[AUTH DEBUG] No token provided in cookies for request: ${event.url.pathname}`);
    }

    // 🛡️ CENTRALIZED GUARD: Require authentication for specific API paths (Wildcard: /api/user/*)
    const { pathname } = event.url;
    
    // Areas requiring valid authentication (/api/auth/* is fully public — login & register)
    const protectedPaths = [
        '/api/me', 
        '/api/businesses/', 
        '/api/admin/', 
        '/api/requests', 
        '/api/acceptances', 
        '/api/conversations', 
        '/api/messages', 
        '/api/reports',
        '/api/users/'
    ];
    const isProtectedArea = protectedPaths.some(path => pathname.startsWith(path));
    
    // EXCEPTION: Allow login, registration, public auth routes, and public categories list
    const isPublicAuthRoute = pathname.startsWith('/api/auth/');
    const isPublicCategoryRoute = pathname.startsWith('/api/categories') && event.request.method === 'GET';

    // 🔒 AUTH CHECK: Check if the user is authenticated 
    const isAuthenticated = !!event.locals.user;

    // EXCEPTION: Allow public business GET requests
    const isPublicBusinessRoute = pathname.startsWith('/api/businesses/') && event.request.method === 'GET';

    if (isProtectedArea && !isPublicAuthRoute && !isPublicCategoryRoute && !isPublicBusinessRoute) {
        // 1. Check if token is simply missing or invalid
        if (!isAuthenticated) {
            return new Response(JSON.stringify({ message: 'Unauthorized: Token validation failed or missing' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Strict Role Check: All /api/admin/* paths REQUIRE role === 'admin'
        if (pathname.startsWith('/api/admin/') && event.locals.user.role !== 'admin') {
            return new Response(JSON.stringify({ message: 'Unauthorized: Admin privileges required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const response = await resolve(event);

    const origin = event.request.headers.get('origin');
	if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
    
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sveltekit-action');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

	return response;
}