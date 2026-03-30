/**
 * Auth Initialization Helper
 * Handles /api/me endpoint (DJ.md §2.1) and session synchronization.
 * Authentication relies on cookies only — no token storage.
 */

import { getAuthMe } from './authApi.js';
import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';

/**
 * Initialize auth session by calling /api/me
 * Call this in a layout or root component onMount() to restore auth from server.
 *
 * @returns {Promise<{success: boolean, role: string | null, error: string | null}>}
 */
export async function initializeAuthFromServer() {
	try {
		// GET /api/me (DJ.md §2.1) returns the raw profile row on success.
		// A 401/403 throws an error caught below — no login_status field exists.
		const response = await getAuthMe();

		if (!response) {
			return { success: false, role: null, error: 'Empty response from /api/me' };
		}

		// Flexible role detection using the helper if available, or fall back to local logic
		let normalizedRole = null;
		const rawRole = String(response?.role || response?.profile?.role || '').toLowerCase();

		if (rawRole === 'admin') {
			normalizedRole = 'admin';
		} else if (rawRole === 'user' || rawRole === 'buyer') {
			normalizedRole = 'user';
		} else if (
			['founder', 'staff', 'manager', 'business', 'provider'].includes(rawRole) ||
			response?.biz_id ||
			response?.business_id ||
			response?.profile?.biz_id ||
			response?.profile?.business_id
		) {
			normalizedRole = 'provider';
		}

		const userId = response?.id || response?.profile?.id;

		if (!normalizedRole || !userId) {
			console.error('[AuthInit] Validation failed. Role:', rawRole, 'Normalized:', normalizedRole, 'ID:', userId);
			return { success: false, role: null, error: 'Invalid profile or role from /api/me' };
		}

		// Build authData shape compatible with setAuthFromResponse
		const authData = {
			profile: response?.profile || response,
			business: response?.business || response?.profile?.business || null,
			userid: userId
		};

		// Update the global auth store
		setAuthFromResponse(authData, normalizedRole);

		return { success: true, role: normalizedRole, error: null };
	} catch (err) {
		console.error('Failed to initialize auth from server:', err);

		return {
			success: false,
			role: null,
			error: err?.message || 'Failed to initialize auth'
		};
	}
}

/**
 * Validate current auth session by calling /api/me
 * Returns false if session is invalid or expired.
 *
 * @returns {Promise<boolean>}
 */
export async function validateAuthToken() {
	try {
		// /api/me returns a profile row on success; throws on 401/403
		const response = await getAuthMe();
		return !!response?.id;
	} catch (err) {
		console.error('Auth validation failed:', err);
		return false;
	}
}

/**
 * Sync auth state from server
 * Ensures client-side auth store matches server-side session.
 *
 * @returns {Promise<{synced: boolean, role: string | null, error: string | null}>}
 */
export async function syncAuthState() {
	try {
		// /api/me (DJ.md §2.1) returns raw profile row — no login_status wrapper
		const response = await getAuthMe();

		const userId = response?.id || response?.profile?.id;
		if (!userId) {
			return { synced: false, role: null, error: 'Server returned no active session' };
		}

		const rawRole = String(response?.role || response?.profile?.role || '').toLowerCase();
		let normalizedRole = null;
		if (rawRole === 'user' || rawRole === 'buyer') normalizedRole = 'user';
		else if (['founder', 'staff', 'manager', 'business', 'provider'].includes(rawRole)) normalizedRole = 'provider';
		else if (rawRole === 'admin') normalizedRole = 'admin';

		if (!normalizedRole) {
			return { synced: false, role: null, error: 'Could not determine role from server' };
		}

		const authData = {
			profile: response?.profile || response,
			business: response?.business || response?.profile?.business || null,
			userid: userId
		};
		setAuthFromResponse(authData, normalizedRole);

		return { synced: true, role: normalizedRole, error: null };
	} catch (err) {
		console.error('Auth sync failed:', err);

		return {
			synced: false,
			role: null,
			error: err?.message || 'Failed to sync auth state'
		};
	}
}

/**
 * Refresh user profile from server without re-authenticating.
 * Useful to get updated user info after profile changes.
 *
 * @returns {Promise<{success: boolean, profile: any, error: string | null}>}
 */
export async function refreshUserProfile() {
	try {
		// /api/me (DJ.md §2.1) returns raw profile row — no login_status wrapper
		const response = await getAuthMe();

		const userId = response?.id || response?.profile?.id;
		if (!userId) {
			return { success: false, profile: null, error: 'Not authenticated' };
		}

		const rawRole = String(response?.role || response?.profile?.role || '').toLowerCase();
		let normalizedRole = null;
		if (rawRole === 'user' || rawRole === 'buyer') normalizedRole = 'user';
		else if (['founder', 'staff', 'manager', 'business', 'provider'].includes(rawRole)) normalizedRole = 'provider';
		else if (rawRole === 'admin') normalizedRole = 'admin';

		const authData = {
			profile: response?.profile || response,
			business: response?.business || response?.profile?.business || null,
			userid: userId
		};
		setAuthFromResponse(authData, normalizedRole);

		return { success: true, profile: response?.profile || response, error: null };
	} catch (err) {
		console.error('Failed to refresh user profile:', err);
		return {
			success: false,
			profile: null,
			error: err?.message || 'Failed to refresh profile'
		};
	}
}
