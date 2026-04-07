<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import Icon from '@iconify/svelte';

	let requestId = $derived(page.params.id);
    let profile   = $derived(getCurrentProfile());
    let bizId     = $derived(profile?.biz_id);

    let requestDetail = $state(null);
	let loading = $state(true);
	let sending = $state(false);
	let errorMsg = $state('');

    let price = $state('');
    let deliveryDays = $state('');
    let notes = $state('');

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, { credentials: 'include' });
			if (!res.ok) throw new Error('Requirement not found');
			const data = await res.json();
			requestDetail = data; // Unified API returns the object directly
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	});

	async function handleSendQuote(e) {
        e.preventDefault();
		if (sending) return;
		sending = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/quotes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					requestId: requestId,
					product_info: {
						item_name: requestDetail.description?.title || "Requirement Offer",
						price: parseFloat(price),
						delivery_time: deliveryDays + ' days',
						note: notes
					}
				})
			});
			if (!res.ok) throw new Error('Failed to send quote');
			alert('Quote sent successfully!');
			goto('/provider/requirements');
		} catch (err) {
			alert(err.message);
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>Requirement Detail — NearBuy Business</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<button onclick={() => history.back()} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="20" height="20" />
		</button>
		<h1 class="font-bold flex-1">Requirement Details</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-8 space-y-6">
		{#if loading}
			<div class="h-48 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
			<div class="h-64 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
		{:else if errorMsg}
			<div class="rounded-xl bg-red-500/10 p-5 text-sm font-bold text-red-500">{errorMsg}</div>
		{:else}
			<!-- User Requirement Detail -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
                <div class="absolute top-4 right-4">
                    <span class="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-600 dark:bg-orange-500/10">
                        {requestDetail.status}
                    </span>
                </div>
				<h2 class="text-2xl font-black mb-1 pr-16">{requestDetail.description?.title}</h2>
				<p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Posted for: {requestDetail.category?.[0] || 'Uncategorized'}</p>
				
				<div class="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800 mb-6">
					<p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{requestDetail.description?.details}</p>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
						<span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">User Budget</span>
						<span class="font-black text-lg">₹{requestDetail.description?.budget || 'Any'}</span>
					</div>
					<div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
						<span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Location</span>
						<span class="font-black text-lg">{requestDetail.city || 'Any'}</span>
					</div>
				</div>
                
                <div class="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Icon icon="mdi:map-marker-outline" width="16" height="16" />
                    {requestDetail.address || 'Broadcasting globally'}
                </div>
			</div>

			<!-- Send Quote Form -->
			<form onsubmit={handleSendQuote} class="rounded-2xl border border-orange-200 bg-orange-50/20 p-6 shadow-sm dark:border-orange-950/30 dark:bg-orange-950/5 space-y-4">
				<h3 class="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest text-xs px-1">
					<Icon icon="mdi:send-variant-outline" width="16" height="16" />
					Your Best Quote
				</h3>

				<div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" for="quote-price">Price (₹)</label>
                        <input id="quote-price" type="number" bind:value={price} required placeholder="500" 
                            class="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 font-bold text-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" for="quote-delivery">Delivery Days</label>
                        <input id="quote-delivery" type="number" bind:value={deliveryDays} required placeholder="2" 
                            class="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 font-bold text-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                    </div>
				</div>

                <div class="space-y-1">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" for="quote-notes">Notes to User</label>
                    <textarea id="quote-notes" bind:value={notes} placeholder="Explain your pricing or offer..." rows="3"
                        class="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"></textarea>
                </div>

				<button
					type="submit"
					disabled={sending}
					class="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/30 active:scale-[0.98] transition-transform disabled:opacity-50"
				>
					{#if sending}<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" />{:else}<Icon icon="mdi:send-check" width="18" height="18" />{/if}
					Send Quote Now
				</button>
			</form>
		{/if}
	</div>
</div>
