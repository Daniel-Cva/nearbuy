/**
 * Admin Auth Helpers
 * Authentication is cookie-based. This module only handles clearing admin session data.
 */

export function clearAdminSession() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem('adminData');
}
