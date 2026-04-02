import { json } from '@sveltejs/kit';

export async function DELETE({ params, locals, platform }) {
    try {
        // 🔒 ADMIN CHECK
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ message: 'Unauthorized: Admin privileges required' }, { status: 401 });
        }

        const db = platform.env.DB;
        const { id } = params;

        // 1. Try to delete as a sub_category
        await db.prepare('DELETE FROM sub_categories WHERE sub_cat_id = ?').bind(id).run();

        // 2. Try to delete as a main category
        await db.prepare('DELETE FROM categories WHERE cat_id = ?').bind(id).run();

        return json({ message: 'Category deleted' }, { status: 200 });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
