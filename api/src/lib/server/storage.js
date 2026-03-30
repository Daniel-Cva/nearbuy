/**
 * storage.js — Nearbuy API R2 Bucket Storage Path Generators
 * 
 * Centralized utility for consistent object key (path) generation 
 * for Cloudflare R2 bucket storage.
 * 
 * Bucket Name: nearbuy (managed via binding `nearbuy_storage`)
 */

/**
 * Returns the object key for a user's profile picture.
 * Pattern: user/{userid}/profile/{userid}_pic.{ext}
 * 
 * @param {string} userId
 * @param {string} ext - Defaults to 'jpeg'
 * @returns {string}
 */
export function getUserProfilePicPath(userId, ext = 'jpeg') {
    if (!userId) throw new Error('userId is required');
    return `user/${userId}/profile/${userId}_pic.${ext}`;
}

/**
 * Returns the object key for a business's profile picture.
 * Pattern: business/business_id_{businessid}/profile/{businessid}_pic.{ext}
 * 
 * @param {string} businessId
 * @param {string} ext - Defaults to 'jpeg'
 * @returns {string}
 */
export function getBusinessProfilePicPath(businessId, ext = 'jpeg') {
    if (!businessId) throw new Error('businessId is required');
    return `business/business_id_${businessId}/profile/${businessId}_pic.${ext}`;
}

/**
 * Returns the object key for a business document (e.g., AADHAR, PAN, INCOME, GST).
 * Pattern: business/business_id_{businessid}/docs/{documentName}.{ext}
 * 
 * @param {string} businessId
 * @param {string} documentName - e.g. "AADHAR", "PAN", "GST"
 * @param {string} ext - Defaults to 'jpeg'
 * @returns {string}
 */
export function getBusinessDocPath(businessId, documentName, ext = 'jpeg') {
    if (!businessId || !documentName) throw new Error('businessId and documentName are required');
    // Ensure document name doesn't contain slashes or weird characters
    const safeDocName = documentName.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    return `business/business_id_${businessId}/docs/${safeDocName}.${ext}`;
}

/**
 * Returns the object key for a business item's image.
 * Pattern: business/business_id_{businessid}/items/items_{itemsID}/{imageName}.{ext}
 * 
 * @param {string} businessId
 * @param {string} itemId
 * @param {string} imageName - "main", "image_1", "image_2", "image_3", etc.
 * @param {string} ext - Defaults to 'jpeg'
 * @returns {string}
 */
export function getBusinessItemImagePath(businessId, itemId, imageName = 'main', ext = 'jpeg') {
    if (!businessId || !itemId) throw new Error('businessId and itemId are required');
    // Validate common image names: main, image_1, image_2, etc.
    const safeImageName = imageName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `business/business_id_${businessId}/items/items_${itemId}/${safeImageName}.${ext}`;
}

/**
 * Returns the object key for a review's image.
 * Pattern: reviews/item${itemId}/images/review_img_${num}.{ext}
 * 
 * @param {string} itemId
 * @param {number|string} num - e.g. 1, 2, 3
 * @param {string} ext - Defaults to 'jpeg'
 * @returns {string}
 */
export function getReviewImagePath(itemId, num, ext = 'jpeg') {
    if (!itemId || num === undefined) throw new Error('itemId and num are required');
    return `reviews/item${itemId}/images/review_img_${num}.${ext}`;
}

/**
 * Returns the object key for a review's video.
 * Pattern: reviews/item${itemId}/videos/REVIEW_VID${num}.{ext}
 * 
 * @param {string} itemId
 * @param {number|string} num - e.g. 1, 2, 3
 * @param {string} ext - Defaults to 'mp4'
 * @returns {string}
 */
export function getReviewVideoPath(itemId, num, ext = 'mp4') {
    if (!itemId || num === undefined) throw new Error('itemId and num are required');
    return `reviews/item${itemId}/videos/REVIEW_VID${num}.${ext}`;
}

/**
 * Get the public URL for a given object key if you have a custom domain attached to your bucket.
 * 
 * @param {string} objectKey
 * @param {string} customDomain - e.g. "https://cdn.nearbuy.com"
 * @returns {string}
 */
export function getPublicUrl(objectKey, customDomain) {
    // Strip trailing slash if present
    const base = customDomain.endsWith('/') ? customDomain.slice(0, -1) : customDomain;
    return `${base}/${objectKey}`;
}
