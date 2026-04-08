<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';
	import Icon from '@iconify/svelte';

	let requestId = $derived(page.params.id);
	let requestDetail = $state(null);
	let quotes = $state([]);
	let loading = $state(true);
	let accepting = $state(false);
	let errorMsg = $state('');
	let orders = $state([]);

	// Contact Sheet Modal
	let showContactSheet = $state(false);
	let contactOrder = $state(null);

	async function loadDetails() {
		try {
			loading = true;
			const detailRes = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, { credentials: 'include' });
			if (!detailRes.ok) throw new Error('Requirement not found');
			requestDetail = await detailRes.json();

			const quotesRes = await fetch(`${API_BASE_URL}/api/quotes?requestId=${requestId}`, { credentials: 'include' });
			if (quotesRes.ok) {
				const quotesData = await quotesRes.json();
				quotes = quotesData.quotes || [];
			}

			const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, { credentials: 'include' });
			if (ordersRes.ok) {
				const ordersData = await ordersRes.json();
				orders = (ordersData.orders || []).filter(o => o.request_id === requestId);
			}
		} catch (err) {
			errorMsg = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(loadDetails);

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
					item_data: quote.product_info || null,
					price: quote.price || quote.product_info?.price
				})
			});
			if (!res.ok) throw new Error('Failed to accept quote');
			await loadDetails();
			// Open contact sheet immediately after acceptance
			const acceptedOrder = orders.find(o => o.business_id === businessId);
			if (acceptedOrder) {
				contactOrder = acceptedOrder;
				showContactSheet = true;
			}
		} catch (err) {
			alert(err.message);
		} finally {
			accepting = false;
		}
	}

	async function confirmComplete(orderId) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'completed' }),
				credentials: 'include'
			});
			if (res.ok) {
				await loadDetails();
				// redirect to review after small delay
				setTimeout(() => {
					window.location.href = `/user/review/${orderId}`;
				}, 800);
			}
		} catch (err) {
			console.error(err);
		}
	}

	function openContactSheet(order) {
		contactOrder = order;
		showContactSheet = true;
	}

	async function startChat(recipientId) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ recipient_id: recipientId, type: 'order' })
			});
			if (res.ok) {
				const data = await res.json();
				window.location.href = `/user/messages/${data.id}`;
			}
		} catch (e) {
			console.error('Failed to start chat:', e);
		}
	}
</script>

