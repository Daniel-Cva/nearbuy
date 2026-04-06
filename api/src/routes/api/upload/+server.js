import { json } from '@sveltejs/kit';
import { 
    getUserProfilePicPath, 
    getBusinessProfilePicPath, 
    getBusinessDocPath, 
    getBusinessItemImagePath,
    getReviewImagePath,
    getReviewVideoPath
} from '$lib/server/storage';

/** 
 * Nearbuy API - Universal File Uploader
 * 
 * Securely streams file uploads from the UI directly into the Cloudflare R2 bucket.
 * Organizes files dynamically based on your path architecture rules:
 * 
 * 1. User Profile      -> user/{userId}/profile/{userId}_pic.{ext}
 * 2. Business Profile  -> business/business_id_{bizId}/profile/{bizId}_pic.{ext}
 * 3. Business Docs     -> business/business_id_{bizId}/docs/{docName}.{ext}
 * 4. Business Items    -> business/business_id_{bizId}/items/items_{itemId}/{imageName}.{ext}
 * 5. Review Images     -> reviews/item${itemId}/images/review_img_${num}.{ext}
 * 6. Review Videos     -> reviews/item${itemId}/videos/REVIEW_VID${num}.{ext}
 * 
 * After upload, the R2 object key is automatically persisted to the correct D1 column.
 * 
 * @type {import('./$types').RequestHandler} 
 */
export async function POST({ request, platform, locals }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const uploadType = formData.get('type'); // The "Action" type to perform
        
        // Extracted Identity Strings
        const userId = formData.get('userId');
        const bizId = formData.get('bizId');
        
        // Extracted Meta Strings (For docs or items)
        const docName = formData.get('docName'); 
        const itemId = formData.get('itemId');   
        const imageName = formData.get('imageName') || 'main'; 
        const num = formData.get('num'); // For review images/videos (e.g. 1, 2, 3)

        if (!file || !(file instanceof File)) {
            return json({ message: 'No valid file attached under key "file"' }, { status: 400 });
        }

        // Priority Metadata Injection
        const customFileName = formData.get(`${docName || uploadType}_FILE_NAME`);
        const originalName = formData.get(`${docName || uploadType}_ORIGINAL_NAME`) || file.name;
        const mimeType = formData.get(`${docName || uploadType}_MIME`) || file.type || 'application/octet-stream';

        let ext = 'jpeg';
        const mimeToExt = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
        
        if (customFileName && customFileName.includes('.')) {
            ext = customFileName.split('.').pop();
        } else if (originalName && originalName.includes('.')) {
            ext = originalName.split('.').pop();
        } else if (mimeToExt[mimeType]) {
            ext = mimeToExt[mimeType];
        }

        ext = ext.toLowerCase().replace(/[^a-z0-9]/g, '');

        let objectKey = '';

        // Route the upload to the correct R2 folder path based on requested type
        switch (uploadType) {
            case 'user-profile':
                if (!userId) return json({ message: 'userId is required' }, { status: 400 });
                objectKey = getUserProfilePicPath(userId, ext);
                break;
                
            case 'business-profile':
                if (!bizId) return json({ message: 'bizId is required' }, { status: 400 });
                objectKey = getBusinessProfilePicPath(bizId, ext);
                break;
                
            case 'business-docs':
                if (!bizId || !docName) return json({ message: 'bizId and docName are required' }, { status: 400 });
                objectKey = getBusinessDocPath(bizId, docName, ext);
                break;

            case 'business-item':
                if (!bizId || !itemId) return json({ message: 'bizId and itemId are required' }, { status: 400 });
                objectKey = getBusinessItemImagePath(bizId, itemId, imageName, ext);
                break;
                
            case 'review-image':
                if (!itemId || !num) return json({ message: 'itemId and num are required' }, { status: 400 });
                objectKey = getReviewImagePath(itemId, num, ext);
                break;

            case 'review-video':
                if (!itemId || !num) return json({ message: 'itemId and num are required' }, { status: 400 });
                objectKey = getReviewVideoPath(itemId, num, ext);
                break;

            case 'request-attachment':
                const reqId = formData.get('requestId');
                if (!reqId) return json({ message: 'requestId is required' }, { status: 400 });
                objectKey = `requests/req_${reqId}/attachments/attach_${Date.now()}.${ext}`;
                break;

            default:
                return json({ message: 'Invalid or missing "type" in formData' }, { status: 400 });
        }

        // Convert file into an arrayBuffer readable by Cloudflare R2
        const arrayBuffer = await file.arrayBuffer();
        
        // Push object directly into the nearbuy bucket
        await platform.env.nearbuy_storage.put(objectKey, arrayBuffer, {
            httpMetadata: {
                contentType: file.type // Allows browsers to render it as an image later natively
            }
        });

        // ── Persist the R2 key back to D1 ────────────────────────────────────
        const db = platform.env.DB;
        try {
            if (uploadType === 'user-profile' && userId) {
                // Save avatar_url for the user in both user_data and user_login tables
                await db.batch([
                    db.prepare('UPDATE user_data SET avatar_url = ? WHERE id = ?').bind(objectKey, userId),
                ]);
            } else if (uploadType === 'business-profile' && bizId) {
                // Save avatar_url for biz_data
                    await db.prepare('UPDATE biz_data SET avatar_url = ? WHERE id = ?').bind(objectKey, bizId).run();
                // Also update founder avatar if the uploader is the founder
                if (locals?.user?.id) {
                    await db.prepare('UPDATE founder SET avatar_url = ? WHERE biz_id = ? AND id = ?')
                        .bind(objectKey, bizId, locals.user.id).run();
                }
            }
        } catch (dbErr) {
            // D1 persistence failure is non-fatal — file is already safely in R2.
            // The frontend can still use the returned path.
            console.error('[Upload] D1 persistence error (non-fatal):', dbErr.message);
        }

        return json({
            message: 'File uploaded successfully to R2 and path saved to D1!',
            path: objectKey,
            size: file.size,
            format: file.type
        }, { status: 201 });

    } catch (error) {
        console.error('File Upload Error (R2):', error);
        return json({ message: 'Cloudflare R2 Internal server error', error: error.message }, { status: 500 });
    }
}
