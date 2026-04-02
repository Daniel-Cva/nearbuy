<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import Icon from '@iconify/svelte';

	const reqId = page.params.reqId;
	let req = $state(null);
	let items = $state([]);
	let loading = $state(true);
	
	let price = $state('');
	let note = $state('');
	let availability = $state('');
	let selectedItemId = $state(null);
	let submitted = $state(false);
	let errorMsg = $state('');

	const profile = $derived(getCurrentProfile());
	const bizId = $derived(profile?.biz_id || profile?.business_id);

	onMount(async () => {
		try {
			// Wait for bizId if profile is still loading
			let attempts = 0;
			while (!bizId && attempts < 10) {
				await new Promise(r => setTimeout(r, 200));
				attempts++;
			}

			const [reqRes, itemsRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/requests/${reqId}`, { credentials: 'include' }),
				bizId ? fetch(`${API_BASE_URL}/api/businesses/${bizId}/items`, { credentials: 'include' }) : Promise.resolve({ ok: false })
			]);

			if (reqRes.ok) {
				req = await reqRes.ok ? await reqRes.json() : null;
			}

			if (itemsRes.ok) {
				const data = await itemsRes.json();
				items = data.items || [];
			}
		} catch (err) {
			console.error('Failed to prepare quote page:', err);
		} finally {
			loading = false;
		}
	});

	function selectItem(id) {
		selectedItemId = id;
		const item = items.find(i => i.id === id);
		if (item && (item.selling_price || item.mrp)) {
			price = (item.selling_price || item.mrp).toString();
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		errorMsg = '';
		
		try {
			// Payload must match Backend api/src/routes/api/requests/[request_id]/quotes/+server.js
			const payload = {
				product_info: {
					item_id: selectedItemId,
					item_name: items.find(i => i.id === selectedItemId)?.product_name || 'Service',
					price: Number(price),
					note: note,
					availability: availability || 'Immediately',
					image: items.find(i => i.id === selectedItemId)?.image || null
				}
			};

			const res = await fetch(`${API_BASE_URL}/api/requests/${reqId}/quotes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				credentials: 'include'
			});

			if (res.ok) {
				submitted = true;
			} else {
				const data = await res.json();
				errorMsg = data.message || 'Failed to submit quote';
			}
		} catch (err) {
			errorMsg = 'Failed to submit quote due to network error';
		}
	}
</script>

<svelte:head>
	<title>Create Quote — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 transition-colors">
		<a href={`/provider/requirements`} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="20" height="20" />
		</a>
		<h1 class="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-sm">Create Quote</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-8">
		{#if loading}
			<div class="h-40 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"></div>
		{:else if !submitted}
			<!-- Requirement Header -->
			<div class="mb-8 rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm relative overflow-hidden">
				<div class="absolute right-0 top-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-orange-500 opacity-5 blur-3xl"></div>
				
				<p class="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-500">Responding to</p>
				<h2 class="text-xl font-black text-gray-900 dark:text-white leading-tight mb-3">
					{req?.description?.title || 'User Requirement'}
				</h2>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-2 italic mb-4">
					"{req?.description?.details || 'No details provided'}"
				</p>
				<div class="flex items-center gap-3 border-t border-gray-50 dark:border-gray-800 pt-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
					<span class="flex items-center gap-1"><Icon icon="mdi:map-marker-outline" width="14" /> {req?.district || req?.city}</span>
					<span>• {reqId.slice(-6)}</span>
				</div>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- My Inventory -->
				<div class="space-y-3">
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-400">Match with My Product</label>
					<div class="flex flex-wrap gap-2">
						{#each items as item}
							<button
								type="button"
								onclick={() => selectItem(item.id)}
								class={`flex items-center gap-3 rounded-2xl border p-2 pr-4 transition-all ${selectedItemId === item.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-500/10' : 'border-gray-200 bg-white hover:border-orange-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'}`}
							>
								<div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
									<img src={JSON.parse(item.image || '[]')[0] || '/placeholder.png'} alt={item.product_name} class="h-full w-full object-cover" />
								</div>
								<div class="text-left">
									<span class="block text-[10px] font-black text-gray-900 dark:text-white leading-none mb-1">{item.product_name}</span>
									<span class="block text-[10px] font-bold text-orange-500">₹{item.selling_price || 'Price Not Set'}</span>
								</div>
							</button>
						{/each}
						{#if items.length === 0}
							<p class="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-dashed border-gray-300 w-full text-center">Your inventory is empty. Complete it to link items to quotes!</p>
						{/if}
					</div>
				</div>

				<!-- Pricing & Info -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400" for="quote-price">Your Price (₹)</label>
						<div class="relative">
							<span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-900/40">₹</span>
							<input
								id="quote-price"
								type="number"
								bind:value={price}
								placeholder="8999"
								class="w-full rounded-2xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-lg font-black text-gray-900 transition-all focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
								required
							/>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400" for="quote-availability">Timeline</label>
						<input
							id="quote-availability"
							type="text"
							bind:value={availability}
							placeholder="e.g., In stock"
							class="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition-all focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
						/>
					</div>
				</div>

				<div>
					<label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400" for="quote-note">Message to Buyer</label>
					<textarea
						id="quote-note"
						bind:value={note}
						placeholder="Explain why they should choose you..."
						rows="4"
						class="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
					></textarea>
				</div>

				{#if errorMsg}
					<p class="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-900">⚠️ {errorMsg}</p>
				{/if}

				<button
					id="btn-send-quote"
					type="submit"
					class="w-full rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 py-4 text-lg font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1 active:scale-95"
				>
					Send Price Quote
				</button>
			</form>
		{:else}
			<div class="py-20 text-center flex flex-col items-center">
				<div class="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-500/20 shadow-inner">✅</div>
				<h2 class="mb-2 text-3xl font-black text-gray-900 dark:text-white">Quote Delivered!</h2>
				<p class="mb-10 font-bold text-gray-500 dark:text-gray-400 max-w-sm">Your offer for <span class="text-orange-500">₹{price}</span> is now visible to the buyer. You'll be notified if they accept!</p>
				<a
					href="/provider/requirements"
					class="rounded-xl border border-gray-200 dark:border-gray-800 px-10 py-3.5 font-black text-gray-900 dark:text-white transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					Return to Leads
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
