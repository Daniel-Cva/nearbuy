<script>
	import { page } from '$app/stores';
	const itemId = $page.params.id;

	const item = {
		id: itemId,
		name: 'iPhone 15 Case',
		rating: 4.6,
		reviewsCount: 42
	};

	const reviews = [
		{ id: 1, user: 'Arun K', rating: 5, comment: 'Great quality, fits perfectly!', date: '2026-02-28', status: 'verified' },
		{ id: 2, user: 'Priya M', rating: 4, comment: 'Good grip, nice colors.', date: '2026-02-25', status: 'verified' },
		{ id: 3, user: 'Rahul S', rating: 5, comment: 'Value for money. The blue color is stunning.', date: '2026-02-20', status: 'verified' },
		{ id: 4, user: 'Deepa R', rating: 4, comment: 'A bit pricey but quality is top-notch.', date: '2026-02-15', status: 'unverified' },
		{ id: 5, user: 'Vikram Ch', rating: 3, comment: 'Took too long to deliver, but product is okay.', date: '2026-02-10', status: 'verified' },
		{ id: 6, user: 'Santhosh', rating: 5, comment: 'Best case I ever bought.', date: '2026-02-05', status: 'verified' },
		{ id: 7, user: 'Anjali', rating: 4, comment: 'Very soft inside, protects well.', date: '2026-01-30', status: 'verified' }
	];

	let filter = $state('all');
	let filteredReviews = $derived(
		filter === 'all' ? reviews : reviews.filter(r => r.rating === parseInt(filter))
	);
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
						<div>
							<p class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
								{review.user}
								{#if review.status === 'verified'}
									<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[8px] text-blue-600 dark:bg-blue-500/20">✓</span>
								{/if}
							</p>
							<p class="text-[10px] font-bold text-gray-400">{review.date}</p>
						</div>
						<div class="flex items-center gap-0.5 text-xs text-yellow-500">
							{'⭐'.repeat(review.rating)}
						</div>
					</div>
					<p class="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
						{review.comment}
					</p>
					<div class="mt-4 flex gap-2">
						<button class="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:bg-gray-100 dark:bg-gray-800/50">Reply</button>
						<button class="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:bg-gray-100 dark:bg-gray-800/50">Report</button>
					</div>
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
