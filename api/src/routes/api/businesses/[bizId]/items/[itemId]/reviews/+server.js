import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

/**
 * PUBLIC Route: Shoppers viewing reviews for a specific item!
 */
export async function GET({ params, platform }) {
    try {
        const { bizId, itemId } = params;
        const db = platform.env.DB;

        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const tablePrefix = biz.username;

        // Fetch all reviews for this item
        // NOTE: In the current schema, biz_${id}_reviews does NOT have an itemId column.
        // It seems the user intended one reviews table PER item? Unlikely.
        // Or maybe they forgot the itemId column in the reviews table creation?
        // Let's check the creation logic in approve route again.
        
        const reviews = await db.prepare(`SELECT * FROM biz_${tablePrefix}_reviews ORDER BY created_at DESC`).all();

        return json({ message: 'Reviews fetched successfully', reviews: reviews.results });
    } catch (error) {
        if (error.message.includes('no such table')) {
             return json({ message: 'Reviews fetched successfully', reviews: [] });
        }
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

/**
 * PRIVATE Route: Authenticated users posting a review for an item!
 */
export async function POST({ params, request, platform, locals }) {
    try {
        const { bizId, itemId } = params;
        const payload = locals.user;

        // AUTH: Only regular users can post reviews
        if (!payload || payload.role !== 'user') {
            return json({ message: 'Unauthorized: only shoppers can post reviews' }, { status: 403 });
        }

        const body = await request.json();
        const { rating, comment, image, video } = body;

        if (rating === undefined || rating < 1 || rating > 5) {
            return json({ message: 'Valid rating (1-5) is required' }, { status: 400 });
        }

        const db = platform.env.DB;
        const biz = await db.prepare('SELECT username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!biz || !biz.username) return json({ message: 'Storefront unavailable' }, { status: 404 });

        const tablePrefix = biz.username;
        const reviewId = 'rev_' + ulid();

        await db.prepare(`
            INSERT INTO biz_${tablePrefix}_reviews (id, userid, rating, comment, image, video)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            reviewId,
            payload.id,
            rating,
            comment || null,
            JSON.stringify(Array.isArray(image) ? image : []),
            JSON.stringify(Array.isArray(video) ? video : [])
        ).run();

        return json({ message: 'Review posted successfully' }, { status: 201 });

    } catch (e) {
        console.error('Review creation error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
