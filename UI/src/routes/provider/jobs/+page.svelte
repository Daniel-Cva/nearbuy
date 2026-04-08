<script>
	import { getCurrentBusinessId, getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import Icon from '@iconify/svelte';

	let activeJobs = $state([]);
	let businessList = $state([]);
	let selectedBusinessId = $state(getCurrentBusinessId());
	let loading = $state(true);

	const selectedBusiness = $derived(businessList.find(b => b.id === selectedBusinessId) || { name: 'Business' });

	async function fetchJobs(bizId) {
		if (!bizId) return;
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				activeJobs = (data.orders || []).map(order => ({
					...order,
					client: order.user_info?.name || 'Buyer',
					requirement: order.accepted_item?.name || 'Service/Product',
					quotedPrice: order.final_price || (order.price ? `₹${Number(order.price).toLocaleString()}` : '—'),
					date: new Date(order.created_at).toLocaleString(),
					email: order.user_info?.email,
					phone: order.user_info?.phone,
					status: order.req_status || order.status // Use requirement status
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
	let selectedJob = $state(null); // For Buyer Details Modal

	async function updateStatus(id, newStatus) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
				credentials: 'include'
			});
			if (res.ok) {
				if (newStatus === 'b_completed') markedDone = [...markedDone, id];
				await fetchJobs(selectedBusinessId);
			}
		} catch (err) {
			console.error('Update failed:', err);
		}
	}

	async function startChat(userId) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipient_id: userId }),
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				window.location.href = `/provider/messages/${data.id}`;
			}
		} catch (e) {
			console.error('Chat failed:', e);
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
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Go Back">
                <Icon icon="mdi:arrow-left" width="20" height="20" />
            </a>
			<div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
			<div class="relative group">
				<select 
					bind:value={selectedBusinessId}
					class="appearance-none bg-transparent pr-8 font-black text-xl text-gray-900 dark:text-white focus:outline-none cursor-pointer hover:text-orange-500 transition-colors"
                    aria-label="Select Business"
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
                <div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                    
                    <div class="flex items-start justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div class="flex-1 overflow-hidden">
                            <h3 class="font-black text-lg text-gray-900 dark:text-white truncate">{job.requirement}</h3>
                            <p class="text-xs font-bold text-gray-400 mt-0.5">Customer: {job.client}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="font-mono text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">#{job.id.slice(-6)}</span>
                            <p class="text-base font-black text-gray-900 dark:text-white mt-1">{job.quotedPrice}</p>
                        </div>
                    </div>

                    <div class="mb-5 grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Current State</span>
                            <p class={`font-black uppercase tracking-widest text-[10px] ${job.status === 'delivered' ? 'text-green-500' : 'text-blue-500'}`}>{job.status}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Received</span>
                            <p class="font-bold text-gray-700 dark:text-gray-300 text-[10px]">{job.date.split(',')[0]}</p>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        {#if job.status === 'accepted'}
                            <button
                                onclick={() => updateStatus(job.id, 'b_completed')}
                                class="flex-1 rounded-2xl bg-orange-500 py-3.5 font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95 flex items-center justify-center gap-2 text-xs"
                            >
                                <Icon icon="mdi:truck-check" width="16" /> Mark Delivered
                            </button>
							<button
                                onclick={() => updateStatus(job.id, 'closed')}
                                class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 font-black text-red-500 transition-all hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:border-red-500/20 active:scale-95 text-xs"
								title="Cannot fulfill / Cancel"
                                aria-label="Cancel Job"
                            >
                                <Icon icon="mdi:close-circle" width="16" />
                            </button>
                        {:else if job.status === 'b_completed'}
                            <div class="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 py-3.5 font-black text-blue-600 dark:text-blue-500 text-xs">
                                <Icon icon="mdi:clock-check" width="16" /> Awaiting Buyer Confirmation
                            </div>
                        {:else if job.status === 'completed'}
                             <div class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-50 dark:bg-green-500/10 py-3.5 font-black text-green-600 text-xs">
                                <Icon icon="mdi:check-all" width="16" /> Job Fully Completed
                            </div>
                        {:else if job.status === 'closed'}
							<div class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 py-3.5 font-black text-gray-400 text-xs grayscale">
                                <Icon icon="mdi:cancel" width="16" /> Job Cancelled
                            </div>
						{/if}

                        <button 
							onclick={() => selectedJob = job}
							class="rounded-2xl border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-3.5 text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/20"
							title="View Customer Contact"
                            aria-label="View Customer Contact"
						>
							<Icon icon="mdi:card-account-phone" width="18" />
						</button>
						
						<button 
							onclick={() => startChat(job.user_id)}
							class="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-all dark:bg-gray-900 dark:border-gray-800"
							title="Message Customer"
                            aria-label="Message Customer"
						>
							<Icon icon="mdi:chat" width="18" />
						</button>
                    </div>
                </div>
            {/each}
        {/if}
	</div>

	<!-- Buyer Details Modal -->
	{#if selectedJob}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
			<button class="absolute inset-0 cursor-default" onclick={() => selectedJob = null} aria-label="Dismiss Modal"></button>
			<div class="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-gray-900 p-8">
				<h2 class="text-xl font-black text-gray-900 dark:text-white mb-6">Buyer Details</h2>
				
				<div class="space-y-4">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400">
							<Icon icon="mdi:account" width="24" />
						</div>
						<div>
							<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Name</p>
							<p class="text-base font-bold text-gray-900 dark:text-white">{selectedJob.client}</p>
						</div>
					</div>

					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-blue-500">
							<Icon icon="mdi:phone" width="24" />
						</div>
						<div>
							<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</p>
							<p class="text-base font-bold text-gray-900 dark:text-white">{selectedJob.phone || 'N/A'}</p>
						</div>
					</div>

					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-red-500">
							<Icon icon="mdi:email" width="24" />
						</div>
						<div>
							<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
							<p class="text-base font-bold text-gray-900 dark:text-white">{selectedJob.email || 'N/A'}</p>
						</div>
					</div>
				</div>

				<button 
					onclick={() => selectedJob = null}
					class="w-full mt-8 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 py-4 font-black text-white active:scale-95 transition-all"
				>
					Close
				</button>
			</div>
		</div>
	{/if}
</div>
