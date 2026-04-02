import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
    console.log('[API] /api/categories GET called');
    try {
        const db = platform.env.DB;

        // 1. Fetch all main categories (level 0)
        const categoriesRes = await db.prepare(`
            SELECT cat_id as id, cat_name as name, type, level 
            FROM categories 
            ORDER BY cat_name ASC
        `).all();
        const mainCategories = categoriesRes.results || [];

        // 2. Fetch all subcategories (level > 0)
        const subRes = await db.prepare(`
            SELECT sub_cat_id as id, parent_id as parentId, cat_name as name, type, level 
            FROM sub_categories 
            ORDER BY cat_name ASC
        `).all();
        const allSubs = subRes.results || [];

        // 3. Recursive nesting function
        const getSubTree = (parentId) => {
            return allSubs
                .filter(s => s.parentId === parentId)
                .map(s => ({
                    ...s,
                    subCategories: getSubTree(s.id) // Recurse
                }));
        };

        // 4. Build the top-level tree
        const tree = mainCategories.map(cat => ({
            ...cat,
            subCategories: getSubTree(cat.id)
        }));

        return json(tree);
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}

export async function POST({ request, platform, locals }) {
    try {
        // 🔒 ADMIN CHECK
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized: Admin privileges required' }, { status: 401 });
        }

        const db = platform.env.DB;
        const body = await request.json();
        const { name, type, parentId, level = 0 } = body;

        if (!name || !type) {
            return json({ message: 'Name and type are required' }, { status: 400 });
        }

        const id = (parentId ? 'sub_' : 'cat_') + name.toLowerCase().replace(/\s+/g, '_');

        if (parentId) {
            // Is a subcategory
            await db.prepare(`
                INSERT INTO sub_categories (sub_cat_id, parent_id, cat_name, type, level)
                VALUES (?, ?, ?, ?, ?)
            `).bind(id, parentId, name, type, level || 1).run();
        } else {
            // Is a main category
            await db.prepare(`
                INSERT INTO categories (cat_id, cat_name, type, level)
                VALUES (?, ?, ?, ?)
            `).bind(id, name, type, level).run();
        }

        return json({ message: 'Category created', id }, { status: 201 });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
