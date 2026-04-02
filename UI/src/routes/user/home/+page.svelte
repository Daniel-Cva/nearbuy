<script>
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';

	let items = $state([]);
	let loading = $state(true);
	let showNearbyMap = $state(false);
	
	let userLoc = $state({
		pincode: '',
		lat: null,
		lng: null,
		city: 'Detecting location...'
	});

	let selectedCategory = $state('All');
	let productCategories = $state(['All']);

	async function fetchUserLocation() {
		try {
			// 1. Get pincode from profile
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.profile) {
					userLoc.pincode = data.profile.pincode;
					userLoc.city = data.profile.city || 'Unknown Location';
				}
			}

			// 2. Try browser geolocation
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {
						userLoc.lat = pos.coords.latitude;
						userLoc.lng = pos.coords.longitude;
						fetchNearbyItems(); // Refetch with coords
					},
					(err) => console.warn('Geolocation denied:', err.message),
					{ timeout: 10000 }
				);
			}
		} catch (err) {
			console.error('Failed to get user location:', err);
		}
	}

	async function fetchCategories() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/categories`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				// The public API returns an array directly, but we support both formats for robustness
				const cats = data.categories || data.data || data || [];
				if (Array.isArray(cats)) {
					productCategories = ['All', ...cats.filter(c => c.type === 'product').map(c => c.name || c.cat_name)];
				}
			}
		} catch (err) {
			console.error('Failed to load categories:', err);
		}
	}

	async function fetchNearbyItems() {
		loading = true;
		try {
			let url = new URL(`${API_BASE_URL}/api/items`);
			if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
			
			if (userLoc.lat && userLoc.lng) {
				url.searchParams.set('lat', userLoc.lat);
				url.searchParams.set('long', userLoc.lng);
				url.searchParams.set('radius', '15'); // 15km radius
			} else if (userLoc.pincode) {
				url.searchParams.set('pincode', userLoc.pincode);
			}

			const res = await fetch(url.toString(), { credentials: 'include' });
			if (res.ok) {
				items = await res.json();
			}
		} catch (err) {
			console.error('Failed to fetch items:', err);
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await Promise.all([fetchCategories(), fetchUserLocation()]);
		await fetchNearbyItems();
	});

	$effect(() => {
		if (selectedCategory) fetchNearbyItems();
	});

	function getFirstImage(imgStr) {
		try {
			const imgs = JSON.parse(imgStr || '[]');
			return toDisplayUrl(imgs[0]) || 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80';
		} catch {
			return 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80';
		}
	}
</script>

<svelte:head>
	<title>Home — NearBuy</title>
	<meta name="description" content="Discover products and services from nearby local businesses on NearBuy." />
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<div class="mx-auto flex max-w-2xl items-center justify-between">
			<div>
				<h1 class="text-xl font-black text-gray-900 dark:text-white">
					Near<span class="text-orange-500">Buy</span>
				</h1>
				<p class="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
					<Icon icon="mdi:map-marker" class="text-orange-500 shrink-0" /> {userLoc.city || userLoc.pincode || 'Finding location...'}
				</p>
			</div>
			<div class="flex items-center gap-3">
				<a href="/user/search" class="text-xl text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Search">
					<Icon icon="mdi:magnify" />
				</a>
				<a href="/settings" class="text-xl text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Settings">
					<Icon icon="mdi:cog" />
				</a>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-2xl px-4 py-5 space-y-6">
		
		<!-- ─── LOCATION & MAP TOGGLE ─── -->
		<section>
			<button
				onclick={() => showNearbyMap = !showNearbyMap}
				class="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-orange-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500/50"
			>
				<div class="flex flex-col items-start translate-y-[-1px]">
					<span class="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
						<Icon icon="mdi:map-marker-radius" class="text-orange-500" /> Discover Nearby
					</span>
					<span class="text-[10px] text-gray-400 ml-6">Based on {userLoc.lat ? 'GPS' : 'Pincode'}</span>
				</div>
				<span class="text-xs font-bold text-orange-500">{showNearbyMap ? 'Hide Map' : 'Show Map'}</span>
			</button>
			
			{#if showNearbyMap}
				<div class="mt-2 animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<NearBuyMap
						center={[userLoc.lng || 80.2707, userLoc.lat || 13.0827]}
						zoom={13}
						height="280px"
						showGeolocate={true}
						markers={[
							...(userLoc.lat ? [{ id: 'user', type: 'user', lat: userLoc.lat, lng: userLoc.lng, popup: '<b>📍 Your Location</b>' }] : []),
							...items.map(item => ({
								id: item.id,
								businessId: item.business_id,
								lat: item.biz_lat,
								lng: item.biz_long,
								label: item.product_name[0],
								popup: `<b>${item.product_name}</b><br/><span style="color:#888">${item.business_name}</span>`
							}))
						]}
						onMarkerClick={(marker) => {
							if (marker.id && marker.id !== 'user') {
								window.location.href = `/user/item/${marker.id}`;
							}
						}}
					/>
				</div>
			{/if}
		</section>

		<!-- ─── CATEGORY FILTER ─── -->
		<div class="flex overflow-x-auto gap-2 py-1 no-scrollbar -mx-4 px-4">
			{#each productCategories as cat}
				<button 
					onclick={() => selectedCategory = cat}
					class={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-105' : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'}`}
				>
					{cat}
				</button>
			{/each}
		</div>

		<!-- ─── ITEMS LIST ─── -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Nearby Deals</h2>
				<span class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{items.length} FOUND</span>
			</div>

			{#if loading}
				<div class="grid grid-cols-2 gap-4">
					{#each Array(4) as _}
						<div class="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
					{/each}
				</div>
			{:else if items.length === 0}
				<div class="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
					<Icon icon="mdi:package-variant-closed" class="mx-auto text-4xl text-gray-300 mb-3" />
					<p class="text-sm font-bold text-gray-500">No items found nearby.</p>
					<p class="text-xs text-gray-400 mt-1">Try changing the category or location permissions.</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4">
					{#each items as item}
						<a 
							href={`/user/item/${item.id}`} 
							class="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1"
						>
							<div class="aspect-square relative overflow-hidden">
								<img 
									src={getFirstImage(item.image)} 
									alt={item.product_name} 
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
								/>
								<div class="absolute top-2 left-2 flex flex-col gap-1">
									<span class="bg-black/60 backdrop-blur-md text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-relaxed">
										{item.item_type}
									</span>
								</div>
							</div>
							<div class="p-3">
								<h3 class="text-sm font-black text-gray-900 dark:text-white truncate">{item.product_name}</h3>
								<div class="flex items-center gap-1 mt-1">
									<Icon icon="mdi:store" class="text-xs text-orange-500" />
									<span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">{item.business_name}</span>
								</div>
								<div class="mt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-2">
									<span class="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Available</span>
									<span class="text-[9px] font-mono text-gray-400 italic">#{item.biz_pincode}</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- ─── POST REQUIREMENT CTA ─── -->
		<a
			href="/user/post-requirement"
			class="group block rounded-3xl bg-linear-to-r from-orange-600 to-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<h3 class="text-lg font-black leading-tight">Can't find what you need?</h3>
					<p class="text-xs font-bold text-orange-100 uppercase tracking-widest opacity-80">
						Post a requirement & let sellers find you
					</p>
				</div>
				<Icon icon="mdi:chevron-right" class="text-3xl text-white/40 group-hover:text-white transition-all transform group-hover:translate-x-1" />
			</div>
		</a>

	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
