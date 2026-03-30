/**
 * Auth Storage Helpers
 * Handles saving/loading auth profile data from localStorage for all roles.
 * Note: Tokens are NOT stored — authentication is handled via cookies only.
 */

/**
 * Save user profile to localStorage
 * @param {object} profile
 */
export function saveUserAuth(profile) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem('userData', JSON.stringify(profile || {}));
}

/**
 * Get user profile from localStorage
 * @returns {object | null}
 */
export function getUserProfile() {
	if (typeof localStorage === 'undefined') return null;
	const data = localStorage.getItem('userData');
	try {
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

/**
 * Clear user auth data from localStorage
 */
export function clearUserAuth() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem('userData');
}

/**
 * Save provider/business profile to localStorage
 * @param {object} profile - profile/founder data
 * @param {object} business - business/biz_data
 */
export function saveProviderAuth(profile, business) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem('providerData', JSON.stringify(profile || {}));
	if (business) {
		localStorage.setItem('providerBusiness', JSON.stringify(business));
	}
}

/**
 * Get provider profile from localStorage
 * @returns {object | null}
 */
export function getProviderProfile() {
	if (typeof localStorage === 'undefined') return null;
	const data = localStorage.getItem('providerData');
	try {
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

/**
 * Get provider business from localStorage
 * @returns {object | null}
 */
export function getProviderBusiness() {
	if (typeof localStorage === 'undefined') return null;
	const data = localStorage.getItem('providerBusiness');
	try {
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

/**
 * Clear provider auth data from localStorage
 */
export function clearProviderAuth() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem('providerData');
	localStorage.removeItem('providerBusiness');
}

/**
 * Save admin profile to localStorage
 * @param {object} admin - admin profile
 */
export function saveAdminAuth(admin) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem('adminData', JSON.stringify(admin || {}));
}

/**
 * Get admin profile from localStorage
 * @returns {object | null}
 */
export function getAdminProfile() {
	if (typeof localStorage === 'undefined') return null;
	const data = localStorage.getItem('adminData');
	try {
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

/**
 * Clear admin auth data from localStorage
 */
export function clearAdminAuth() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem('adminData');
}

/**
 * Clear ALL auth data
 */
export function clearAllAuth() {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem('user_id');
	}
	clearUserAuth();
	clearProviderAuth();
	clearAdminAuth();
}
