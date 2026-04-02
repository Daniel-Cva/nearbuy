<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import Icon from '@iconify/svelte';

	let requirements = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');

	async function loadRequirements() {
		try {
			loading = true;
			const res = await fetch(`${API_BASE_URL}/api/requests`, { credentials: 'include' });
			if (!res.ok) throw new Error('Failed to load requirements');
			const data = await res.json();
			requirements = data.requests || [];
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(loadRequirements);

	async function closeRequirement(id) {
		if (!confirm('Are you sure you want to close this requirement? You will no longer receive new quotes.')) return;
		try {
			const res = await fetch(`${API_BASE_URL}/api/requests/${id}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'closed' })
			});
			if (res.ok) {
				requirements = requirements.map(r => r.id === id ? { ...r, status: 'closed' } : r);
			}
		} catch (e) {
			alert('Failed to close requirement');
		}
	}

	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getStatusColor(status) {
		switch (status) {
			case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'accepted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
			default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
		}
	}
</script>

<svelte:head>
	<title>My Requirements — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="20" height="20" />
		</a>
		<h1 class="font-bold flex-1 text-sm uppercase tracking-tight">My Requirements</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-4">
		{#if loading && requirements.length === 0}
			{#each [1, 2, 3] as i}
				<div class="h-32 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
			{/each}
		{:else if errorMsg}
			<div class="rounded-xl bg-red-500/10 p-5 text-sm font-bold text-red-500">
				Error: {errorMsg}
			</div>
		{:else if requirements.length === 0}
			<div class="flex flex-col items-center justify-center p-10 text-center space-y-4">
				<div class="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
					<Icon icon="mdi:clipboard-text-search-outline" width="40" height="40" class="text-gray-400" />
				</div>
				<h3 class="text-lg font-bold">No requirements yet</h3>
				<p class="text-gray-500 max-w-xs text-sm">Post what you need and local businesses will send you quotes!</p>
				<a href="/user/post-requirement" class="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30">Post Now</a>
			</div>
		{:else}
			{#each requirements as req}
				<div
					class="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-orange-500 dark:border-gray-800 dark:bg-gray-900 relative overflow-hidden group"
				>
					<div class="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-orange-400 to-orange-600"></div>
					
					<div class="flex items-start justify-between mb-2">
						<h2 class="text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mr-2">
							{req.description?.title || 'Unnamed requirement'}
						</h2>
						<span class={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
							{req.status}
						</span>
					</div>
					
					<div class="flex items-center gap-2 mb-3">
						<span class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
							{req.category?.[0] || 'Uncategorized'}
						</span>
						<span class="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Posted {formatDate(req.created_at)}</span>
					</div>

					<p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
						{req.description?.details || 'No additional details provided.'}
					</p>

					<div class="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
						<a 
							href={`/user/quotes/${req.id}`}
							class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 active:scale-95 transition-transform"
						>
							<Icon icon="mdi:chat-processing-outline" width="18" height="18" />
							View Quotes
						</a>
						
						{#if req.status === 'open'}
						<button 
							onclick={() => closeRequirement(req.id)}
							class="p-3 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-500 dark:border-gray-800 transition-colors"
							title="Close Requirement"
						>
							<Icon icon="mdi:close-circle-outline" width="20" height="20" />
						</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
