import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * Path: /api/categories
 * Unified Categories endpoint (Public GET, Admin POST)
 */

export async function GET({ url, platform }) {
    try {
        const db = platform.env.DB;

        // Optional: filter by type (product | service)
        const type = url.searchParams.get('type'); 

        let cats, allSubs;
        const typeFilter = type && ['product', 'service'].includes(type);

        if (typeFilter) {
            cats = await db.prepare('SELECT cat_id as id, cat_name, type, level FROM categories WHERE type = ? ORDER BY cat_name ASC').bind(type).all();
            allSubs = await db.prepare('SELECT sub_cat_id as id, parent_id, cat_name, type, level FROM sub_categories WHERE type = ? ORDER BY cat_name ASC').bind(type).all();
        } else {
            cats = await db.prepare('SELECT cat_id as id, cat_name, type, level FROM categories ORDER BY type ASC, cat_name ASC').all();
            allSubs = await db.prepare('SELECT sub_cat_id as id, parent_id, cat_name, type, level FROM sub_categories ORDER BY cat_name ASC').all();
        }

        const subMap = {};
        for (const sub of allSubs.results) {
            if (!subMap[sub.parent_id]) subMap[sub.parent_id] = [];
            subMap[sub.parent_id].push(sub);
        }

        function buildTree(parentId) {
            const children = subMap[parentId] || [];
            return children.map(child => ({
                id: child.id,
                cat_name: child.cat_name,
                type: child.type,
                level: child.level,
                sub_categories: buildTree(child.id)
            }));
        }

        const categoriesWithSubs = cats.results.map(cat => ({
            id: cat.id,
            cat_name: cat.cat_name,
            type: cat.type,
            level: cat.level,
            sub_categories: buildTree(cat.id)
        }));

        return json({
            message: 'Categories fetched successfully',
            categories: categoriesWithSubs
        });

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

export async function POST({ request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const body = await request.json();
        const { cat_name, type, parent_id } = body;

        if (!cat_name || !type) {
            return json({ message: 'cat_name and type (product/service) are required' }, { status: 400 });
        }

        if (!['product', 'service'].includes(type)) {
            return json({ message: 'Type must be strictly "product" or "service"' }, { status: 400 });
        }

        const db = platform.env.DB;

        if (!parent_id) {
            const newId = 'cat_' + ulid().toLowerCase();
            
            await db.prepare('INSERT INTO categories (cat_id, cat_name, type, level) VALUES (?, ?, ?, 0)')
                .bind(newId, cat_name, type).run();

            return json({ message: 'Main category created successfully', category: { id: newId, cat_name, type, level: 0 } }, { status: 201 });
        } else {
            let parentLevel = 0;
            const parentCat = await db.prepare('SELECT level FROM categories WHERE cat_id = ?').bind(parent_id).first();
            
            if (parentCat) {
                parentLevel = parentCat.level;
            } else {
                const parentSub = await db.prepare('SELECT level FROM sub_categories WHERE sub_cat_id = ?').bind(parent_id).first();
                if (parentSub) {
                    parentLevel = parentSub.level;
                } else {
                    return json({ message: 'parent_id provided does not exist' }, { status: 404 });
                }
            }

            const newLevel = parentLevel + 1;
            const newId = 'sub_' + ulid().toLowerCase();

            await db.prepare('INSERT INTO sub_categories (sub_cat_id, parent_id, cat_name, type, level) VALUES (?, ?, ?, ?, ?)')
                .bind(newId, parent_id, cat_name, type, newLevel).run();

            return json({ message: 'Sub-category created successfully', sub_category: { id: newId, parent_id, cat_name, type, level: newLevel } }, { status: 201 });
        }

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
