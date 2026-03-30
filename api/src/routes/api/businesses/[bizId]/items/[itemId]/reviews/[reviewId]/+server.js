import { json } from '@sveltejs/kit';

/**
 * PRIVATE Route: Shopper/User deleting their own review!
 * OR Business Owner deleting an inappropriate review (optional policy)!
 */
export async function DELETE({ params, platform, locals }) {
    try {
        const { bizId, reviewId } = params;
        const payload = locals.user;

        if (!payload) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const db = platform.env.DB;
        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const tablePrefix = biz.username;

        // 1. Fetch the review to check ownership
        const review = await db.prepare(`SELECT userid FROM biz_${tablePrefix}_reviews WHERE id = ?`).bind(reviewId).first();
        if (!review) return json({ message: 'Review not found' }, { status: 404 });

        // 2. Auth: Only the author can delete their review (or business owner?)
        // Let's stick to the author for now.
        const accountId = payload.id || payload.userid;
        if (accountId !== review.userid && payload.bizId !== bizId) {
             return json({ message: 'Forbidden' }, { status: 403 });
        }

        await db.prepare(`DELETE FROM biz_${tablePrefix}_reviews WHERE id = ?`).bind(reviewId).all();

        return json({ message: 'Review deleted successfully' });
    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
