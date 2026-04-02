import { API_BASE_URL } from '$lib/helpers/config.js';

export function getApiBaseUrl() {
	return API_BASE_URL;
}

/**
 * Cloudflare R2 public bucket base URL.
 * All object keys stored in D1 are resolved through this URL for display.
 */
export const R2_PUBLIC_BASE_URL = 'https://pub-e682b9321ee844e393cf660f83a2f3f7.r2.dev';

/**
 * Converts an R2 object key (e.g. "user/abc/profile/abc_pic.jpeg")
 * or a full URL into a displayable src attribute value.
 *
 * - Full https:// URLs are returned as-is (already absolute).
 * - Bare object keys are prefixed with the R2 public CDN base URL.
 */
export function toDisplayUrl(path) {
	if (!path) return '';
	if (/^https?:\/\//i.test(path)) return path;

	let finalPath = path;

	// Detect and parse stringified JSON arrays (FOR SINGLE THUMBNAIL USE)
	if (typeof path === 'string' && path.trim().startsWith('[')) {
		try {
			const parsed = JSON.parse(path);
			if (Array.isArray(parsed) && parsed.length > 0) {
				finalPath = parsed[0]; 
			}
		} catch (e) { }
	} else if (Array.isArray(path) && path.length > 0) {
		finalPath = path[0];
	}

	// Just in case finalPath is still a bogus empty string or null
	if (!finalPath || typeof finalPath !== 'string') return '';

	// Strip any accidental leading slashes before joining
	return `${R2_PUBLIC_BASE_URL}/${finalPath.replace(/^\/+/, '')}`;
}

export async function uploadToUniversalApi(payload) {
	const { type, file, userId, bizId, docName, itemId, imageName } = payload;
	if (!type) throw new Error('Upload type is required.');
	if (!file) throw new Error('File is required.');

	const formData = new FormData();
	formData.append('type', type);
	if (userId) formData.append('userId', userId);
	if (bizId) formData.append('bizId', bizId);
	if (docName) formData.append('docName', docName);
	if (itemId) formData.append('itemId', itemId);
	if (imageName) formData.append('imageName', imageName);
	formData.append('file', file);

	const response = await fetch(`${getApiBaseUrl()}/api/upload`, {
		method: 'POST',
		credentials: 'include',
		body: formData
	});

	const contentType = response.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const data = isJson ? await response.json() : null;

	if (!response.ok) {
		if (data?.message) throw new Error(data.message);
		if (!isJson) {
			throw new Error(
				`Upload API returned ${response.status} with non-JSON response. Check API base URL (${getApiBaseUrl()}) and endpoint /api/upload.`
			);
		}
		throw new Error(`Upload failed (${response.status})`);
	}

	if (!data?.path) {
		throw new Error('Upload succeeded but no path was returned by API.');
	}

	return data;
}
