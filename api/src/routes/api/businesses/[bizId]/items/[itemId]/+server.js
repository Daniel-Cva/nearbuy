import { json } from '@sveltejs/kit';

/**
 * PUBLIC Route: Customers / Public users viewing a specific item for a storefront!
 */
export async function GET({ params, platform }) {
    try {
        const { bizId, itemId } = params;
        const db = platform.env.DB;

        // Verify the business actually exists and is active before exposing items
        const biz = await db.prepare('SELECT status, username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz) return json({ message: 'Business not found' }, { status: 404 });
        if (biz.status === 'banned' || biz.status === 'inactive' || biz.status === 'pending') {
            return json({ message: 'This storefront is currently unavailable' }, { status: 403 });
        }

        const tablePrefix = biz.username;
        if (!tablePrefix) return json({ message: 'Item not found' }, { status: 404 });

        // Fetch their public item from the dynamic table
        const item = await db.prepare(`SELECT * FROM biz_${tablePrefix}_items WHERE nos = ?`).bind(itemId).first();
        
        if (!item) {
             return json({ message: 'Item not found' }, { status: 404 });
        }

        let parsedImages = [];
        // Parse the image string into an array for frontend
        try {
            parsedImages = JSON.parse(item.image || '[]');
        } catch (e) { }

        const safeItem = {
            nos: item.nos,
            product_name: item.product_name,
            brand: item.brand,
            description: item.description,
            selling_price: item.selling_price,
            mrp: item.mrp,
            images: parsedImages
        };

        return json({ message: 'Item fetched successfully', item: safeItem });
    } catch (error) {
        if (error.message.includes('no such table')) {
             return json({ message: 'Item not found' }, { status: 404 });
        }
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

/**
 * PRIVATE Route: Business Owners / Staff updating an item in their dynamic storefront table!
 */
export async function PATCH({ params, request, platform, locals }) {
    try {
        const { bizId, itemId } = params;
        const payload = locals.user;

        // AUTH: Business members only
        if (!payload || payload.bizId !== bizId || !['founder', 'manager', 'staff'].includes(payload.role)) {
            return json({ message: 'Unauthorized' }, { status: 403 });
        }

        const db = platform.env.DB;
        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const body = await request.json();
        const tablePrefix = biz.username;

        const allowed = ['product_name', 'brand', 'description', 'selling_price', 'mrp', 'category', 'sub_category', 'sub_sub_category', 'status'];
        const fields = [];
        const values = [];

        for (const key of allowed) {
            if (body[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(body[key]);
            }
        }

        // Handle image separately if provided
        if (body.image !== undefined && Array.isArray(body.image)) {
            fields.push('image = ?');
            values.push(JSON.stringify(body.image));
        }

        if (fields.length === 0) return json({ message: 'No valid fields provided' }, { status: 400 });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(itemId);

        const result = await db.prepare(`UPDATE biz_${tablePrefix}_items SET ${fields.join(', ')} WHERE nos = ?`).bind(...values).run();

        if (result.meta.changes === 0) {
            return json({ message: 'Item not found' }, { status: 404 });
        }

        return json({ message: 'Item updated successfully' });

    } catch (e) {
        console.error('Item update error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

/**
 * PRIVATE Route: Business Owners / Staff deleting an item from their dynamic storefront table!
 */
export async function DELETE({ params, platform, locals }) {
    try {
        const { bizId, itemId } = params;
        const payload = locals.user;

        // AUTH: Business members only (staff might be restricted, but let's allow for now)
        if (!payload || payload.bizId !== bizId || !['founder', 'manager', 'staff'].includes(payload.role)) {
            return json({ message: 'Unauthorized' }, { status: 403 });
        }

        const db = platform.env.DB;
        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const tablePrefix = biz.username;

        // 1. Fetch item to find its category for secondary table deletion
        const item = await db.prepare(`SELECT category FROM biz_${tablePrefix}_items WHERE nos = ?`).bind(itemId).first();
        if (!item) return json({ message: 'Item not found' }, { status: 404 });

        const sanitizedCat = (item.category || 'uncategorized').replace(/[^a-zA-Z0-9]/g, '_');
        const catTableName = `${sanitizedCat}_items`;

        await db.batch([
            db.prepare(`DELETE FROM biz_${tablePrefix}_items WHERE nos = ?`).bind(itemId),
            db.prepare(`DELETE FROM ${catTableName} WHERE nos = ? AND biz_id = ?`).bind(itemId, bizId)
        ]);

        return json({ message: 'Item deleted successfully from storefront and category index' });

    } catch (e) {
        console.error('Item delete error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
