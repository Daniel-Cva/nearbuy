<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import Icon from '@iconify/svelte';

	let rawRequirements = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');
    let profile = $derived(getCurrentProfile());
    let bizId = $derived(profile?.biz_id);

	onMount(async () => {
        // Wait for profile if not loaded
        let attempts = 0;
        while (!bizId && attempts < 10) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        if (!bizId) {
            errorMsg = "Business ID not found. Please log in again.";
            loading = false;
            return;
        }

		try {
			const res = await fetch(`${API_BASE_URL}/api/requests?bizId=${bizId}`, { credentials: 'include' });
			if (!res.ok) throw new Error('Failed to fetch incoming requests');
			const data = await res.json();
			rawRequirements = data; // Unified API returns the array directly
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	});

    function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>User Requirements — NearBuy Business</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <Icon icon="mdi:arrow-left" width="20" height="20" />
            </a>
			<h1 class="font-bold text-gray-900 dark:text-white">Incoming Requests</h1>
		</div>
	</header>

	<div class="mx-auto max-w-3xl space-y-4 px-6 py-8">
		{#if loading}
			{#each [1, 2, 3] as i}
				<div class="h-28 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
			{/each}
		{:else if errorMsg}
			<div class="rounded-xl bg-red-500/10 p-5 text-sm font-bold text-red-500">{errorMsg}</div>
        {:else if rawRequirements.length === 0}
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
                <Icon icon="mdi:mailbox-open-outline" width="64" height="64" class="text-gray-400" />
                <h3 class="text-lg font-bold">No requests right now</h3>
                <p class="text-sm text-gray-500">New requirements from nearby users will appear here!</p>
            </div>
		{:else}
            {#each rawRequirements as req}
                <a
                    href={`/provider/requirements/${req.request_id}`}
                    class="block rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm transition-all hover:border-orange-500/50 hover:-translate-y-1 group"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">{req.main_category || 'General'}</span>
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(req.created_at)}</span>
                            </div>
                            <h3 class="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Requirement #{req.request_id.slice(-6)}</h3>
                            <p class="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                Location: {req.city}, {req.district}
                            </p>
                        </div>
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 dark:bg-gray-800 dark:group-hover:bg-gray-700">
                            <Icon icon="mdi:chevron-right" width="24" height="24" />
                        </div>
                    </div>
                </a>
            {/each}
		{/if}
	</div>
</div>
