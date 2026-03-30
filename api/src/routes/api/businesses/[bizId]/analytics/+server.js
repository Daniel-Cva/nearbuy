import { json } from '@sveltejs/kit';

/**
 * GET: Fetch performance analytics for a specific business.
 * Path: /api/businesses/[bizId]/analytics
 * Auth: Founder, Manager, Staff of this business, or Super Admin.
 */
export async function GET({ params, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        // 1. Authorization: Only business staff or super admins
        if (!payload) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = payload.role === 'admin';
        const isSelfBusiness = (payload.bizId === bizId || payload.id === bizId); // id check for legacy/migration

        if (!isAdmin && !isSelfBusiness) {
            return json({ message: 'Forbidden' }, { status: 403 });
        }

        const db = platform.env.DB;

        // 2. Fetch business username for dynamic table resolution
        const business = await db.prepare('SELECT bname, username FROM biz_data WHERE id = ?').bind(bizId).first();
        if (!business) {
            return json({ message: 'Business not found' }, { status: 404 });
        }

        const prefix = business.username;
        if (!prefix) {
            return json({ message: 'Business data incomplete (missing username)' }, { status: 404 });
        }

        // 3. Table names
        const tables = {
            items: `biz_${prefix}_items`,
            reviews: `biz_${prefix}_reviews`,
            requests: `biz_${prefix}_request`,
            replies: `biz_${prefix}_replies`,
            acceptance: `biz_${prefix}_acceptance`
        };

        // 4. Batch query for all stats
        // We use COALESCE and simple COUNTs
        const queries = [
            db.prepare(`SELECT COUNT(*) as total_items, COALESCE(SUM(sold_via_platform), 0) as total_sold FROM ${tables.items}`),
            db.prepare(`SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating), 0) as avg_rating FROM ${tables.reviews}`),
            db.prepare(`SELECT COUNT(*) as total_requests FROM ${tables.requests}`),
            db.prepare(`SELECT COUNT(*) as total_replies FROM ${tables.replies}`),
            db.prepare(`SELECT COUNT(*) as total_accepted FROM ${tables.acceptance}`),
            db.prepare(`SELECT COUNT(*) as recent_actions FROM biz_activity_log WHERE bizid = ? AND timestamp > datetime('now', '-30 days')`).bind(bizId)
        ];

        const batchResults = await db.batch(queries);

        const itemStats = batchResults[0].results[0] || {};
        const reviewStats = batchResults[1].results[0] || {};
        const requestStats = batchResults[2].results[0] || {};
        const replyStats = batchResults[3].results[0] || {};
        const acceptanceStats = batchResults[4].results[0] || {};
        const activityStats = batchResults[5].results[0] || {};

        const totalReplies = replyStats.total_replies || 0;
        const totalRequests = requestStats.total_requests || 0;
        const totalAccepted = acceptanceStats.total_accepted || 0;

        // Calculate rates
        const responseRate = totalRequests > 0 ? (totalReplies / totalRequests) * 100 : 0;
        const conversionRate = totalReplies > 0 ? (totalAccepted / totalReplies) * 100 : 0;

        return json({
            message: `Analytics for "${business.bname}" fetched successfully`,
            bizid: bizId,
            bname: business.bname,
            analytics: {
                performance: {
                    total_items: itemStats.total_items || 0,
                    total_sold: itemStats.total_sold || 0,
                    avg_rating: Math.round((reviewStats.avg_rating || 0) * 100) / 100,
                    total_reviews: reviewStats.total_reviews || 0
                },
                interactions: {
                    requests_received: totalRequests,
                    replies_sent: totalReplies,
                    deals_accepted: totalAccepted,
                    response_rate: Math.round(responseRate * 10) / 10,  // 1 decimal place
                    conversion_rate: Math.round(conversionRate * 10) / 10
                },
                recent_activity: {
                    actions_last_30_days: activityStats.recent_actions || 0
                }
            }
        });

    } catch (e) {
        console.error('Analytics Fetch Error:', e);
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}
