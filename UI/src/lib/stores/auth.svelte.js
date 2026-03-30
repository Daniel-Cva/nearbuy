/**
 * Auth Store — manages current user session, role, and active business.
 * This is the central authority for "who is logged in" across the entire app.
 * Authentication is cookie-based via 'credentials: include'. 
 * Session data is stored ONLY in memory.
 */

/** @type {'user' | 'provider' | 'admin' | null} */
let currentRole = $state(null);

/** Current logged-in user ID */
let currentUserId = $state(null);

/** Currently selected business ID (for providers with multiple businesses) */
let currentBusinessId = $state(null);

/** Current user profile (varies by role) */
let currentProfile = $state(null);

/** Current business profile (provider only) */
let currentBusiness = $state(null);

/** Whether auth has been initialized from server */
let initialized = $state(false);

/** Auth initialization error (if any) */
let initError = $state(null);

// ─── Getters ───────────────────────────────────────────────────────────────────

export function getCurrentRole() { return currentRole; }
export function getCurrentUserId() { return currentUserId; }
export function getCurrentBusinessId() { return currentBusinessId; }
export function getCurrentProfile() { return currentProfile; }
export function getCurrentBusiness() { return currentBusiness; }
export function isAuthenticated() { return !!currentUserId && !!currentRole; }
export function isInitialized() { return initialized; }
export function getInitError() { return initError; }

export function isProvider() { return currentRole === 'provider'; }
export function isUser() { return currentRole === 'user'; }
export function isAdmin() { return currentRole === 'admin'; }

// ─── Actions ───────────────────────────────────────────────────────────────────

/**
 * Set auth state from login/me response.
 * @param {{userid?: string, role: string, profile?: any, business?: any}} authData
 * @param {string} role - normalized role: 'user' | 'provider' | 'admin'
 */
export function setAuthFromResponse(authData, role) {
	currentRole = role || null;
	currentProfile = authData?.profile || null;
	currentBusiness = authData?.business || null;

	// Normalize user ID
	currentUserId = authData?.profile?.id || authData?.userid || null;

	// Set business ID if provider
	if (role === 'provider') {
		currentBusinessId = currentBusiness?.id || authData?.profile?.biz_id || authData?.profile?.business_id || null;
	}

	initialized = true;
}

/** Log out and clear all session data. */
export function logout() {
	currentUserId = null;
	currentRole = null;
	currentBusinessId = null;
	currentProfile = null;
	currentBusiness = null;
}

/** Switch the active business (for multi-business providers). */
export function setActiveBusinessId(bizId) {
	currentBusinessId = bizId;
}

/** Switch current role (for testing). */
export function setRole(role) {
	currentRole = role;
}
/**
 * Reactive Auth Object for easier access.
 * Usage: import { auth } from '$lib/stores/auth.svelte.js';
 */
export const auth = {
	get id() { return currentUserId; },
	get role() { return currentRole; },
	get profile() { return currentProfile; },
	get business() { return currentBusiness; },
	get biz_id() { return currentBusinessId; },
	get initialized() { return initialized; },
	get error() { return initError; }
};
