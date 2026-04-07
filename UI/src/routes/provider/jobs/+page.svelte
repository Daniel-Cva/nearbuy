<script>
	import { getCurrentBusinessId, getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import Icon from '@iconify/svelte';

	let activeJobs = $state([]);
	let businessList = $state([]);
	let selectedBusinessId = $state(getCurrentBusinessId());
	let loading = $state(true);

	const selectedBusiness = $derived(businessList.find(b => b.id === selectedBusinessId) || getCurrentProfile());

	async function fetchJobs(bizId) {
		if (!bizId) return;
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders?status=accepted,ready,in_progress`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				activeJobs = (data.orders || []).map(order => ({
					id: order.id,
					client: order.user_info?.name || 'Buyer',
					requirement: order.accepted_item?.name || 'Service/Product',
					status: order.status,
					contact: 'N/A',
					quotedPrice: `₹${(order.price || 0).toLocaleString()}`,
					date: new Date(order.created_at).toLocaleString()
				}));
			}
		} catch (err) {
			console.error('Failed to fetch jobs:', err);
		}
	}

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				businessList = data.businesses || (data.business ? [data.business] : []);
				if (!selectedBusinessId && businessList.length > 0) {
					selectedBusinessId = businessList[0].id;
				}
			}
			await fetchJobs(selectedBusinessId);
		} catch (err) {
			console.error('Failed to init jobs page:', err);
		} finally {
			loading = false;
		}
	});

	let markedDone = $state([]);

	async function markJobDone(id) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'delivered' }),
				credentials: 'include'
			});
			if (res.ok) {
				markedDone = [...markedDone, id];
			}
		} catch (err) {
			console.error('Failed to update job status:', err);
		}
	}

	$effect(() => {
		if (selectedBusinessId) {
			fetchJobs(selectedBusinessId);
		}
	});
</script>

<svelte:head>
	<title>Active Jobs — {selectedBusiness?.name || 'Business'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-30 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2 gap-4">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <Icon icon="mdi:arrow-left" width="20" height="20" />
            </a>
			<div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
			<div class="relative group">
				<select 
					bind:value={selectedBusinessId}
					class="appearance-none bg-transparent pr-8 font-black text-xl text-gray-900 dark:text-white focus:outline-none cursor-pointer hover:text-orange-500 transition-colors"
				>
					{#each businessList as biz}
						<option value={biz.id}>{biz.name}</option>
					{/each}
				</select>
				<span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">▼</span>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-4">
        {#if loading}
            <div class="text-center py-10 opacity-50 font-bold">Loading active jobs...</div>
        {:else if activeJobs.length === 0}
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
                <Icon icon="mdi:calendar-check-outline" width="64" height="64" class="text-gray-400" />
                <h3 class="text-lg font-bold">No active jobs</h3>
                <p class="text-sm text-gray-500">Requirements accepted by you will appear here!</p>
            </div>
		{:else}
            {#each activeJobs as job}
                <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    
                    <div class="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div>
                            <h3 class="font-bold text-lg text-gray-900 dark:text-white">{job.requirement}</h3>
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Client: <span class="text-gray-700 dark:text-gray-300">{job.client}</span></p>
                        </div>
                        <div class="text-right">
                            <span class="font-mono text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md">ID: {job.id.slice(-6)}</span>
                            <p class="text-sm font-black text-gray-900 dark:text-white mt-1">{job.quotedPrice}</p>
                        </div>
                    </div>

                    <div class="mb-4 grid grid-cols-2 gap-2 text-sm">
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <span class="text-xs text-gray-500 block mb-0.5">Status</span>
                            <p class="font-bold text-blue-500 uppercase tracking-widest text-[9px]">{job.status}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <span class="text-xs text-gray-500 block mb-0.5">Accepted On</span>
                            <p class="font-medium text-gray-700 dark:text-gray-300">{job.date.split(',')[0]}</p>
                        </div>
                    </div>

                    {#if job.status === 'accepted' && !markedDone.includes(job.id)}
                        <button
                            onclick={() => markJobDone(job.id)}
                            class="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Icon icon="mdi:check-circle-outline" width="18" height="18" />
                            Mark as Delivered
                        </button>
                    {:else}
                        <div class="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-green-500/20 bg-green-50/50 dark:bg-green-900/10 py-3 font-bold text-green-600 dark:text-green-500">
                            <Icon icon="mdi:clock-check-outline" width="18" height="18" />
                            Awaiting Completion
                        </div>
                    {#if job.status === 'delivered'}
                        <div class="mt-2 text-[10px] text-center text-gray-400 font-bold uppercase tracking-wider">Awaiting customer to close the order</div>
                    {/if}
                    {/if}
                </div>
            {/each}
        {/if}
	</div>
</div>
