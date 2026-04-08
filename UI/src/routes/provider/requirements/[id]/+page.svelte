<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile, getCurrentBusinessId } from '$lib/stores/auth.svelte.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';
	import Icon from '@iconify/svelte';

	let requestId = $derived(page.params.id);
    let profile   = $derived(getCurrentProfile());
    let bizId     = $derived(getCurrentBusinessId());

    let requestDetail = $state(null);
    let existingQuote = $state(null);
	let loading = $state(true);
	let sending = $state(false);
	let errorMsg = $state('');

    let price = $state('');
    let deliveryDays = $state('');
    let notes = $state('');
    let inventory = $state([]);
    let showInventoryModal = $state(false);
    let selectedItem = $state(null);
    let inventorySearch = $state('');

    let filteredInventory = $derived(
        inventory.filter(i => 
            i.product_name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
            (i.brand && i.brand.toLowerCase().includes(inventorySearch.toLowerCase()))
        )
    );

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, { credentials: 'include' });
			if (!res.ok) throw new Error('Requirement not found');
			requestDetail = await res.json(); 

            // Check for existing quote from this business
            const qRes = await fetch(`${API_BASE_URL}/api/quotes?requestId=${requestId}`, { credentials: 'include' });
            if (qRes.ok) {
                const qData = await qRes.json();
                existingQuote = (qData.quotes || []).find(q => q.business_id === bizId);
            }
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	});

    // Reactive fetching for inventory to handle auth delay
    $effect(() => {
        if (bizId) {
            console.log('[CATALOG] Fetching inventory for biz:', bizId);
            fetch(`${API_BASE_URL}/api/items?business_id=${bizId}`, { credentials: 'include' })
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    inventory = data.items || data; // Handle both wrapper and raw array
                })
                .catch(err => console.error('[CATALOG] Fetch error:', err));
        }
    });

    // Auto-select item if requested (reactive)
    $effect(() => {
        if (requestDetail?.item_id && inventory.length > 0 && !selectedItem) {
            const requested = inventory.find(i => i.id === requestDetail.item_id);
            if (requested) selectedItem = requested;
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
                    item_id: selectedItem?.id || null,
					product_info: {
						item_id: selectedItem?.id || null,
						item_name: selectedItem?.product_name || requestDetail.description?.title || "Requirement Offer",
						brand: selectedItem?.brand || null,
                        image: selectedItem?.image || null,
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

	function selectFromInventory(item) {
		selectedItem = item;
		notes = `Offering our ${item.brand || ''} ${item.product_name}. ${item.description || ''}`;
		showInventoryModal = false;
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

			<!-- Quote Section -->
            {#if existingQuote}
                <div class="rounded-2xl border-2 border-green-500/20 bg-green-50/20 p-6 shadow-sm dark:border-green-950/30 dark:bg-green-950/5 space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="flex items-center gap-2 font-black text-green-600 dark:text-green-400 uppercase tracking-widest text-xs">
                            <Icon icon="mdi:check-circle-outline" width="16" height="16" />
                            Your Quote has been Sent
                        </h3>
                        <span class={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${existingQuote.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                            {existingQuote.status}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Your Price</span>
                            <span class="font-black text-lg text-green-600">₹{existingQuote.price}</span>
                        </div>
                        <div class="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Delivery</span>
                            <span class="font-black text-lg">{existingQuote.product_info?.delivery_time || '—'}</span>
                        </div>
                    </div>

                    {#if existingQuote.product_info?.notes}
                        <div class="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Your Notes</span>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 italic">"{existingQuote.product_info.notes}"</p>
                        </div>
                    {/if}

                    {#if existingQuote.status === 'accepted'}
                        <div class="mt-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center space-y-3">
                            <p class="text-[11px] font-black text-green-600 uppercase tracking-widest">User accepted your quote! 🎉</p>
                            <a href="/provider/jobs" class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                                <Icon icon="mdi:briefcase-check" width="16" /> Go to Active Jobs
                            </a>
                        </div>
                    {/if}
                </div>
            {:else if requestDetail.status !== 'open'}
                <div class="rounded-2xl border border-gray-200 bg-gray-100/50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
                    <Icon icon="mdi:lock-outline" width="32" height="32" class="mx-auto text-gray-400 mb-2" />
                    <p class="text-sm font-bold text-gray-500 uppercase tracking-wide">This requirement is no longer accepting quotes.</p>
                </div>
            {:else}
				<!-- Send Quote Form -->
				<form onsubmit={handleSendQuote} class="rounded-2xl border border-orange-200 bg-orange-50/20 p-6 shadow-sm dark:border-orange-950/30 dark:bg-orange-950/5 space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <h3 class="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest text-xs">
                            <Icon icon="mdi:send-variant-outline" width="16" height="16" />
                            Your Best Quote
                        </h3>
                        <button 
                            type="button" 
                            onclick={() => showInventoryModal = true}
                            class="text-[10px] font-black uppercase tracking-widest text-white bg-orange-500 px-3 py-1.5 rounded-lg active:scale-95 transition-transform shadow-lg shadow-orange-500/20"
                        >
                            Pick from Inventory
                        </button>
                    </div>

                    {#if selectedItem}
                        <div class="mx-1 flex items-center justify-between rounded-xl bg-white border border-orange-200 p-3 dark:bg-gray-900 dark:border-orange-900/40 shadow-inner">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    {#if selectedItem.image && selectedItem.image !== '[]'}
                                        {@const imgObj = JSON.parse(selectedItem.image)}
                                        <img src={`https://pub-e682b9321ee844e393cf660f83a2f3f7.r2.dev/${imgObj[0]}`} alt="" class="h-full w-full object-cover" />
                                    {:else}
                                        <div class="h-full w-full flex items-center justify-center text-xs text-gray-400 font-black">?</div>
                                    {/if}
                                </div>
                                <div>
                                    <p class="text-xs font-black text-gray-900 dark:text-white truncate">{selectedItem.product_name}</p>
                                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-wider">{selectedItem.brand || 'No Brand'}</p>
                                </div>
                            </div>
                            <button type="button" onclick={() => selectedItem = null} class="text-gray-400 hover:text-red-500 p-1">
                                <Icon icon="mdi:close-circle" width="18" />
                            </button>
                        </div>
                    {/if}

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
		{/if}
	</div>

    <!-- Inventory Modal -->
    {#if showInventoryModal}
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => showInventoryModal = false} aria-label="Close"></button>
            <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 overflow-hidden flex flex-col max-h-[85vh]">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">Your Catalog</h3>
                    <button onclick={() => showInventoryModal = false} class="text-gray-400">
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div class="mb-4">
                    <div class="relative">
                        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" />
                        <input 
                            type="text" 
                            bind:value={inventorySearch}
                            placeholder="Search items by name or brand..." 
                            class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                        />
                    </div>
                </div>

                <div class="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin">
                    {#each filteredInventory as item}
                        <button 
                            onclick={() => selectFromInventory(item)}
                            class="w-full flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-800 transition-all text-left group"
                        >
                            <div class="h-16 w-16 rounded-xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm shrink-0">
                                {#if item.image && item.image !== '[]'}
                                    {@const imgObj = JSON.parse(item.image)}
                                    <img src={toDisplayUrl(imgObj[0])} alt="" class="h-full w-full object-cover" />
                                {/if}
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <h4 class="font-black text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors truncate">{item.product_name}</h4>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.brand || 'Generic'}</p>
                                <p class="text-xs text-gray-500 line-clamp-1">{item.description || 'No description'}</p>
                            </div>
                            <Icon icon="mdi:plus-circle" class="text-gray-300 group-hover:text-orange-500" width="24" />
                        </button>
                    {:else}
                        <div class="py-20 text-center space-y-4 px-6 scale-in-center">
                            <div class="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-3xl">🗄️</div>
                            <div>
                                <p class="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Catalog is Empty</p>
                                <p class="text-xs text-gray-500 mt-1">You haven't added any products to your inventory yet.</p>
                            </div>
                            <a href="/provider/profile" class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-4 py-2 rounded-xl active:scale-95 transition-transform">
                                <Icon icon="mdi:plus" /> Add Products Now
                            </a>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>
