<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';
	import Icon from '@iconify/svelte';

	let requestId = $derived(page.params.id);
	let requestDetail = $state(null);
	let quotes = $state([]);
	let loading = $state(true);
	let accepting = $state(false);
	let errorMsg = $state('');

	onMount(async () => {
		try {
			// Fetch request detail
			const detailRes = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, { credentials: 'include' });
			if (!detailRes.ok) throw new Error('Requirement not found');
			const detailData = await detailRes.json();
			requestDetail = detailData.request || detailData; // Handle both wrapper and raw response

			// Fetch quotes
			const quotesRes = await fetch(`${API_BASE_URL}/api/quotes?requestId=${requestId}`, { credentials: 'include' });
			if (!quotesRes.ok) throw new Error('Failed to load quotes');
			const quotesData = await quotesRes.json();
			quotes = quotesData.quotes || [];
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	});

	async function handleAccept(businessId, quote) {
		if (accepting) return;
		accepting = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					quote_id: quote.id,
					request_id: requestId,
					business_id: businessId,
					item_data: quote.product_info,
					price: quote.product_info?.price
				})
			});
			if (!res.ok) throw new Error('Failed to accept quote');
			goto('/user/orders'); // Go to orders list after success
		} catch (err) {
			alert(err.message);
		} finally {
			accepting = false;
		}
	}
</script>

<svelte:head>
	<title>Requirement Details & Quotes — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<button onclick={() => history.back()} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="20" height="20" />
		</button>
		<h1 class="font-bold flex-1">Requirement & Quotes</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-6">
		{#if loading}
			<div class="h-40 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
			<div class="space-y-4 pt-4">
				<div class="h-20 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-60"></div>
				<div class="h-20 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-40"></div>
			</div>
		{:else if errorMsg}
			<div class="rounded-xl bg-red-500/10 p-5 text-sm font-bold text-red-500">{errorMsg}</div>
		{:else}
			<!-- Request Info -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
                <div class="absolute top-0 right-0 p-4">
                    <span class={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${requestDetail.status === 'open' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                        {requestDetail.status}
                    </span>
                </div>
				<h2 class="text-xl font-black mb-2 pr-12">{requestDetail.description?.title}</h2>
				<p class="text-gray-600 dark:text-gray-400 text-sm mb-4">{requestDetail.description?.details}</p>
				
				<div class="flex flex-wrap gap-2 text-xs">
					<span class="rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
						Budget: {requestDetail.description?.budget ? `₹${requestDetail.description?.budget}` : 'Any'}
					</span>
					<span class="rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
						Location: {requestDetail.city || 'Anywhere'}
					</span>
				</div>
			</div>

			<!-- Quotes List -->
			<div class="space-y-4">
				<h3 class="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-xs px-2">
					<Icon icon="mdi:chat-outline" width="16" height="16" />
					Responses ({quotes.length})
				</h3>

				{#if quotes.length === 0}
					<div class="bg-gray-100 dark:bg-gray-900/50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
						<Icon icon="mdi:hourglass-empty" width="32" height="32" class="mx-auto text-gray-400 mb-2" />
						<p class="text-gray-500 font-bold text-sm uppercase tracking-wide">Waiting for quotes...</p>
					</div>
				{:else}
					{#each quotes as quote}
						<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4 group transition-all hover:border-orange-500/50">
							<div class="flex items-center gap-4 border-b border-gray-50 dark:border-gray-800 pb-3">
								<div class="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
									{#if quote.business_avatar}
										<img src={toDisplayUrl(quote.business_avatar)} alt={quote.business_name} class="h-full w-full object-cover" />
									{:else}
                                        <div class="h-full w-full flex items-center justify-center text-lg font-black bg-orange-500 text-white">
                                            {quote.business_name[0]}
                                        </div>
									{/if}
								</div>
								<div class="flex-1">
									<h4 class="font-extrabold text-gray-900 dark:text-white text-md">{quote.business_name}</h4>
									<div class="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Business Partner</div>
								</div>
								<div class="text-right">
									<p class="text-xl font-black text-orange-600 dark:text-orange-400 tracking-tighter">₹{quote.product_info?.price}</p>
									<p class="text-[10px] font-black text-gray-400 uppercase">Per Item / Job</p>
								</div>
							</div>

							<div class="space-y-2 py-1">
                                {#if quote.product_info?.notes}
								    <p class="text-sm font-bold text-gray-700 dark:text-gray-300">"{quote.product_info.notes}"</p>
                                {/if}
								<div class="flex items-center gap-3 text-xs text-gray-500">
									<span class="flex items-center gap-1 font-bold">
										<Icon icon="mdi:clock-outline" width="14" height="14" class="text-gray-400" />
										Delivery: {quote.product_info?.delivery_time || 'Immediate'}
									</span>
								</div>
							</div>

							{#if requestDetail.status === 'open'}
								<button
									onclick={() => handleAccept(quote.business_id, quote)}
                                    disabled={accepting}
									class="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
								>
                                    {#if accepting}<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" />{:else}<Icon icon="mdi:check-decagram" width="18" height="18" />{/if}
									Accept Quote
								</button>
							{:else}
								<div class="w-full text-center py-2 text-xs font-black uppercase text-gray-400 tracking-widest">
									Requirement Closed
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>
