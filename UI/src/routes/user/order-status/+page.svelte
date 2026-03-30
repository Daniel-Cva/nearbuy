<script>
	const orders = [
		{
			id: 'ORD-001',
			item: 'iPhone 15 Pro Max',
			provider: 'Krishna Electronics',
			status: 'provider_marked_done',
			placedAt: '2026-03-03 10:35 AM',
			markedAt: '2026-03-03 2:15 PM'
		},
		{
			id: 'ORD-002',
			item: 'Phone Repair Service',
			provider: 'Raj Mobiles',
			status: 'completed',
			placedAt: '2026-02-28 3:00 PM',
			markedAt: '2026-02-28 5:30 PM'
		}
	];

	let confirming = $state(null);
	let confirmed = $state([]);

	function confirmOrder(id) {
		confirmed = [...confirmed, id];
		confirming = null;
		setTimeout(() => (window.location.href = `/user/review/${id}`), 500);
	}

	const statusLabels = {
		in_progress: { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/10' },
		provider_marked_done: {
			label: 'Business Marked Done — Awaiting Your Confirmation',
			color: 'text-blue-400 bg-blue-500/10'
		},
		completed: { label: 'Completed', color: 'text-green-400 bg-green-500/10' }
	};
</script>

<svelte:head>
	<title>Order Status — NearBuy</title>
	<meta
		name="description"
		content="Track your active and past orders on NearBuy and confirm job completions."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-28 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
		<h1 class="font-bold">Order Status</h1>
	</header>

	<div class="mx-auto max-w-xl space-y-4 px-4 py-6">
		{#each orders as order}
			<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="mb-3 flex items-start justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
					<div>
						<h3 class="font-bold text-lg text-gray-900 dark:text-white">{order.item}</h3>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Business: <span class="text-gray-700 dark:text-gray-300">{order.provider}</span></p>
					</div>
					<span class="font-mono text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md dark:bg-orange-900/10">{order.id}</span>
				</div>

				<span
					class={`mb-3 inline-block rounded-full px-3 py-1 text-xs ${statusLabels[order.status].color}`}
					>{statusLabels[order.status].label}</span
				>

				<div class="mb-4 grid grid-cols-2 gap-2 text-xs">
					<div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 text-gray-500">
						<span class="block mb-0.5">Placed</span>
						<p class="font-medium text-gray-700 dark:text-gray-300">{order.placedAt.split(' ')[0]}</p>
					</div>
					<div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 text-gray-500">
						<span class="block mb-0.5">Marked done</span>
						<p class="font-medium text-gray-700 dark:text-gray-300">{order.markedAt.split(' ')[0]}</p>
					</div>
				</div>

				{#if order.status === 'provider_marked_done' && !confirmed.includes(order.id)}
					<div class="mb-3 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
						<span class="text-xl">🔔</span>
						<p class="font-medium">The business has marked this job as done. Please confirm to complete the order and leave a review.</p>
					</div>
					<button
						id={`confirm-order-${order.id}`}
						onclick={() => confirmOrder(order.id)}
						class="w-full flex justify-center items-center gap-2 rounded-xl bg-green-600 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-green-500 hover:-translate-y-0.5"
					>✅ Confirm Job Completed</button>
				{:else if order.status === 'completed' || confirmed.includes(order.id)}
					<div class="flex gap-2">
						<div class="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm font-bold text-green-600 shadow-sm dark:border-green-500/20 dark:bg-green-900/10 dark:text-green-500">
							✓ Completed
						</div>
						<a
							href={`/user/review/${order.id}`}
							class="flex items-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-white"
						>⭐ Review</a>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
