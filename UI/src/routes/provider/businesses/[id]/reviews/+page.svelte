<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { timeAgo } from '$lib/helpers/id.js';

	const bizId = $page.params.id;
	let reviews = $state([]);
	let loading = $state(true);
	let stats = $state({ average: 0, count: 0 });

	onMount(async () => {
		try {
			const [revRes, statRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/businesses/${bizId}/reviews`, { credentials: 'include' }),
				fetch(`${API_BASE_URL}/api/businesses/${bizId}/reviews/analytics`, { credentials: 'include' })
			]);

			if (revRes.ok) {
				const data = await revRes.json();
				reviews = (data.reviews || []).map(r => ({
					id: r.id,
					user: r.userName || r.user_name || 'Anonymous',
					rating: r.rating,
					comment: r.comment,
					date: timeAgo(r.createdAt || r.created_at)
				}));
			}

			if (statRes.ok) {
				const data = await statRes.json();
				stats.average = data.analytics?.avg_rating || 0;
				stats.count = data.analytics?.total_reviews || 0;
			}
		} catch (err) {
			console.error('Failed to load reviews:', err);
		} finally {
			loading = false;
		}
	});

	let averageRating = $derived(stats.average.toFixed(1));
</script>

<svelte:head>
	<title>All Reviews — NearBuy</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-8 pb-32">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-2 text-sm text-gray-500">
			<a href="/provider/businesses/{bizId}" class="hover:text-orange-500">Business Profile</a>
			<span>/</span>
			<span class="font-bold text-gray-900 dark:text-white">All Reviews</span>
		</div>
	</div>

	<div class="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 text-center">
		<h1 class="text-2xl font-black text-gray-900 dark:text-white">Customer Reviews</h1>
		<div class="mt-4 flex items-center justify-center gap-3">
			<span class="text-4xl font-black text-orange-500">{averageRating}</span>
			<div class="flex flex-col items-start gap-1">
				<div class="flex text-lg text-yellow-500">⭐⭐⭐⭐⭐</div>
				<span class="text-xs font-bold uppercase tracking-wider text-gray-500">Based on {reviews.length} reviews</span>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		{#each reviews as review}
			<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="mb-3 flex items-center justify-between">
					<span class="font-bold text-gray-900 dark:text-white">{review.user}</span>
					<span class="text-xs font-medium text-gray-500">{review.date}</span>
				</div>
				<div class="mb-3 flex text-sm text-yellow-500">
					{#each Array(5) as _, i}
						<span>{i < review.rating ? '⭐' : '☆'}</span>
					{/each}
				</div>
				<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{review.comment}</p>
			</div>
		{/each}
	</div>
</div>
