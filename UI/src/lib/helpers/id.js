// Simple incrementing ID generator per prefix
const counters = {};

/**
 * Generate a unique ID with a given prefix.
 * Example: generateId('biz') → 'biz_1', 'biz_2', ...
 */
export function generateId(prefix = 'id') {
	if (!counters[prefix]) counters[prefix] = 100; // start at 100 to avoid clashing with seed data
	counters[prefix]++;
	return `${prefix}_${counters[prefix]}`;
}

/**
 * Format a date object as a relative time string.
 * Example: "2 hours ago", "3 days ago"
 */
export function timeAgo(date) {
	const now = new Date();
	const diff = now - new Date(date);
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 30) return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return 'Just now';
}

/**
 * Calculate distance between two coordinates in km (Haversine formula).
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Format distance for display (m or km).
 */
export function formatDistance(km) {
	if (km < 1) return `${Math.round(km * 1000)}m`;
	return `${km.toFixed(1)}km`;
}
