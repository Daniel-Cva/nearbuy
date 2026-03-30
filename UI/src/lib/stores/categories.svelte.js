/**
 * Categories Store
 * Caches the categories fetched from the API to avoid redundant network requests.
 */

import { API_BASE_URL } from '$lib/helpers/config.js';

// Cache categories per-role, so admin vs user don't overwrite each other if they differ
let categoryCache = $state({
	user: null,
	provider: null,
	admin: null
});
let fetchPromises = {
	user: null,
	provider: null,
	admin: null
};

export async function fetchCategories(options = {}) {
	// Parse options
	const force = typeof options === 'boolean' ? options : options.force === true;
	const role = typeof options === 'object' && options.role ? options.role : 'user';

	const activeRole = role === 'business' ? 'provider' : role;

	if (categoryCache[activeRole] && !force) {
		return categoryCache[activeRole];
	}

	if (fetchPromises[activeRole]) {
		return fetchPromises[activeRole];
	}

	let endpoint = '/api/user/categories';
	if (activeRole === 'provider') {
		endpoint = '/api/businesses/categories';
	} else if (activeRole === 'admin') {
		endpoint = '/api/admin/categories';
	}

	fetchPromises[activeRole] = (async () => {
		try {
			const res = await fetch(`${API_BASE_URL}${endpoint}`, {
				headers: { 'Accept': 'application/json' },
				credentials: 'include'
			});
			
			const resData = await res.json();
			if (res.ok && resData.categories) {
				categoryCache[activeRole] = resData.categories;
				return resData.categories;
			}
			return categoryCache[activeRole] || [];
		} catch (err) {
			console.error(`Failed to load categories for role ${activeRole}:`, err);
			return categoryCache[activeRole] || [];
		} finally {
			fetchPromises[activeRole] = null;
		}
	})();
	
	return fetchPromises[activeRole];
}

export function getCategories(role = 'user') {
	return categoryCache[role] || [];
}

export async function createCategory(data) {
	try {
		const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json' 
			},
			credentials: 'include',
			body: JSON.stringify(data)
		});
		
		const resData = await res.json();
		if (res.ok) {
			// Force re-fetch of admin cache to include the new category
			await fetchCategories({ force: true, role: 'admin' });
			return { success: true, data: resData };
		}
		return { success: false, error: resData.message || 'Failed to create category' };
	} catch (err) {
		console.error('Category creation error:', err);
		return { success: false, error: err.message };
	}
}
