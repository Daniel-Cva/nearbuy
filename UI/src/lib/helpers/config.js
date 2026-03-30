/**
 * Central API configuration.
 * Reads PUBLIC_API_BASE_URL from the .env file only.
 * If the variable is not set, a warning is logged and API calls will fail clearly.
 */

import { PUBLIC_API_BASE_URL } from '$env/static/public';

function resolveBaseUrl() {
	if (!PUBLIC_API_BASE_URL || !PUBLIC_API_BASE_URL.trim()) {
		console.warn(
			'[NearBuy] PUBLIC_API_BASE_URL is not set in your .env file. ' +
			'API calls will not work. Please add PUBLIC_API_BASE_URL=<your-api-url> to .env'
		);
		return '';
	}
	return PUBLIC_API_BASE_URL.trim().replace(/\/+$/, '');
}

/**
 * The resolved API base URL from .env (trailing slash removed).
 * Empty string if PUBLIC_API_BASE_URL is not configured.
 */
export const API_BASE_URL = resolveBaseUrl();
