import { json } from '@sveltejs/kit';
import { hashPassword, createToken } from '$lib/server/auth';
import { ulid } from 'ulid';
import { getBusinessDocPath } from '$lib/server/storage';
import { PUBLIC_APP_NAME } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, cookies }) {
    try {
        const formData = await request.formData();
        
        // 1. Core Validation
        const email = formData.get('email'); // Founder email
        const password = formData.get('password');
        const bname = formData.get('bname');
        const founderName = formData.get('founder_name');
        const username = formData.get('username'); // Optional UI username

        if (!email || !password || !bname || !founderName) {
            return json({ message: 'Email, password, founder_name and business name are required' }, { status: 400 });
        }

        const db = platform.env.DB;

        const existingEmail = await db.prepare('SELECT id FROM biz_login WHERE email = ?').bind(email).first();
        if (existingEmail) return json({ message: `The email is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });

        if (username) {
            const existingUsername = await db.prepare('SELECT id FROM biz_login WHERE username = ?').bind(username).first();
            if (existingUsername) return json({ message: `The username is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });
        }

        const mobile = formData.get('mobile') || null;

        if (mobile) {
            const existingPhone = await db.prepare('SELECT id FROM biz_login WHERE mobile = ?').bind(mobile).first();
            if (existingPhone) return json({ message: `The mobile is already registered with ${PUBLIC_APP_NAME}.` }, { status: 400 });
        }

        const bizId = 'biz_' + ulid(); 
        const founderId = 'fnd_' + ulid();
        const hashedPassword = await hashPassword(password);
        
        // Use UI provided username, or fallback to auto-generate
        const finalUsername = username || (email.substring(0, email.indexOf('@')) + '_' + bizId.slice(-4));

        // Optional fields safely extracted
        const btype = formData.get('btype') || null;
        const about = formData.get('about') || null;
        const city = formData.get('city') || null;
        const pincode = formData.get('pincode') || null;
        const district = formData.get('district') || null;
        const state = formData.get('state') || null;
        const address = formData.get('address') || null;
        const lat = formData.get('lat') ? parseFloat(formData.get('lat')) : null;
        const long = formData.get('long') ? parseFloat(formData.get('long')) : null;
        
        let initialCategories = '[]';
        try {
            const rawCat = formData.get('categories');
            if (rawCat) {
                const parsed = JSON.parse(rawCat);
                if (Array.isArray(parsed)) initialCategories = JSON.stringify(parsed);
            }
        } catch (e) { }

        // 2. Upload Business Documents asynchronously to R2 (Preserving Real Extension)
        const validDocTypes = ['AADHAR', 'PAN', 'INCOME', 'GST', 'OTHER'];
        const uploadedDocs = [];

        const mimeToExt = {
            'application/pdf': 'pdf',
            'image/png': 'png',
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpg',
            'image/webp': 'webp'
        };

        for (const docName of validDocTypes) {
            const file = formData.get(docName);
            if (file && file instanceof File) {
                
                // Priority 1: _FILE_NAME (custom string override)
                const customFileName = formData.get(`${docName}_FILE_NAME`);
                // Priority 2: _ORIGINAL_NAME meta or fallback natively to the attached file's actual name
                const originalName = formData.get(`${docName}_ORIGINAL_NAME`) || file.name;
                // Priority 3: _MIME type metadata injection
                const mimeType = formData.get(`${docName}_MIME`) || file.type || 'application/octet-stream';

                let ext = 'jpeg'; // Absolute fallback
                
                if (customFileName && customFileName.includes('.')) {
                    ext = customFileName.split('.').pop();
                } else if (originalName && originalName.includes('.')) {
                    ext = originalName.split('.').pop();
                } else if (mimeToExt[mimeType]) {
                    ext = mimeToExt[mimeType];
                }

                ext = ext.toLowerCase().replace(/[^a-z0-9]/g, ''); // Safety sanitize

                const objectKey = getBusinessDocPath(bizId, docName, ext);
                const arrayBuffer = await file.arrayBuffer();
                
                // Push securely with the correct explicit MIME
                await platform.env.nearbuy_storage.put(objectKey, arrayBuffer, {
                    httpMetadata: { contentType: mimeType }
                });
                
                uploadedDocs.push(`${docName}.${ext}`);
            }
        }

        // 2b. Upload Avatars (Business and Founder)
        let bizAvatarPath = null;
        let founderAvatarPath = null;

        const bizAvatarFile = formData.get('biz_avatar');
        if (bizAvatarFile && bizAvatarFile instanceof File) {
            const mimeType = bizAvatarFile.type || 'image/jpeg';
            const ext = mimeToExt[mimeType] || 'jpeg';
            bizAvatarPath = getBusinessDocPath(bizId, 'PROFILE_PIC', ext); // Consistent with docs tree
            const arrayBuffer = await bizAvatarFile.arrayBuffer();
            await platform.env.nearbuy_storage.put(bizAvatarPath, arrayBuffer, {
                httpMetadata: { contentType: mimeType }
            });
        }

        const founderAvatarFile = formData.get('founder_avatar');
        if (founderAvatarFile && founderAvatarFile instanceof File) {
            const mimeType = founderAvatarFile.type || 'image/jpeg';
            const ext = mimeToExt[mimeType] || 'jpeg';
            founderAvatarPath = `business/business_id_${bizId}/docs/FOUNDER_PIC.${ext}`; 
            const arrayBuffer = await founderAvatarFile.arrayBuffer();
            await platform.env.nearbuy_storage.put(founderAvatarPath, arrayBuffer, {
                httpMetadata: { contentType: mimeType }
            });
        }

        // 3. Database Atomicity (Batch Insertion)
        await db.batch([
            // Create Business Data
            db.prepare(`
                INSERT INTO biz_data (
                    id, bname, emails, phones, btype, about, 
                    city, pincode, district, state, address, 
                    lat, long, founder_id, categories, avatar_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `).bind(
                bizId, bname, JSON.stringify([email]), JSON.stringify(mobile ? [mobile] : []), btype || 'product', about, 
                city || 'none', pincode || '000000', district || 'none', state || 'none', address || 'none', 
                lat, long, founderId, initialCategories, bizAvatarPath
            ),

            // Create Founder Profile
            db.prepare(`
                INSERT INTO founder (
                    id, biz_id, name, email, phone, avatar_url
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).bind(founderId, bizId, founderName, email, mobile, founderAvatarPath),

            // Create Master Login inside biz_login (For founder)
            db.prepare(`
                INSERT INTO biz_login (id, biz_id, username, role, email, mobile, password_hash) 
                VALUES (?, ?, ?, 'founder', ?, ?, ?)
            `).bind(founderId, bizId, finalUsername, email, mobile, hashedPassword)
        ]);

        // Dynamic table creation removed — now handled during Super Admin Approval flow.

        // Mint token as specifically requested for UI auto-login onboarding flows
        const secret = platform.env.JWT_SECRET || 'nearbuy_dev_secret_key_123';
        const token = await createToken({ 
            userid: founderId,
            username: finalUsername,
            bizId: bizId, 
            role: 'founder' 
        }, secret);

        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: true, // Requires HTTPS
            sameSite: 'none',
            maxAge: 15 * 60
        });

        return json({
            message: 'business created successfully',
            status: 'success',
            bizId,
            founderId
        }, { status: 201 });

    } catch (error) {
        console.error('Business registration error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
