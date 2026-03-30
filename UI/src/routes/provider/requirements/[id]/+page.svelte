<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { timeAgo } from '$lib/helpers/id.js';

	const reqId = page.params.id;
	let loading = $state(true);
	let rawReq = $state(null);

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/requirements/${reqId}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawReq = data.requirement || data;
			}
		} catch (err) {
			console.error('Failed to fetch requirement detail:', err);
		} finally {
			loading = false;
		}
	});

	const req = $derived(rawReq ? {
		id: rawReq.id,
		title: rawReq.title,
		description: rawReq.description,
		category: rawReq.category,
		type: rawReq.type,
		user: rawReq.user_name || rawReq.user?.name || 'User',
		distance: rawReq.distance || '—',
		postedAt: timeAgo(rawReq.createdAt || rawReq.created_at),
		attachments: rawReq.attachments || []
	} : null);
</script>

<svelte:head>
	<title>Requirement {reqId} — NearBuy</title>
	<meta
		name="description"
		content="View user requirement details and respond with a quote or show interest."
	/>
</svelte:head>

<div>
	<div class="flex items-center gap-4 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2">
		<a href="/provider/requirements" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Requirements</a>
		<h1 class="font-bold text-gray-900 dark:text-white uppercase">{reqId}</h1>
	</div>

	<div class="mx-auto max-w-2xl space-y-6 px-6 py-6 md:py-0 md:px-0">
		<!-- Details -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 px-2.5 py-0.5 text-[10px] tracking-wider font-black uppercase shadow-sm dark:text-blue-400"
					>{req.category}</span
				>
				<span class="rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-[10px] tracking-wider font-black uppercase shadow-sm dark:text-gray-400"
					>{req.type}</span
				>
			</div>
			<h2 class="mb-3 text-xl font-bold text-gray-900 dark:text-white leading-tight">{req.title}</h2>
			<p class="mb-6 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">{req.description}</p>
			
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
				<div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					<span class="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 block mb-0.5">From</span>
					<p class="text-sm font-bold text-gray-900 dark:text-white">{req.user}</p>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					<span class="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 block mb-0.5">Distance</span>
					<p class="text-sm font-bold text-gray-900 dark:text-white">{req.distance}</p>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					<span class="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 block mb-0.5">Posted</span>
					<p class="text-sm font-bold text-gray-900 dark:text-white">{req.postedAt}</p>
				</div>
			</div>
		</div>

		<!-- Attachments -->
		{#if req.attachments.length > 0}
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
				<h3 class="mb-4 font-bold text-gray-900 dark:text-white">📎 Attachments</h3>
				<div class="space-y-2">
					{#each req.attachments as att}
						<div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 p-3 shadow-sm transition-colors hover:border-gray-200 hover:bg-white dark:hover:border-gray-600">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-900 text-lg">🖼️</span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">{att}</span>
							<button class="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-orange-500 transition-colors shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-orange-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800 dark:text-orange-400">View</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
			<h3 class="mb-3 font-bold text-gray-900 dark:text-white">Your Response</h3>
			{#if req.type === 'product'}
				<p class="mb-5 text-sm font-medium text-gray-500 dark:text-gray-400">
					Send a price quote to let this user know you can fulfill their need.
				</p>
				<a
					href={`/provider/quote/${reqId}`}
					id="btn-send-quote"
					class="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-95"
					><span>💰</span> Send Price Quote</a
				>
			{:else}
				<p class="mb-5 text-sm font-medium text-gray-500 dark:text-gray-400">
					Show interest to let this user know you're available for this service.
				</p>
				<button
					id="btn-show-interest"
					class="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 font-bold text-white shadow-md shadow-green-500/20 transition-all hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-green-500/40 active:scale-95"
					><span>✋</span> Show Interest</button
				>
			{/if}
		</div>
	</div>
</div>
