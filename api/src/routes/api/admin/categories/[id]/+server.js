import { json } from '@sveltejs/kit';

/**
 * Path: /api/categories/[id]
 * Unified Categories endpoint (Admin DELETE)
 */

export async function DELETE({ params, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const { id } = params;
        const db = platform.env.DB;

        // Is it a main category or nested?
        if (id.startsWith('cat_')) {
            const exists = await db.prepare('SELECT cat_id FROM categories WHERE cat_id = ?').bind(id).first();
            if (!exists) return json({ message: 'Category not found' }, { status: 404 });

            // 1. Delete all nested sub_categories associated with this top-level category
            // This natively assumes level 1 is nested directly. If deeper trees exist, CASCADE is best.
            await db.batch([
                db.prepare('DELETE FROM sub_categories WHERE parent_id = ?').bind(id),
                db.prepare('DELETE FROM categories WHERE cat_id = ?').bind(id)
            ]);

            return json({ message: 'Category and immediate subcategories deleted successfully' });
        } else if (id.startsWith('sub_')) {
            const exists = await db.prepare('SELECT sub_cat_id FROM sub_categories WHERE sub_cat_id = ?').bind(id).first();
            if (!exists) return json({ message: 'Sub-category not found' }, { status: 404 });

            await db.batch([
                // Remove deeply nested children (if nested down to level 2)
                db.prepare('DELETE FROM sub_categories WHERE parent_id = ?').bind(id), 
                db.prepare('DELETE FROM sub_categories WHERE sub_cat_id = ?').bind(id)
            ]);

            return json({ message: 'Sub-category deleted successfully' });
        } else {
            return json({ message: 'Invalid category format' }, { status: 400 });
        }

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

export async function PUT({ params, request, platform, locals }) {
    try {
        const payload = locals.user;
        if (!payload || payload.role !== 'admin') {
            return json({ message: 'Unauthorized. Super Admin access only.' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { cat_name, type } = body;

        if (!cat_name) {
            return json({ message: 'cat_name is required to update' }, { status: 400 });
        }

        const db = platform.env.DB;

        if (id.startsWith('cat_')) {
            const exists = await db.prepare('SELECT cat_id FROM categories WHERE cat_id = ?').bind(id).first();
            if (!exists) return json({ message: 'Category not found' }, { status: 404 });

            await db.prepare('UPDATE categories SET cat_name = ?, type = COALESCE(?, type) WHERE cat_id = ?')
                .bind(cat_name, type || null, id).run();

            return json({ message: 'Category updated successfully' });
        } else if (id.startsWith('sub_')) {
            const exists = await db.prepare('SELECT sub_cat_id FROM sub_categories WHERE sub_cat_id = ?').bind(id).first();
            if (!exists) return json({ message: 'Sub-category not found' }, { status: 404 });

            await db.prepare('UPDATE sub_categories SET cat_name = ?, type = COALESCE(?, type) WHERE sub_cat_id = ?')
                .bind(cat_name, type || null, id).run();

            return json({ message: 'Sub-category updated successfully' });
        } else {
            return json({ message: 'Invalid category format' }, { status: 400 });
        }

    } catch (error) {
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
