<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let bizId    = $state('');
	let items    = $state([]);   // all items from API
	let loading  = $state(true);
	let errorMsg = $state('');
	let search   = $state('');
	let view     = $state('grid');
	let deleting = $state('');   // itemId being deleted
	let selectedCategory = $state(''); // for filtering

	// In-memory filter — no extra API calls
	const categories = $derived([...new Set(items.map(i => i.category).filter(Boolean))].sort());
	
	const filtered = $derived(
		items.filter(i => {
			const matchesSearch = !search.trim() || i.product_name?.toLowerCase().includes(search.toLowerCase());
			const matchesCat = !selectedCategory || i.category === selectedCategory;
			return matchesSearch && matchesCat;
		})
	);

	// ── Load bizId from /api/me, then load items ──────────────────────────────
	onMount(async () => {
		try {
			const me = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!me.ok) throw new Error('Not authenticated');
			const meData = await me.json();
			bizId = meData.profile?.biz_id ?? meData.business?.id ?? meData.biz_id ?? '';
			if (!bizId) throw new Error('No business ID found. Register a business first.');
			await loadItems();
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load inventory.';
			loading = false;
		}
	});

	async function loadItems() {
		loading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/items?business_id=${bizId}`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
			const data = await res.json();
			items = Array.isArray(data.items ?? data.data ?? data) ? (data.items ?? data.data ?? data) : [];
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load items.';
		} finally {
			loading = false;
		}
	}

	async function deleteItem(itemId) {
		if (!confirm('Delete this item? This cannot be undone.')) return;
		deleting = itemId;
		try {
			const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
				method: 'DELETE',
				credentials: 'include'
			});
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			items = items.filter(i => i.id !== itemId);
		} catch (err) {
			alert(err?.message ?? 'Failed to delete item.');
		} finally {
			deleting = '';
		}
	}

	// Helpers
	function firstImage(item) {
		let raw = item.image ?? item.images ?? [];
		const unroll = (val) => {
			if (typeof val === 'string') {
				const t = val.trim();
				if (t.startsWith('[') || t.startsWith('{')) {
					try {
						let p;
						try { p = JSON.parse(t); } catch(e) { p = JSON.parse(t.replace(/'/g, '"')); }
						return unroll(p);
					} catch(e) { return [t]; }
				}
				return t ? [t] : [];
			}
			if (Array.isArray(val)) return val.flatMap(v => unroll(v));
			return val ? [val] : [];
		};
		const arr = unroll(raw);
		const first = arr.filter(Boolean)[0];
		return first ? toDisplayUrl(first) : '';
	}
</script>

<svelte:head>
	<title>Inventory — NearBuy</title>
	<meta name="description" content="Manage your product and service listings on NearBuy." />
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-30 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2 gap-4">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
				<Icon icon="mdi:arrow-left" width="16" height="16" /> Home
			</a>
			<div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
			<h1 class="text-xl font-black text-gray-900 dark:text-white">Inventory</h1>
		</div>
		<div class="flex items-center gap-3">
			{#if bizId}
				<a href="/provider/inventory/add"
					id="btn-add-item"
					class="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-orange-600 shadow-md shadow-orange-500/20 active:scale-95">
					<Icon icon="mdi:plus" width="16" height="16" /> Add Item
				</a>
			{/if}
		</div>
	</div>

	<div class="mx-auto max-w-4xl px-6 py-6 md:px-0 md:py-0">

		{#if errorMsg}
			<div class="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500">
				<Icon icon="mdi:alert-circle-outline" width="16" height="16" class="shrink-0" />{errorMsg}
			</div>
		{/if}

		<!-- Controls -->
		<div class="mb-6 flex gap-3">
			<div class="relative flex-1 max-w-sm">
				<Icon icon="mdi:magnify" width="16" height="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
				<input type="text" bind:value={search} placeholder="Search products..."
					class="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
			</div>
			
			<div class="relative flex-1 min-w-[150px] max-w-[200px]">
				<select bind:value={selectedCategory}
					class="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white">
					<option value="">All Categories</option>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
				<Icon icon="mdi:chevron-down" width="16" height="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
			</div>
			
			<div class="flex ml-auto overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
				<button id="view-grid" onclick={() => (view = 'grid')}
					class={`px-3 py-2 transition-all ${view === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
					<Icon icon="mdi:view-grid-outline" width="16" height="16" />
				</button>
				<button id="view-list" onclick={() => (view = 'list')}
					class={`px-3 py-2 transition-all ${view === 'list' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>
					<Icon icon="mdi:view-list-outline" width="16" height="16" />
				</button>
			</div>
		</div>

		<!-- Loading skeleton -->
		{#if loading}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
				{#each Array(6) as _}
					<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 animate-pulse overflow-hidden">
						<div class="aspect-square bg-gray-200 dark:bg-gray-700"></div>
						<div class="p-4 space-y-2">
							<div class="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
							<div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
						</div>
					</div>
				{/each}
			</div>

		{:else if filtered.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<Icon icon="mdi:package-variant-closed" width="56" height="56" class="text-gray-300 dark:text-gray-700 mb-4" />
				<p class="font-bold text-gray-500 dark:text-gray-400">
					{search ? 'No items match your search' : 'No items yet'}
				</p>
				{#if !search && bizId}
					<a href="/provider/inventory/add" class="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20">
						<Icon icon="mdi:plus" width="14" height="14" /> Add First Item
					</a>
				{/if}
			</div>

		{:else if view === 'grid'}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
				{#each filtered as item}
					<div class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
						<!-- Image -->
						<div class="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
							<a href={`/provider/inventory/${item.id}`} class="block h-full w-full">
								{#if firstImage(item)}
									<img src={firstImage(item)} alt={item.product_name} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
								{:else}
									<div class="flex h-full items-center justify-center">
										<Icon icon="mdi:package-variant" width="48" height="48" class="text-gray-300 dark:text-gray-600" />
									</div>
								{/if}
							</a>

							<!-- Actions overlay -->
							<div class="absolute inset-0 z-10 hidden items-center justify-center gap-3 bg-black/40 backdrop-blur-[2px] transition-all group-hover:flex">
								<a href={`/provider/inventory/${item.id}/edit`}
									class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-gray-900 shadow-xl transition-transform hover:scale-110 hover:bg-orange-500 hover:text-white">
									<Icon icon="mdi:pencil-outline" width="18" height="18" />
								</a>
								<button onclick={() => deleteItem(item.id)} disabled={deleting === item.id}
									class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500 shadow-xl transition-transform hover:scale-110 hover:bg-red-500 hover:text-white disabled:opacity-60">
									{#if deleting === item.id}
										<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" />
									{:else}
										<Icon icon="mdi:trash-can-outline" width="18" height="18" />
									{/if}
								</button>
							</div>

							<!-- Type badge -->
							{#if item.item_type}
								<div class="absolute left-2 top-2 z-20 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-md uppercase tracking-wide">
									{item.item_type}
								</div>
							{/if}
						</div>

						<a href={`/provider/inventory/${item.id}`} class="flex flex-1 flex-col p-4">
							<h3 class="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">{item.product_name}</h3>
							{#if item.brand}
								<p class="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.brand}</p>
							{/if}
							<div class="mt-auto flex items-end justify-between pt-3">
								<div class="flex items-center gap-1.5 flex-wrap">
									{#if item.item_type}
										<p class="text-[10px] font-black tracking-widest text-gray-500 uppercase px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">{item.item_type}</p>
									{/if}
									{#if item.category}
										<p class="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-md">{item.category}</p>
									{/if}
								</div>
								<span class="text-[10px] font-bold text-gray-400 shrink-0">#{item.id.slice(-6)}</span>
							</div>
						</a>
					</div>
				{/each}
			</div>

		{:else}
			<!-- List view -->
			<div class="space-y-3">
				{#each filtered as item}
					<div class="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-orange-500/50 dark:border-gray-800 dark:bg-gray-900">
						<a href={`/provider/inventory/${item.id}`} class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
							{#if firstImage(item)}
								<img src={firstImage(item)} alt={item.product_name} class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full items-center justify-center">
									<Icon icon="mdi:package-variant" width="28" height="28" class="text-gray-300" />
								</div>
							{/if}
						</a>
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-gray-900 dark:text-white truncate">{item.product_name}</h3>
							<div class="flex items-center gap-2 mt-1">
								{#if item.brand}
									<span class="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.brand}</span>
								{/if}
								{#if item.item_type}
									<span class="text-[10px] font-black tracking-widest text-gray-500 uppercase px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">{item.item_type}</span>
								{/if}
								{#if item.category}
									<span class="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-md">{item.category}</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3 shrink-0">

							<a href={`/provider/inventory/${item.id}/edit`} class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 hover:bg-orange-500 hover:text-white transition-colors dark:bg-gray-800 text-gray-600 dark:text-gray-400">
								<Icon icon="mdi:pencil-outline" width="14" height="14" />
							</a>
							<button onclick={() => deleteItem(item.id)} disabled={deleting === item.id}
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white transition-colors dark:bg-gray-800 text-red-500 disabled:opacity-60">
								{#if deleting === item.id}
									<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
								{:else}
									<Icon icon="mdi:trash-can-outline" width="14" height="14" />
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	</div>
</div>
