<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { auth } from '$lib/stores/auth.svelte.js';

	const reqId = page.params.reqId;
	let req = $state(null);
	let items = $state([]);
	let loading = $state(true);
	
	let price = $state('');
	let note = $state('');
	let availability = $state('');
	let selectedItemId = $state(null);
	let submitted = $state(false);

	onMount(async () => {
		try {
			const bizId = auth.profile?.biz_id || auth.profile?.business_id;
			const [reqRes, itemsRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/requirements/${reqId}`, { credentials: 'include' }),
				bizId ? fetch(`${API_BASE_URL}/api/businesses/${bizId}/items`, { credentials: 'include' }) : Promise.resolve({ ok: false })
			]);

			if (reqRes.ok) {
				const data = await reqRes.json();
				req = data.requirement || data;
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
		if (item && item.price > 0) {
			price = item.price.toString();
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		
		try {
			const res = await fetch(`${API_BASE_URL}/api/requirements/${reqId}/quotes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					item_id: selectedItemId,
					price: Number(price),
					message: note,
					estimated_time: availability || 'Immediately'
				}),
				credentials: 'include'
			});

			if (res.ok) {
				submitted = true;
			}
		} catch (err) {
			console.error('Failed to submit quote:', err);
		}
	}
</script>

<svelte:head>
	<title>Create Quote — NearBuy</title>
	<meta name="description" content="Send a price quote to a user requirement on NearBuy." />
</svelte:head>

<div>
	<div class="flex items-center gap-4 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2">
		<a href={`/provider/requirements/${reqId}`} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
			>← Requirement</a
		>
		<h1 class="font-bold text-gray-900 dark:text-white">Create Quote</h1>
	</div>

	<div class="mx-auto max-w-xl px-6 py-6 md:py-0 md:px-0">
		<!-- Requirement ref -->
		<div class="mb-6 rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
			<p class="mb-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">Responding to</p>
			<p class="font-bold text-gray-900 dark:text-white mb-2">{req?.title || 'Loading...'}</p>
			<p class="text-xs font-semibold text-gray-500 dark:text-gray-400">
				{req?.user_name || req?.user?.name || 'User'} · {req?.distance || 'Nearby'} · {reqId}
			</p>
		</div>

		{#if !submitted}
			<form onsubmit={handleSubmit} class="space-y-5">
				<div class="space-y-3">
					<p class="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">Select Item/Service from Company</p>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each items as item}
							<button
								type="button"
								onclick={() => selectItem(item.id)}
								class={`flex flex-col items-center gap-2 rounded-2xl border p-2 transition-all ${selectedItemId === item.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-500/10' : 'border-gray-200 bg-white hover:border-orange-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'}`}
							>
								<div class="h-12 w-12 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
									<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
								</div>
								<span class="text-center text-[9px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">{item.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="pt-2">
					<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="quote-price">Your Price (₹)</label>
					<div class="relative">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₹</span>
						<input
							id="quote-price"
							type="number"
							bind:value={price}
							placeholder="e.g., 89999"
							min="0"
							class="w-full rounded-2xl border border-gray-300 bg-white pl-10 pr-4 py-3.5 text-xl font-bold text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
							required
						/>
					</div>
				</div>

				<div>
					<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="quote-availability"
						>Availability</label
					>
					<input
						id="quote-availability"
						type="text"
						bind:value={availability}
						placeholder="e.g., In stock, available immediately"
						class="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
					/>
				</div>

				<div>
					<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="quote-note">Additional Notes</label>
					<textarea
						id="quote-note"
						bind:value={note}
						placeholder="e.g., Sealed box with 1 year warranty. Free screen protector included."
						rows="4"
						class="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm"
					></textarea>
				</div>

				<div
					class="rounded-2xl border border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10 p-4 text-xs font-medium text-orange-700 dark:text-orange-300 flex items-start gap-2"
				>
					<span class="text-base shrink-0 leading-none shadow-sm">💡</span>
					<span>After sending, the user can accept your quote. Contact info will be shared when they accept.</span>
				</div>

				<button
					id="btn-send-quote-confirm"
					type="submit"
					class="w-full rounded-2xl bg-orange-500 py-3.5 font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-95"
					>Send Quote 💰</button
				>
			</form>
		{:else}
			<div class="py-16 text-center flex flex-col items-center">
				<div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-500/20">✅</div>
				<h2 class="mb-2 text-2xl font-black text-gray-900 dark:text-white">Quote Sent!</h2>
				<p class="mb-3 font-medium text-gray-600 dark:text-gray-300 max-w-sm">
					Your quote of <span class="font-black text-orange-500 text-lg">₹{price}</span> 
					{#if selectedItemId}
						for <span class="font-bold text-gray-900 dark:text-white">{items.find(i => i.id === selectedItemId)?.name}</span>
					{/if}
					has been sent to
					<strong class="text-gray-900 dark:text-white">{reqUser?.name || 'the user'}</strong>.
				</p>
				<p class="mb-8 text-sm font-semibold text-gray-500 dark:text-gray-400">You'll be notified if they accept your quote.</p>
				<a
					href="/provider/requirements"
					class="rounded-2xl bg-gray-100 dark:bg-gray-800 px-6 py-3.5 font-bold text-gray-900 dark:text-white shadow-sm transition-all hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-0.5"
					>← Back to Requirements</a
				>
			</div>
		{/if}
	</div>
</div>
