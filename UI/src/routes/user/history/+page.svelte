<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let logs    = $state([]);
	let loading = $state(true);
	let errorMsg= $state('');

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me/logs`, { credentials: 'include' });
			if (!res.ok) throw new Error('Failed to load history');
			const data = await res.json();
			logs = data.logs ?? [];
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	function formatDate(ts) {
		return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Activity History — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-28">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95 px-4 py-3 backdrop-blur">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:hover:text-white"><Icon icon="mdi:arrow-left" width="20" /></a>
		<h1 class="font-bold">Activity History</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		{#if loading}
			<div class="space-y-3">
				{#each [1,2,3,4,5] as _}
					<div class="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
				{/each}
			</div>
		{:else if errorMsg}
			<div class="text-center py-10 text-red-500 font-bold">{errorMsg}</div>
		{:else if logs.length === 0}
			<div class="text-center py-16 text-gray-400">
				<Icon icon="mdi:history" width="48" class="mx-auto mb-3 opacity-30" />
				<p class="font-semibold">No activity yet.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each logs as log}
					<div class="flex items-start gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm">
						<div class="mt-0.5 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
							<Icon icon="mdi:clock-outline" width="16" class="text-orange-500" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold truncate">{log.action}</p>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(log.timestamp)}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
