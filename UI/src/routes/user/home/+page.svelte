<script>
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const nearbyBusinesses = [];

	let showNearbyMap = $state(false);

	let productCategories = $state({
		'All': []
	});

	let serviceCategories = $state({
		'All': []
	});

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
				headers: { 'Accept': 'application/json' },
				credentials: 'include'
			});
			if (res.ok) {
				const resData = await res.json();
				const fetchedCategories = resData.categories || resData.data || resData || [];
				
				if (Array.isArray(fetchedCategories) && fetchedCategories.length > 0) {
					const products = { 'All': [] };
					const services = { 'All': [] };

					fetchedCategories.forEach(cat => {
						const subs = ['All'];
						if (cat.sub_categories) {
							cat.sub_categories.forEach(sub => subs.push(sub.cat_name));
						}
						
						if (cat.type === 'product') {
							products[cat.cat_name] = subs;
						} else if (cat.type === 'service') {
							services[cat.cat_name] = services[cat.cat_name] = subs;
						}
					});

					productCategories = products;
					serviceCategories = services;
				}
			} else {
				console.warn('Failed to load categories directly:', res.status);
			}
		} catch (err) {
			console.error('Failed to load categories directly:', err);
		}
	});
</script>

<svelte:head>
	<title>Home — NearBuy</title>
	<meta name="description" content="Discover products and services from nearby local businesses on NearBuy." />
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
	<!-- Header -->
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<div class="mx-auto flex max-w-2xl items-center justify-between">
			<div>
				<h1 class="text-xl font-black text-gray-900 dark:text-white">
					Near<span class="text-orange-500">Buy</span>
				</h1>
				<p class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
					<Icon icon="mdi:map-marker" class="text-orange-500" /> Chennai, Tamil Nadu
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

	<div class="mx-auto max-w-2xl px-4 py-5 space-y-8">

		<!-- ─── DISCOVER NEARBY MAP ─── -->
		<section>
			<button
				onclick={() => showNearbyMap = !showNearbyMap}
				class="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-orange-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500/50"
			>
				<span class="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
					<Icon icon="mdi:map" class="text-orange-500" /> Explore Nearby
				</span>
				<span class="text-xs text-gray-400">{showNearbyMap ? '▲ Hide' : '▼ Show map'}</span>
			</button>
			{#if showNearbyMap}
				<div class="mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<NearBuyMap
						center={[80.2707, 13.0827]}
						zoom={14}
						height="240px"
						showControls={true}
						showGeolocate={true}
						markers={[
							{ id: 'user', type: 'user', lat: 13.0827, lng: 80.2707, popup: '<b>📍 You are here</b>' },
							...nearbyBusinesses
						]}
						onMarkerClick={(marker) => {
							if (marker.businessId) {
								window.location.href = `/user/business/${marker.businessId}`;
							}
						}}
					/>
					<div class="px-4 py-2 text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800">
						<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> You</span>
						<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-orange-500"></span> Shops nearby</span>
					</div>
				</div>
			{/if}
		</section>

		<!-- ─── POST REQUIREMENT CTA ─── -->
		<a
			href="/user/post-requirement"
			class="group block rounded-2xl bg-linear-to-r from-orange-600 to-orange-500 p-4 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-orange-500/30"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-bold">Can't find what you need?</p>
					<p class="mt-0.5 text-sm font-medium text-orange-50">
						Post a requirement & get quotes from local providers
					</p>
				</div>
				<Icon icon="mdi:clipboard-text" class="text-3xl text-white/40 group-hover:text-white transition-colors" />
			</div>
		</a>

	</div>
</div>
