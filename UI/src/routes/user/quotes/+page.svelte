<script>
	const requirements = [
		{
			id: 1,
			title: 'Looking for iPhone 15 Pro Max',
			date: '2 hours ago',
			category: 'Electronics',
			quotesCount: 2,
			status: 'active'
		},
		{
			id: 2,
			title: 'Need a plumber for pipe leak',
			date: '1 day ago',
			category: 'Plumbing',
			quotesCount: 5,
			status: 'active'
		},
		{
			id: 3,
			title: 'AC Servicing needed',
			date: '3 days ago',
			category: 'AC Repair',
			quotesCount: 0,
			status: 'waiting'
		}
	];
</script>

<svelte:head>
	<title>My Requirements — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
		<h1 class="font-bold">My Requirements & Quotes</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-4">
		<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Select any requirement to view responses.</p>
		
		{#each requirements as req}
			<a
				href={`/user/quotes/${req.id}`}
				class="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500 relative overflow-hidden group"
			>
				<div class="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-orange-400 to-orange-600"></div>
				
				<div class="flex items-start justify-between mb-2">
					<h2 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{req.title}</h2>
				</div>
				
				<div class="flex items-center gap-2 mb-4">
					<span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{req.category}</span>
					<span class="text-xs text-gray-500 dark:text-gray-400">• Posted {req.date}</span>
				</div>

				<div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
					{#if req.quotesCount > 0}
						<div class="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20">{req.quotesCount}</span>
							Quotes Received!
						</div>
						<span class="text-sm font-bold text-gray-400 group-hover:text-orange-500 transition-colors">View →</span>
					{:else}
						<div class="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">⏳</span>
							Waiting for responses...
						</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</div>
