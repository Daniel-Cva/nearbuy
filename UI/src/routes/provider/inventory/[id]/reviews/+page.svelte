<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const itemId = $page.params.id;
	let item = $state({ id: itemId, name: 'Loading...', rating: 0, reviewsCount: 0 });
	let reviews = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');

	let filter = $state('all');
	let filteredReviews = $derived(
		filter === 'all' ? reviews : reviews.filter(r => r.rating === parseInt(filter))
	);

	onMount(async () => {
		try {
			// Fetch Item details
			const iRes = await fetch(`${API_BASE_URL}/api/items/${itemId}`);
			if (iRes.ok) {
				const iData = await iRes.json();
				item.name = iData.product_name;
			}

			// Fetch Reviews
			const rRes = await fetch(`${API_BASE_URL}/api/reviews?item_id=${itemId}`);
			if (rRes.ok) {
				reviews = await rRes.json();
				item.reviewsCount = reviews.length;
				if (reviews.length > 0) {
					const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
					item.rating = (sum / reviews.length).toFixed(1);
				}
			}
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	});

	function formatDate(d) {
		if (!d) return '';
		return new Date(d).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>All Reviews — {item.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href={`/provider/inventory/${itemId}`} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<div class="flex-1">
			<h1 class="font-bold text-gray-900 dark:text-white">Reviews</h1>
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.name}</p>
		</div>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-6">
		<!-- Summary -->
		<div class="flex items-center gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="text-center">
				<p class="text-4xl font-black text-gray-900 dark:text-white">{item.rating}</p>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Average</p>
			</div>
			<div class="flex-1 space-y-1.5 border-l border-gray-100 dark:border-gray-800 pl-6">
				{#each [5, 4, 3, 2, 1] as stars}
					{@const count = reviews.filter(r => r.rating === stars).length}
					<div class="flex items-center gap-2">
						<span class="w-2 text-[10px] font-bold">{stars}</span>
						<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
							<div 
								class="h-full bg-yellow-400" 
								style="width: {(count / reviews.length) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Filters -->
		<div class="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
			{#each ['all', '5', '4', '3', '2', '1'] as f}
				<button 
					onclick={() => filter = f}
					class={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${filter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800'}`}
				>
					{f === 'all' ? 'All Reviews' : `${f} Stars`}
				</button>
			{/each}
		</div>

		<!-- List -->
		<div class="space-y-4">
			{#each filteredReviews as review}
				<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div class="mb-3 flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="h-10 w-10 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-500/10">
								{#if review.avatar_url}
									<img src={review.avatar_url} alt="User" class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full items-center justify-center text-orange-500 font-bold">
										{review.firstname?.[0] ?? 'U'}
									</div>
								{/if}
							</div>
							<div>
								<p class="font-bold text-gray-900 dark:text-white">
									{review.firstname ?? 'Anonymous'} {review.lastname ?? ''}
								</p>
								<p class="text-[10px] font-bold text-gray-400">{formatDate(review.created_at)}</p>
							</div>
						</div>
						<div class="flex items-center gap-0.5 text-xs text-yellow-500 font-black">
							⭐ {review.rating}
						</div>
					</div>
					<p class="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
						{review.review_text}
					</p>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-center opacity-40">
					<span class="text-4xl mb-2">⭐</span>
					<p class="text-sm font-bold">No {filter} star reviews yet</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
