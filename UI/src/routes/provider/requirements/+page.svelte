<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { timeAgo } from '$lib/helpers/id.js';

	let rawRequirements = $state([]);
	let loading = $state(true);
	let filter = $state('new');

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/requirements`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawRequirements = data.requirements || [];
			}
		} catch (err) {
			console.error('Failed to fetch requirements:', err);
		} finally {
			loading = false;
		}
	});

	const filtered = $derived(
		rawRequirements.filter(r => {
			if (filter === 'all') return true;
			if (filter === 'new') return r.status === 'new' || r.status === 'pending';
			if (filter === 'responded') return r.status === 'responded' || r.status === 'active';
			return r.status === filter;
		}).map(r => ({
			...r,
			userName: r.user_name || r.user?.name || 'Unknown User',
			time: timeAgo(r.createdAt || r.created_at),
			distance: r.distance || '—'
		}))
	);

	function reportUser(e, req) {
		e.preventDefault();
		e.stopPropagation();
		if (confirm(`Do you want to report user for abusive behavior?`)) {
			alert('Report filed successfully. Our team will review this shortly.');
		}
	}
</script>

<svelte:head>
	<title>User Requirements — NearBuy</title>
	<meta
		name="description"
		content="View and respond to user requirement requests nearby your business."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div
		class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2"
	>
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>← Home</a
			>
			<h1 class="font-bold text-gray-900 dark:text-white">Requirements</h1>
		</div>
		<div class="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 shadow-inner">
			{#each ['new', 'responded', 'all'] as f}
				<button
					id={`req-filter-${f}`}
					onclick={() => (filter = f)}
					class={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
					>{f}</button
				>
			{/each}
		</div>
	</div>

	<div class="mx-auto max-w-3xl space-y-4 px-6 py-6 md:py-0 md:px-0">
		{#each filtered as req}
			<a
				href={`/provider/requirements/${req.id}`}
				class="block rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-md"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="flex-1">
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span
									class={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-sm ${req.status === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
									>{req.status}</span
								>
								<span class="text-xs font-semibold text-gray-500 dark:text-gray-400"
									>{req.category} · {req.type}</span
								>
							</div>
							<button
								onclick={(e) => reportUser(e, req)}
								class="text-[10px] font-black uppercase text-red-500 hover:text-red-600 tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
							>
								Report Abuse 🚩
							</button>
						</div>
						<h3 class="font-bold text-gray-900 dark:text-white text-lg leading-tight">{req.title}</h3>
						<p class="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
							{req.userName} · {req.distance} · {req.time}
						</p>
					</div>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-orange-400"
					>
						→
					</div>
				</div>
			</a>
		{/each}
		{#if filtered.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50"
			>
				<div class="mb-4 text-6xl opacity-40">📭</div>
				<h3 class="mb-1 text-lg font-bold text-gray-900 dark:text-white">No requirements found</h3>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
					No requests match this filter right now.
				</p>
			</div>
		{/if}
	</div>
</div>

