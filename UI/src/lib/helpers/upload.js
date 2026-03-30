import { API_BASE_URL } from '$lib/helpers/config.js';

export function getApiBaseUrl() {
	return API_BASE_URL;
}

export function toDisplayUrl(path) {
	if (!path) return '';
	if (/^https?:\/\//i.test(path)) return path;
	return `${getApiBaseUrl()}/${String(path).replace(/^\/+/, '')}`;
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
