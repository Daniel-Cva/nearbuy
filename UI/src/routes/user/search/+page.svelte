<script>
	let query = $state('');
	let minDistance = $state('');
	let maxDistance = $state(20);
	let priceMin = $state('');
	let priceMax = $state('');
	let rating = $state(0);
	let category = $state('');
	let type = $state('all');

	let categoryPath = $state([]);

	const productCategories = {
		'Electronics': {
			'TV': {
				'MI': ['32 INCH', '43 INCH', '55 INCH'],
				'Samsung': ['43 INCH', '55 INCH', '65 INCH'],
				'LG': ['43 INCH', '55 INCH']
			},
			'Mobiles': {
				'Apple': ['iPhone 13', 'iPhone 14', 'iPhone 15'],
				'Samsung': ['S23', 'S24']
			},
			'Accessories': ['Cases', 'Chargers', 'Headphones']
		},
		'Fashion': {
			'Men': ['Shirts', 'T-Shirts', 'Trousers'],
			'Women': ['Sarees', 'Kurtas', 'Dresses']
		},
		'Groceries': {
			'Staples': ['Rice', 'Dal', 'Flour'],
			'Snacks': ['Chips', 'Biscuits']
		},
		'Furniture': {
			'Living Room': ['Sofas', 'TV Units'],
			'Bedroom': ['Beds', 'Wardrobes']
		}
	};

	const serviceCategories = {
		'Repair': ['Mobile Repair', 'Appliance Repair', 'Plumbing'],
		'Cleaning': ['Home Cleaning', 'Car Wash'],
		'Salon': ['Haircut', 'Facial', 'Massage']
	};

	function getCurrentCategoryOptions() {
		if (type === 'product') {
			let current = productCategories;
			for (const key of categoryPath) {
				if (current[key]) {
					current = current[key];
				} else {
					return [];
				}
			}
			return Array.isArray(current) ? current : Object.keys(current);
		} else if (type === 'service') {
			let current = serviceCategories;
			for (const key of categoryPath) {
				if (current[key]) {
					current = current[key];
				} else {
					return [];
				}
			}
			return Array.isArray(current) ? current : Object.keys(current);
		}
		return [];
	}

	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let rawItems = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/items`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawItems = data.items || [];
			}
		} catch (err) {
			console.error('Failed to fetch search items:', err);
		} finally {
			loading = false;
		}
	});

	function setType(t) {
		type = t;
		categoryPath = [];
	}

	const results = $derived(
		rawItems.map(i => {
			const unroll = (val) => {
				if (typeof val === 'string') {
					const t = val.trim();
					if (t.startsWith('[') || t.startsWith('{')) {
						try {
							let p;
							try { p = JSON.parse(t); } 
							catch(e) { p = JSON.parse(t.replace(/'/g, '"')); }
							return unroll(p);
						} catch(e) { return [t]; }
					}
					return t ? [t] : [];
				}
				if (Array.isArray(val)) return val.flatMap(v => unroll(v));
				return val ? [val] : [];
			};
			const arr = unroll(i.image ?? []);
			const first = arr.filter(Boolean)[0];

			return {
				id: i.id,
				name: i.product_name || 'Unnamed Item',
				shop: i.business_name || 'Store',
				distance: '1.2km', // Mock distance
				rating: i.rating || 0,
				category: i.category,
				type: i.item_type || 'product', // 'product' | 'service'
				icon: (i.item_type || 'product') === 'product' ? '📦' : '🔧',
				image: first ? toDisplayUrl(first) : null
			};
		})
	);

	const filtered = $derived(
		results.filter((r) => {
			if (type !== 'all' && r.type !== type) return false;
			if (rating > 0 && r.rating < rating) return false;
			if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
			
			const dist = parseFloat(r.distance);
			if (minDistance !== '' && minDistance !== null && dist < Number(minDistance)) return false;
			if (maxDistance !== '' && maxDistance !== null && dist > Number(maxDistance)) return false;
			
			return true;
		})
	);
</script>

<svelte:head>
	<title>Search — NearBuy</title>
	<meta name="description" content="Search for products and services from local businesses near you with advanced filters." />
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-6 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
		<h1 class="font-bold">Search & Filter</h1>
	</header>

	<div class="mx-auto max-w-2xl space-y-5 px-4 py-6">
		<!-- Search Bar -->
		<input
			id="search-input"
			type="text"
			bind:value={query}
			placeholder="🔍 Search for products or services nearby..."
			class="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
		/>

		<!-- Filters -->
		<div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
			<h2 class="font-bold">Filters</h2>

			<!-- Type -->
			<div>
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Type</p>
				<div class="flex gap-2">
					{#each ['all', 'product', 'service'] as t}
						<button
							id={`type-filter-${t}`}
							onclick={() => setType(t)}
							class={`flex-1 rounded-xl py-2 text-sm font-medium capitalize transition-all ${type === t ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
						>{t}</button>
					{/each}
				</div>
			</div>

			<!-- Distance -->
			<div>
				<p class="mb-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
					<span>Distance Range (km)</span>
					<span class="text-xs text-orange-500">Optional</span>
				</p>
				<div class="flex items-center gap-3">
					<input type="number" min="0" step="0.1" placeholder="Min" bind:value={minDistance} class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
					<span class="text-gray-400 text-sm">to</span>
					<input type="number" min="0" step="0.1" placeholder="Max" bind:value={maxDistance} class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
				</div>
			</div>

			<!-- Min Rating -->
			<div>
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Minimum Rating</p>
				<div class="flex gap-2">
					{#each [0, 3, 4, 4.5] as r}
						<button
							id={`rating-filter-${r}`}
							onclick={() => (rating = r)}
							class={`flex-1 rounded-xl py-2 text-sm transition-all ${rating === r ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
						>{r === 0 ? 'Any' : `${r}+⭐`}</button>
					{/each}
				</div>
			</div>

			<!-- Category -->
			{#if type !== 'all'}
				<div>
					<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Category</p>
					
					<!-- Breadcrumbs -->
					{#if categoryPath.length > 0}
						<div class="flex flex-wrap items-center gap-1 mb-3">
							<button onclick={() => categoryPath = []} class="text-xs font-bold text-orange-500 hover:underline capitalize">{type}s</button>
							{#each categoryPath as pathItem, i}
								<span class="text-gray-400 text-xs">›</span>
								<button onclick={() => categoryPath = categoryPath.slice(0, i + 1)} class={`text-xs font-bold hover:underline ${i === categoryPath.length - 1 ? 'text-gray-900 dark:text-white' : 'text-orange-500'}`}>{pathItem}</button>
							{/each}
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						{#each getCurrentCategoryOptions() as cat}
							<button
								onclick={() => categoryPath = [...categoryPath, cat]}
								class="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 transition-all hover:border-orange-500 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
							>{cat}</button>
						{/each}
						{#if getCurrentCategoryOptions().length === 0}
							<p class="text-xs text-gray-500 italic">No further subcategories.</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Results -->
		<div>
			<h2 class="mb-3 font-bold">Results ({filtered.length})</h2>
			<div class="space-y-2">
				{#each filtered as item}
					<a
						href={`/user/item/${item.id}`}
						class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-orange-500/50 dark:border-gray-800 dark:bg-gray-900"
					>
						<span class="text-2xl">{item.icon}</span>
						<div class="flex-1">
							<h3 class="text-sm font-semibold">{item.name}</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">{item.shop} · {item.distance} · ⭐ {item.rating}</p>
						</div>
						{#if item.type === 'product'}
							<span class="text-sm font-bold text-orange-500">₹{item.price}</span>
						{:else}
							<span class="text-xs text-blue-500 dark:text-blue-400">On request</span>
						{/if}
					</a>
				{:else}
					<div class="py-12 text-center text-gray-400">No results match your filters.</div>
				{/each}
			</div>
		</div>
	</div>
</div>
