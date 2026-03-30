<script>
	let filter = $state('all');

	const reports = [
		{ 
			id: 'UREP-502', 
			subject: 'Inaccurate Product Price', 
			target: 'Krishna Electronics', 
			status: 'Under Review', 
			action: 'Pending Verification', 
			date: '2026-03-09',
			details: 'The price listed on the app was ₹750, but the shop asked for ₹850.'
		},
		{ 
			id: 'UREP-488', 
			subject: 'Unauthorized Business', 
			target: 'Fake Mobiles Ltd', 
			status: 'Resolved', 
			action: 'Business Removed', 
			date: '2026-03-01',
			details: 'This business does not exist at the specified location.'
		}
	];

	const filtered = $derived(
		filter === 'all' ? reports : reports.filter(r => r.status.toLowerCase().replace(' ', '-') === filter)
	);
</script>

<svelte:head>
	<title>My Reports — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
			<h1 class="font-bold text-gray-900 dark:text-white">My Reports</h1>
		</div>
	</div>

	<div class="mx-auto max-w-2xl px-6 py-6 md:py-0 md:px-0">
		<!-- Filters -->
		<div class="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
			{#each ['all', 'resolved', 'under-review'] as f}
				<button 
					onclick={() => filter = f}
					class={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all border ${filter === f ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 dark:bg-gray-900 dark:border-gray-800'}`}
				>
					{f.replace('-', ' ').toUpperCase()}
				</button>
			{/each}
		</div>

		<div class="space-y-4">
			{#each filtered as report}
				<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
					<div class="flex items-start justify-between mb-4">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
									report.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
								}`}>
									{report.status}
								</span>
								<span class="text-xs font-bold text-gray-400">ID: {report.id}</span>
							</div>
							<h3 class="text-lg font-bold text-gray-900 dark:text-white">{report.subject}</h3>
							<p class="text-sm font-medium text-gray-500 mt-0.5">Business: <span class="text-orange-500">{report.target}</span></p>
						</div>
						<div class="text-[10px] font-bold text-gray-400">{report.date}</div>
					</div>
					
					<div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
						<p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">"{report.details}"</p>
					</div>

					<div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
						<div>
							<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Resolution Status</p>
							<p class="text-sm font-bold text-gray-900 dark:text-white">{report.action}</p>
						</div>
						<a href={`/user/reports/${report.id}`} class="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Details →</a>
					</div>
				</div>
			{/each}

			{#if filtered.length === 0}
				<div class="py-20 text-center rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
					<p class="text-5xl mb-4">📜</p>
					<p class="text-sm font-bold text-gray-400">You haven't filed any reports matching this status.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
