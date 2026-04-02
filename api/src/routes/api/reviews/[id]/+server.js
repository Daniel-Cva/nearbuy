import { json } from '@sveltejs/kit';

export async function DELETE({ params, platform, locals }) {
    try {
        if (!locals.user) return json({ message: 'Unauthorized' }, { status: 401 });
        const db = platform.env.DB;
        const reviewId = params.id;

        // Check if the review belongs to the user or if the user is the business owner
        const review = await db.prepare('SELECT user_id, business_id FROM reviews WHERE id = ?').bind(reviewId).first();
        if (!review) return json({ message: 'Review not found' }, { status: 404 });

        const currentUserId = locals.user.id || locals.user.userid;
        let isAuthorized = (review.user_id === currentUserId);
        
        if (!isAuthorized && (locals.user.bizId || locals.user.biz_id)) {
            // Business owners can delete reviews that target their business
            isAuthorized = (review.business_id === (locals.user.bizId || locals.user.biz_id));
        }

        if (!isAuthorized) return json({ message: 'Forbidden' }, { status: 403 });

        await db.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewId).run();
        return json({ message: 'Review deleted' });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
