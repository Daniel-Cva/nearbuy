<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';

	const reqId = page.url.searchParams.get('id');
	let req = $state(null);
	let allProviders = $state([]);
	let loading = $state(true);

	// User location — starts with requirement location if available, else fallback
	let userLocation = $state({ 
		lat: 13.0827, 
		lng: 80.2707 
	});

	$effect(() => {
		if (req && !locationReady) {
			const lat = parseFloat(req.lat);
			const lng = parseFloat(req.long || req.lng);
			if (!isNaN(lat) && !isNaN(lng)) {
				userLocation = { lat, lng };
			}
		}
	});
	let locationReady = $state(false);

	// Geoplane approximation (faster flat-earth distance in km)
	function getDistance(lat1, lng1, lat2, lng2) {
		if (!lat1 || !lng1 || !lat2 || !lng2) return null;
		const R = 6371; // Radius of the earth in km
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLng = (lng2 - lng1) * Math.PI / 180;
		const x = dLng * Math.cos((lat1 + lat2) * Math.PI / 360);
		const y = dLat;
		const dist = R * Math.sqrt(x * x + y * y);
		return isNaN(dist) ? null : dist;
	}

	onMount(async () => {
		try {
			const [reqRes, bizRes] = await Promise.all([
				reqId ? fetch(`${API_BASE_URL}/api/requests/${reqId}`, { credentials: 'include' }) : Promise.resolve(null),
				fetch(`${API_BASE_URL}/api/businesses?status=active`, { credentials: 'include' })
			]);

			if (reqRes && reqRes.ok) {
				const data = await reqRes.json();
				req = data.request || data;
				const lat = parseFloat(req.lat);
				const lng = parseFloat(req.long || req.lng);
				if (!isNaN(lat) && !isNaN(lng)) {
					userLocation = { lat, lng };
				}
			}

			if (bizRes && bizRes.ok) {
				const data = await bizRes.json();
				const businesses = Array.isArray(data) ? data : (data.businesses || []);
				allProviders = businesses.map(b => ({
					id: b.id,
					name: b.founder?.name || b.founder_name || 'Owner',
					biz: b.bname || b.name,
					rating: parseFloat(b.rating) || 0,
					category: b.btype || b.type || b.category,
					jobs: 0,
					lat: parseFloat(b.lat) || 0,
					lng: parseFloat(b.long || b.lng) || 0
				}));
			}

			if (navigator.geolocation && !reqId) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {
						userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
						locationReady = true;
					},
					() => { locationReady = true; },
					{ enableHighAccuracy: true, timeout: 10000 }
				);
			} else {
				locationReady = true;
			}
		} catch (err) {
			console.error('Radar search error:', err);
		} finally {
			loading = false;
		}
	});

	// Filter states
	let distance = $state(5);
	let rating = $state(0);
	let categoryPath = $state([]);
	let showMap = $state(true);
	let highlightedProvider = $state(null);
	let globalSearch = $state(false);

	const allCategories = {
		'Product': {
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
		},
		'Service': {
			'Repair': ['Mobile Repair', 'Appliance Repair', 'Plumbing'],
			'Cleaning': ['Home Cleaning', 'Car Wash'],
			'Salon': ['Haircut', 'Facial', 'Massage']
		}
	};

	function getCurrentCategoryOptions() {
		let current = allCategories;
		for (const key of categoryPath) {
			if (current[key]) {
				current = current[key];
			} else {
				return [];
			}
		}
		return Array.isArray(current) ? current : Object.keys(current);
	}

	// Selected providers
	let selectedProviders = $state(new Set());
	let initialSelectionDone = $state(false);

	$effect(() => {
		if (allProviders.length > 0 && !initialSelectionDone) {
			selectedProviders = new Set(allProviders.map(p => p.id));
			initialSelectionDone = true;
		}
	});

	let isNotifying = $state(false);

	const filteredProviders = $derived(
		allProviders.map(p => ({
			...p,
			distance: getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
		})).filter(p => {
			if (p.distance === null) return false;
			if (!globalSearch && p.distance > distance) return false;
			if (rating > 0 && p.rating < rating) return false;
			if (categoryPath.length > 0) {
				if (!categoryPath.includes(p.category)) return false;
			}
			return true;
		})
	);

	function toggleSelect(id) {
		const newSet = new Set(selectedProviders);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedProviders = newSet;
	}

	function toggleSelectAll() {
		if (selectedProviders.size === filteredProviders.length) {
			selectedProviders = new Set();
		} else {
			selectedProviders = new Set(filteredProviders.map(p => p.id));
		}
	}

	async function sendRequirement() {
		if (selectedProviders.size === 0) return;
		
		isNotifying = true;
		
		try {
			// Update the request with the selected target business IDs
			if (reqId) {
				await fetch(`${API_BASE_URL}/api/requests/${reqId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ target_business_ids: Array.from(selectedProviders) })
				});
			}
		} catch(e) {
			console.error('Failed to update target businesses:', e);
		}
		
		setTimeout(() => {
			window.location.href = '/user/quotes';
		}, 2500);
	}


	// Map markers derived from filtered providers
	const mapMarkers = $derived([
		{ id: 'user', type: 'user', lat: userLocation.lat, lng: userLocation.lng, popup: '<div style="text-align:center"><b>📍 You are here</b></div>' },
		...filteredProviders.map(p => ({
			id: p.id,
			type: 'provider',
			lat: p.lat,
			lng: p.lng,
			label: p.name[0],
			popup: `<div><b style="font-size:13px">${p.biz}</b><br/><span style="color:#888;font-size:11px">${p.name} • ${p.distance}km</span><br/><span style="color:#f97316;font-weight:700;font-size:12px">⭐ ${p.rating}</span></div>`
		}))
	]);
</script>

<svelte:head>
	<title>Find Providers — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="flex-1 font-bold">Filter Providers</h1>
	</header>

	{#if !isNotifying}
		<div class="mx-auto max-w-xl px-4 py-6 space-y-6">

			<!-- Map Section -->
			<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
				<button
					onclick={() => showMap = !showMap}
					class="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
				>
					<span class="flex items-center gap-2">🗺️ Provider Map</span>
					<span class="text-xs text-gray-400 transition-transform {showMap ? 'rotate-180' : ''}">{showMap ? '▲' : '▼'}</span>
				</button>
				{#if showMap}
					<div class="border-t border-gray-100 dark:border-gray-800">
						{#await import('$lib/components/NearBuyMap.svelte') then { default: NearBuyMap }}
							<NearBuyMap
								center={[userLocation.lng, userLocation.lat]}
							zoom={globalSearch ? 5 : (distance > 100 ? 7 : distance > 25 ? 9 : 13)}
							height="280px"
							markers={mapMarkers}
							radiusKm={globalSearch ? 0 : distance}
								radiusCenter={[userLocation.lng, userLocation.lat]}
								showGeolocate={true}
								showControls={true}							requestLocation={true}
							onLocationFound={(loc) => { userLocation = loc; }}							/>
						{/await}
					</div>
					<div class="px-4 py-2 flex items-center gap-4 text-[10px] font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
						<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span> Your location</span>
						<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Providers</span>
					{#if !globalSearch}
						<span class="flex items-center gap-1.5"><span class="w-4 h-0 border-t-2 border-dashed border-orange-400/60"></span> {distance}km range</span>
					{:else}
						<span class="flex items-center gap-1.5">🌐 Global</span>
					{/if}
					</div>
				{/if}
			</div>
			
			<!-- Filters Section -->
			<div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h2 class="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Search Parameters</h2>
				
				<!-- Distance Range -->
				<div>
					<div class="flex justify-between items-center mb-2">
						<p class="text-sm font-medium text-gray-700 dark:text-gray-300">Location Range</p>
						{#if globalSearch}
							<span class="text-sm font-bold text-blue-500">🌐 Global</span>
						{:else}
							<span class="text-sm font-bold text-orange-500">{distance} km</span>
						{/if}
					</div>
					<input type="range" min="1" max="500" bind:value={distance} disabled={globalSearch} class="w-full accent-orange-500 disabled:opacity-40" />
					<div class="flex justify-between text-[10px] text-gray-400 mt-1">
						<span>1 km</span>
						<span>You (0 km)</span>
						<span>500 km</span>
					</div>
				</div>

				<!-- Global Search Toggle -->
				<button
					onclick={() => globalSearch = !globalSearch}
					class={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all border-2 ${
						globalSearch
							? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500'
							: 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
					}`}
				>
					<span class="flex items-center gap-2">🌐 Global Search <span class="text-[10px] font-normal opacity-70">(no range limit)</span></span>
					<span class="text-xs font-bold">{globalSearch ? 'ON' : 'OFF'}</span>
				</button>

				<!-- Minimum Rating -->
				<div>
					<p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Rating</p>
					<div class="flex gap-2">
						{#each [0, 4, 4.5, 4.8] as r}
							<button
								onclick={() => (rating = r)}
								class={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${rating === r ? 'bg-orange-500 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:border-orange-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-orange-500'}`}
							>{r === 0 ? 'Any' : `${r}⭐+`}</button>
						{/each}
					</div>
				</div>

				<!-- Dynamic Categories -->
				<div>
					<p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Category Filter</p>
					
					<!-- Breadcrumbs -->
					{#if categoryPath.length > 0}
						<div class="flex flex-wrap items-center gap-1.5 mb-3 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
							<button type="button" onclick={() => categoryPath = []} class="text-xs font-bold text-orange-600 hover:underline">Start</button>
							{#each categoryPath as pathItem, i}
								<span class="text-gray-400 text-xs shadow-sm">›</span>
								<button type="button" onclick={() => categoryPath = categoryPath.slice(0, i + 1)} class={`text-xs font-bold hover:underline ${i === categoryPath.length - 1 ? 'text-gray-900 dark:text-white' : 'text-orange-500'}`}>
									{pathItem}
								</button>
							{/each}
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						{#each getCurrentCategoryOptions() as cat}
							<button
								type="button"
								onclick={() => categoryPath = [...categoryPath, cat]}
								class="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400 dark:hover:bg-orange-500/10"
							>{cat}</button>
						{/each}
						{#if getCurrentCategoryOptions().length === 0}
							<p class="text-sm text-green-600 dark:text-green-500 font-bold bg-green-50 dark:bg-green-500/10 p-2.5 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">✅ Deepest category selected</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Providers List -->
			<div>
				<div class="flex justify-between items-center mb-4">
					<h2 class="font-bold text-lg">Matching Providers ({filteredProviders.length})</h2>
					{#if filteredProviders.length > 0}
						<button 
							onclick={toggleSelectAll} 
							class="text-sm font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400"
						>
							{selectedProviders.size === filteredProviders.length ? 'Deselect All' : 'Select All'}
						</button>
					{/if}
				</div>

				<div class="space-y-3">
					{#each filteredProviders as p}
						<div
							onclick={() => toggleSelect(p.id)}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSelect(p.id); }}
							role="button"
							tabindex="0"
							class={`relative w-full text-left rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedProviders.has(p.id) ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'}`}
						>
							<div class="flex items-center gap-4 pr-10">
								<div class="relative shrink-0 transition-transform">
									<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-lg font-bold text-gray-700 dark:text-gray-300">
										{p.name[0]}
									</div>
									{#if selectedProviders.has(p.id)}
										<div class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs shadow-md border-2 border-white dark:border-gray-900">✓</div>
									{:else}
										<div class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-transparent text-xs shadow-sm"></div>
									{/if}
								</div>
								
								<div class="flex-1">
									<h3 class="font-bold">{p.biz}</h3>
									<p class="text-sm text-gray-500 dark:text-gray-400">{p.name} • {p.category}</p>
								</div>
								
								<div class="text-right">
									<p class="text-sm font-bold text-yellow-500 tracking-wide flex justify-end gap-1"><span class="text-yellow-500 drop-shadow-sm">⭐</span> {p.rating}</p>
									<p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">📍 {p.distance ? `${Math.round(p.distance * 10) / 10} km` : '—'}</p>
								</div>
							</div>

							<!-- Stop propagation prevents clicking the link from toggling the card -->
							<a 
								href={`/user/business/${p.id}`} 
								onclick={(e) => e.stopPropagation()} 
								class="absolute top-1/2 right-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-orange-600 transition-colors shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-orange-400"
								title="View Profile"
								aria-label="View Business Profile"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
							</a>
						</div>
					{:else}
						<div class="text-center py-10 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
							<span class="text-4xl mb-3 block opacity-50">🧭</span>
							<p class="text-gray-500 dark:text-gray-400 font-medium">No providers found matching these filters.</p>
							<p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Try expanding your distance or lowering rating limits.</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Sticky bottom CTA -->
		<div class="fixed right-0 bottom-0 left-0 z-20 mx-auto max-w-xl border-t border-gray-200 bg-white/95 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
			<button
				onclick={sendRequirement}
				disabled={selectedProviders.size === 0}
				class={`w-full rounded-2xl py-4 text-lg font-bold text-white transition-all shadow-sm ${selectedProviders.size > 0 ? 'bg-orange-500 hover:bg-orange-400 hover:-translate-y-1 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)]' : 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'}`}
			>
				{selectedProviders.size > 0 ? `Send Requirement to ${selectedProviders.size} Providers` : 'Select providers to send'}
			</button>
		</div>

	{:else}
		<!-- Radar Animation Loading Screen when submitting -->
		<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 overflow-hidden">
			<div class="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
				<div class="absolute w-[300px] h-[300px] rounded-full border border-orange-500 animate-[ping_3s_linear_infinite]"></div>
				<div class="absolute w-[600px] h-[600px] rounded-full border border-orange-500 animate-[ping_4s_linear_infinite] delay-1000"></div>
			</div>

			<div class="relative z-10 text-center space-y-6">
				<div class="relative w-32 h-32 mx-auto rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center border-4 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.5)] overflow-hidden">
					<span class="text-5xl animate-pulse relative z-10">📄</span>
					<div class="absolute left-1/2 top-1/2 w-32 h-32 origin-top-left bg-gradient-to-br from-orange-500/60 to-transparent animate-[spin_2s_linear_infinite]" style="clip-path: polygon(0 0, 100% 100%, 0 100%);"></div>
				</div>
				
				<div>
					<h2 class="text-2xl font-black mb-2 text-orange-600 dark:text-orange-500">Notifying Providers</h2>
					<p class="text-gray-600 dark:text-gray-300 font-medium">Sending your requirement immediately...</p>
				</div>
			</div>
		</div>
	{/if}
</div>
