import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PUBLIC Route: Customers / Public users fetching available items for a storefront!
 */
export async function GET({ request, params, platform }) {
    try {
        const { bizId } = params;
        const db = platform.env.DB;

        // Verify the business actually exists and is active before exposing items
        const biz = await db.prepare('SELECT status, username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz) return json({ message: 'Business not found' }, { status: 404 });
        if (biz.status === 'banned' || biz.status === 'inactive' || biz.status === 'pending') {
            return json({ message: 'This storefront is currently unavailable' }, { status: 403 });
        }

        const tablePrefix = biz.username;
        if (!tablePrefix) return json({ message: 'Items unavailable' }, { status: 404 });

        const url = new URL(request.url);
        const limit = 25;
        const page = parseInt(url.searchParams.get('page')) || 1;
        const offset = (page - 1) * limit;

        // Count total for shopper UI math
        const countRes = await db.prepare(`SELECT COUNT(*) as total FROM biz_${tablePrefix}_items`).first();
        const total = countRes ? countRes.total : 0;

        // Fetch their public items from the dynamic table
        const res = await db.prepare(`SELECT * FROM biz_${tablePrefix}_items ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(limit, offset).all();
        
        // Parse the image string into an array for frontend
        const items = res.results.map(item => {
            let images = [];
            try {
                images = JSON.parse(item.image || '[]');
            } catch (e) { }

            // Truncate profile strictly for list views
            return {
                nos: item.nos,
                product_name: item.product_name,
                brand: item.brand,
                selling_price: item.selling_price,
                images: images.length > 0 ? [images[0]] : [] // Only map first image exactly as required
            };
        });

        return json({ 
             message: 'items fetched successfully', 
             items,
             pagination: {
                total,
                page,
                limit,
                hasNext: offset + limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        // If the dynamic table doesn't exist (e.g. error.message contains "no such table"), it means they have 0 items.
        if (error.message.includes('no such table')) {
             return json({ message: 'items fetched successfully', count: 0, items: [] });
        }
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

/**
 * PRIVATE Route: Business Owners / Staff adding a new item to their dynamic storefront table!
 */
export async function POST({ request, params, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        // 1. Authenticate (Must be part of this business and have authorized role)
        if (!payload || payload.bizId !== bizId || !['founder', 'manager', 'staff'].includes(payload.role)) {
            return json({ message: 'Unauthorized: only business members can manage storefront inventory' }, { status: 403 });
        }

        const body = await request.json();
        const { product_name, brand, description, selling_price, mrp, category, sub_category, sub_sub_category, image } = body;

        if (!product_name || !selling_price) {
            return json({ message: 'Product name and selling price are required' }, { status: 400 });
        }

        const db = platform.env.DB;
        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const tablePrefix = biz.username;
        const itemId = 'itm_' + ulid();

        // Sanitize Category for Table Name (remove spaces, special chars)
        const sanitizedCat = (category || 'uncategorized').replace(/[^a-zA-Z0-9]/g, '_');
        const catTableName = `${sanitizedCat}_items`;

        await db.batch([
            // 1. Insert into Business-Specific Table
            db.prepare(`
                INSERT INTO biz_${tablePrefix}_items (
                    nos, product_name, brand, description, selling_price, mrp, 
                    image, category, sub_category, sub_sub_category, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `).bind(
                itemId, product_name, brand || null, description || null, 
                selling_price, mrp || null, JSON.stringify(Array.isArray(image) ? image : []),
                category || null, sub_category || null, sub_sub_category || null
            ),

            // 2. Create Global Category Table if missing
            db.prepare(`
                CREATE TABLE IF NOT EXISTS ${catTableName} (
                    nos TEXT PRIMARY KEY,
                    biz_id TEXT NOT NULL,
                    product_name TEXT NOT NULL,
                    brand TEXT,
                    description TEXT,
                    selling_price REAL NOT NULL,
                    mrp REAL,
                    image TEXT,
                    sub_category TEXT,
                    sub_sub_category TEXT,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (biz_id) REFERENCES biz_data(id)
                )
            `),

            // 3. Insert into Global Category Table
            db.prepare(`
                INSERT INTO ${catTableName} (
                    nos, biz_id, product_name, brand, description, selling_price, mrp, 
                    image, sub_category, sub_sub_category, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `).bind(
                itemId, bizId, product_name, brand || null, description || null, 
                selling_price, mrp || null, JSON.stringify(Array.isArray(image) ? image : []),
                sub_category || null, sub_sub_category || null
            )
        ]);

        return json({ 
            message: 'Item added successfully to storefront and category index', 
            item: { nos: itemId, product_name, selling_price, category: sanitizedCat } 
        }, { status: 201 });

    } catch (e) {
        console.error('Item creation error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
