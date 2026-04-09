<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
    import { getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import Icon from '@iconify/svelte';

	let rawAcceptances = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');
    let profile = $derived(getCurrentProfile());
    let bizId = $derived(profile?.biz_id);

	async function loadOrders() {
        if (!bizId) return;
		try {
			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/request/acceptances`, { credentials: 'include' });
			if (!res.ok) throw new Error('Failed to fetch orders');
			const data = await res.json();
			rawAcceptances = data.acceptances || [];
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
        let attempts = 0;
        while (!bizId && attempts < 10) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
        if (!bizId) {
            errorMsg = "Business ID not found.";
            loading = false;
            return;
        }
		await loadOrders();
	});

    async function markAsDone(orderId) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'b_completed' }),
                credentials: 'include'
            });
            if (res.ok) {
                await loadOrders();
                alert("Job marked as done! Customer will be notified to confirm.");
            }
        } catch (err) {
            console.error('Failed to mark done:', err);
        }
    }

    function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

    function formatTime(dateStr) {
		const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
</script>

<svelte:head>
	<title>Job Status — NearBuy Business</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <Icon icon="mdi:arrow-left" width="20" height="20" />
            </a>
			<h1 class="font-bold text-gray-900 dark:text-white text-xl">Active Jobs & Orders</h1>
		</div>
	</header>

	<div class="mx-auto max-w-2xl px-6 py-8">
		{#if loading}
			{#each [1, 2] as i}
				<div class="h-48 w-full animate-pulse rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-4"></div>
			{/each}
		{:else if errorMsg}
			<div class="rounded-xl bg-red-500/10 p-5 text-sm font-bold text-red-500">{errorMsg}</div>
        {:else if rawAcceptances.length === 0}
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
                <Icon icon="mdi:calendar-check-outline" width="64" height="64" class="text-gray-400" />
                <h3 class="text-lg font-bold">No active jobs</h3>
                <p class="text-sm text-gray-500">Requirements accepted by users will appear here!</p>
            </div>
		{:else}
			<div class="space-y-4">
				{#each rawAcceptances as acc}
					<div class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
						<div class="mb-4 flex items-start justify-between">
							<div>
								<div class="flex items-center gap-2 mb-1">
									<span class="text-[10px] font-black uppercase tracking-tighter text-gray-400">Order #{acc.id.slice(-6)}</span>
									<span class={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${acc.req_status === 'b_completed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
										{acc.req_status === 'b_completed' ? 'Work Completed' : 'In Progress'}
									</span>
								</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white">{acc.user_info?.name || 'Customer'}</h3>
                                <p class="text-xs font-bold text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                    <Icon icon="mdi:phone" width="14" height="14" />
                                    {acc.user_info?.phone || 'No contact info'}
                                </p>
							</div>
							<div class="text-right">
								<p class="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">₹{acc.final_price || '0'}</p>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</p>
							</div>
						</div>

						<div class="space-y-2 mb-6 p-4 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Item Details</span>
                            <p class="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                {acc.accepted_item?.name || 'Service Order'}
                            </p>
                            {#if acc.req_description?.details}
                                <p class="text-xs text-gray-400 italic mt-1 line-clamp-1">{acc.req_description.details}</p>
                            {/if}
						</div>

						<div class="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800/50">
							<div class="flex items-center gap-4">
								<div class="flex flex-col">
									<span class="text-[9px] font-black text-gray-400 uppercase">Started On</span>
									<span class="text-xs font-bold">{formatDate(acc.created_at)}</span>
								</div>
							</div>
                            <div class="flex gap-2">
                                <a href={`/provider/messages`} class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 hover:text-orange-500 transition-colors">
                                    <Icon icon="mdi:chat-processing-outline" width="20" />
                                </a>
                                {#if acc.req_status !== 'b_completed' && acc.req_status !== 'completed'}
                                    <button 
                                        onclick={() => markAsDone(acc.id)}
                                        class="rounded-xl bg-orange-600 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Mark Done
                                    </button>
                                {:else if acc.req_status === 'completed'}
                                     <span class="flex items-center gap-1 text-[11px] font-black text-green-500 uppercase">
                                        <Icon icon="mdi:check-circle" /> Finished
                                     </span>
                                {/if}
                            </div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