<svelte:head>
	<title>Requirement & Quotes — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<button onclick={() => history.back()} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Go Back">
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
		{:else if requestDetail}
			<!-- Request Info -->
			<div class="rounded-[32px] border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative overflow-hidden">
				<div class="absolute top-0 right-0 p-6">
                    <span class={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${requestDetail.status === 'open' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : requestDetail.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                        {requestDetail.status}
                    </span>
                </div>
				<p class="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Requirement</p>
				<h2 class="text-2xl font-black mb-2 pr-20">{requestDetail.description?.title}</h2>
				<p class="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{requestDetail.description?.details}</p>
				
				<div class="flex flex-wrap gap-2 text-xs">
					<span class="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2 font-black text-gray-500 uppercase tracking-widest">
						Budget: {requestDetail.description?.budget ? requestDetail.description.budget : 'Any'}
					</span>
					<span class="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2 font-black text-gray-500 uppercase tracking-widest">
						{requestDetail.city || 'Anywhere'}
					</span>
				</div>
			</div>

			<!-- Active Orders Section -->
			{#if orders.length > 0}
				<div class="space-y-4">
					<h3 class="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-xs px-2">
						<Icon icon="mdi:package-variant-closed" width="16" /> Active Orders ({orders.length})
					</h3>
					{#each orders as order}
						<div class="rounded-[32px] border-2 border-orange-500/20 bg-white p-6 shadow-xl shadow-orange-500/5 dark:bg-gray-900 space-y-5 animate-in slide-in-from-bottom-2">
							<div class="flex items-center gap-4">
								<div class="h-14 w-14 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
									{order.biz_info?.name?.[0] || 'B'}
								</div>
								<div class="flex-1">
									<p class="text-[10px] font-black tracking-widest text-orange-500 uppercase mb-0.5">Connected Merchant</p>
									<h4 class="font-black text-gray-900 dark:text-white text-lg">{order.biz_info?.name || 'Local Shop'}</h4>
									<div class="flex items-center gap-3 mt-1">
										{#if order.biz_info?.phones?.[0]}
											<a href={`tel:${order.biz_info.phones[0]}`} class="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-orange-500"><Icon icon="mdi:phone" /> Call</a>
										{/if}
										{#if order.biz_info?.emails?.[0]}
											<a href={`mailto:${order.biz_info.emails[0]}`} class="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-orange-500"><Icon icon="mdi:email" /> Email</a>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<p class="text-xl font-black text-gray-900 dark:text-white">{order.final_price || order.price || '—'}</p>
									<span class={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${order.status === 'b_completed' ? 'bg-blue-100 text-blue-600' : order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
										{order.status === 'b_completed' ? 'Merchant Done' : order.status}
									</span>
								</div>
							</div>

							<!-- View Contact Details Button -->
							<button
								onclick={() => openContactSheet(order)}
								class="w-full flex items-center justify-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 py-3 text-sm font-bold text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-100 active:scale-95"
							>
								<Icon icon="mdi:card-account-phone" width="18" /> View Contact Details
							</button>

							{#if order.status === 'b_completed'}
								<button 
									onclick={() => confirmComplete(order.id)}
									class="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-green-500 to-emerald-600 py-4 font-black text-white shadow-xl shadow-green-500/20 active:scale-95 transition-all text-sm"
								>
									<Icon icon="mdi:check-decagram" width="20" /> Confirm Job Done & Review
								</button>
							{:else if order.status === 'completed'}
								<div class="w-full text-center py-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
									<Icon icon="mdi:star" /> Order Successfully Completed
								</div>
							{:else}
								<div class="flex gap-2">
									<div class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">
										<Icon icon="mdi:clock-outline" /> Waiting for merchant to complete
									</div>
									<a href="/user/messages" class="px-5 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-500 transition-all">
										<Icon icon="mdi:chat" width="20" />
									</a>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Quotes List -->
			{#if requestDetail.status === 'open' || quotes.length > 0}
			<div class="space-y-4">
				<h3 class="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-xs px-2">
					<Icon icon="mdi:chat-outline" width="16" height="16" />
					Quotes ({quotes.filter(q => q.status === 'pending').length})
				</h3>

				{#if quotes.filter(q => q.status === 'pending').length === 0 && orders.length === 0}
					<div class="bg-gray-100 dark:bg-gray-900/50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
						<Icon icon="mdi:hourglass-empty" width="32" height="32" class="mx-auto text-gray-400 mb-2" />
						<p class="text-gray-500 font-bold text-sm uppercase tracking-wide">Waiting for quotes...</p>
					</div>
				{:else}
					{#each quotes.filter(q => q.status === 'pending') as quote}
						<div class="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4 group transition-all hover:border-orange-500/50">
							<div class="flex items-center gap-4 border-b border-gray-50 dark:border-gray-800 pb-3">
								<div class="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
									{#if quote.business_avatar}
										<img src={toDisplayUrl(quote.business_avatar)} alt={quote.business_name} class="h-full w-full object-cover" />
									{:else}
                                        <div class="h-full w-full flex items-center justify-center text-lg font-black bg-orange-500 text-white">
                                            {(quote.business_name || 'B')[0]}
                                        </div>
									{/if}
								</div>
								<div class="flex-1">
									<h4 class="font-extrabold text-gray-900 dark:text-white text-md">{quote.business_name}</h4>
									<div class="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Business Partner</div>
								</div>
								<div class="text-right">
									<p class="text-xl font-black text-orange-600 dark:text-orange-400 tracking-tighter">{quote.price || quote.product_info?.price || '—'}</p>
									<p class="text-[10px] font-black text-gray-400 uppercase">Quoted Price</p>
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
									class="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
								>
                                    {#if accepting}<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" />{:else}<Icon icon="mdi:check-decagram" width="18" height="18" />{/if}
									Accept Quote
								</button>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Contact Details Bottom Sheet -->
{#if showContactSheet && contactOrder}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
		<button class="absolute inset-0 cursor-default" onclick={() => showContactSheet = false} aria-label="Dismiss"></button>
		
		<div class="relative w-full max-w-lg rounded-t-[40px] bg-white dark:bg-gray-900 p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-400">
			<!-- Drag handle -->
			<div class="flex justify-center mb-5">
				<div class="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
			</div>

			<h2 class="text-xl font-black mb-6 text-gray-900 dark:text-white">Contact Details</h2>

			<!-- Business Details -->
			<div class="mb-5 rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 p-5 space-y-4">
				<p class="text-[10px] font-black uppercase tracking-widest text-orange-500">Merchant (Business)</p>
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black">
						{contactOrder.biz_info?.name?.[0] || 'B'}
					</div>
					<div>
						<p class="font-black text-gray-900 dark:text-white">{contactOrder.biz_info?.name}</p>
						{#if contactOrder.biz_info?.city}
							<p class="text-xs text-gray-500 flex items-center gap-1"><Icon icon="mdi:map-marker" width="12" />{contactOrder.biz_info.city}</p>
						{/if}
					</div>
				</div>

				<div class="flex gap-3">
					{#if contactOrder.biz_info?.phones?.[0]}
						<a href={`tel:${contactOrder.biz_info.phones[0]}`}
							class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-black text-white shadow-md active:scale-95 transition-all">
							<Icon icon="mdi:phone" width="18" /> Call
						</a>
					{/if}
					{#if contactOrder.biz_info?.emails?.[0]}
						<a href={`mailto:${contactOrder.biz_info.emails[0]}`}
							class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3 text-sm font-black text-white shadow-md active:scale-95 transition-all">
							<Icon icon="mdi:email" width="18" /> Email
						</a>
					{/if}
					<button 
						onclick={() => startChat(contactOrder.business_id)}
						class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-black text-white shadow-md active:scale-95 transition-all">
						<Icon icon="mdi:chat" width="18" /> Chat
					</button>
				</div>
			</div>

			<!-- User Contact (shown to business side too via messages, here for user reference) -->
			<div class="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-3">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Details (Shared with Merchant)</p>
				<div class="grid grid-cols-1 gap-2 text-sm">
					{#if contactOrder.user_info?.name}
						<div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
							<Icon icon="mdi:account" class="text-gray-400" width="16" />
							<span class="font-bold">{contactOrder.user_info.name}</span>
						</div>
					{/if}
					{#if contactOrder.user_info?.phone}
						<div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
							<Icon icon="mdi:phone" class="text-gray-400" width="16" />
							<span class="font-bold">{contactOrder.user_info.phone}</span>
						</div>
					{/if}
					{#if contactOrder.user_info?.email}
						<div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
							<Icon icon="mdi:email" class="text-gray-400" width="16" />
							<span class="font-bold">{contactOrder.user_info.email}</span>
						</div>
					{/if}
				</div>
			</div>

			<button
				onclick={() => showContactSheet = false}
				class="mt-4 w-full rounded-2xl border border-gray-200 dark:border-gray-700 py-4 text-sm font-black text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
			>
				Close
			</button>
		</div>
	</div>
{/if}
