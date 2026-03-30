/**
 * Auth API Service
 * Handles all authentication endpoints for user, business (provider), and admin roles
 * Authentication is handled exclusively via cookie header (credentials: 'include').
 */

import { API_BASE_URL } from '$lib/helpers/config.js';

const BASE_URL = API_BASE_URL;

/**
 * Helper function to make authenticated API calls
 * Uses cookie-based authentication only (credentials: 'include').
 * @param {string} endpoint - API endpoint path
 * @param {object} options - fetch options
 * @returns {Promise<any>} - parsed JSON response
 */
async function apiCall(endpoint, options = {}) {
	const url = `${BASE_URL}${endpoint}`;

	const headers = { 
		'Accept': 'application/json',
		...options.headers 
	};

	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	console.debug(`[API Call] ${options.method || 'GET'} ${url}`, { body: options.body });

	const response = await fetch(url, {
		...options,
		headers,
		credentials: 'include'
	});

	const contentType = response.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const data = isJson ? await response.json() : null;

	console.debug(`[API Response] ${response.status} ${url}`, data);

	if (!response.ok) {
		const isAuthError = response.status === 401 || response.status === 403;
		if (isAuthError && typeof window !== 'undefined') {
			const path = window.location.pathname;
			// Only redirect if not already on a login page to avoid infinite loops
			if (!path.includes('/login') && !path.includes('/register') && !path.includes('/forgot-password')) {
				if (path.startsWith('/admin')) {
					window.location.href = '/admin/login';
				} else if (path.startsWith('/provider')) {
					window.location.href = '/provider/login';
				} else if (path.startsWith('/user')) {
					window.location.href = '/user/login';
				}
			}
		}

		throw {
			status: response.status,
			message: data?.message || `API Error ${response.status}`,
			data
		};
	}

	return data;
}

/**
 * User (Buyer) Registration
 */
export async function registerUser(data) {
	const payload = {
		firstname: String(data.firstname || '').trim(),
		lastname: String(data.lastname || '').trim(),
		email: String(data.email || '').trim(),
		password: data.password,
		mobile: data.mobile ? String(data.mobile).replace(/\D+/g, '') : undefined,
		username: data.username ? String(data.username).trim() : undefined,
		address: data.address || undefined,
		city: data.city || undefined,
		district: data.district || undefined,
		state: data.state || undefined,
		pincode: data.pincode || undefined,
		interests: Array.isArray(data.interests) ? data.interests.slice(0, 10) : undefined
	};

	return apiCall('/api/auth/user/register', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

/**
 * Business (Provider/Founder) Registration
 */
export async function registerBusiness(formData) {
	return apiCall('/api/auth/business/register', {
		method: 'POST',
		body: formData
	});
}

/**
 * User (Buyer) Login
 */
export async function loginUser(credentials) {
	const payload = {
		password: credentials.password,
		email: credentials.email ? String(credentials.email).trim() : undefined,
		mobile: credentials.mobile ? String(credentials.mobile).replace(/\D+/g, '') : undefined,
		username: credentials.username ? String(credentials.username).trim() : undefined
	};

	return apiCall('/api/auth/user/login', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

/**
 * Business (Seller/Staff) Login
 */
export async function loginBusiness(credentials) {
	const payload = {
		password: credentials.password,
		email: credentials.email ? String(credentials.email).trim() : undefined,
		mobile: credentials.mobile ? String(credentials.mobile).replace(/\D+/g, '') : undefined,
		username: credentials.username ? String(credentials.username).trim() : undefined
	};

	return apiCall('/api/auth/business/login', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

/**
 * Platform Admin Login
 */
export async function loginAdmin(credentials) {
	const payload = {
		password: credentials.password,
		...(credentials.email && { email: String(credentials.email).trim() }),
		...(credentials.mobile && { mobile: String(credentials.mobile).replace(/\D+/g, '') })
	};

	return apiCall('/api/auth/admin/login', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

/**
 * Get current session info
 */
export async function getAuthMe() {
	return apiCall('/api/me', { method: 'GET' });
}

/**
 * Normalize API responses
 */
export function parseAuthResponse(response) {
	return {
		login_status: response?.login_status || 'success',
		userid: response?.profile?.id || null,
		role: response?.role || null,
		profile: response?.profile || null,
		business: response?.business || null,
		admin: response?.role === 'admin' ? response?.profile : null
	};
}

export function getRoleFromResponse(authData) {
	// Flexible detection based on role strings and object properties
	const role = String(authData?.role || authData?.profile?.role || '').toLowerCase();
	
	if (role === 'admin') return 'admin';
	if (role === 'user' || role === 'buyer') return 'user';
	if (
		['founder', 'staff', 'manager', 'business', 'provider'].includes(role) ||
		authData?.business ||
		authData?.profile?.biz_id ||
		authData?.profile?.business_id
	) {
		return 'provider';
	}
	
	return null;
}
