<script>
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';

	let items = $state([]);
	let businesses = $state([]);
	let loading = $state(true);
	let showNearbyMap = $state(false);
	let selectedBiz = $state(null);
	
	let userLoc = $state({
		pincode: '',
		lat: null,
		lng: null,
		city: 'Detecting location...',
		radius: 50 // Default 50km
	});

	let selectedCategory = $state('All');
	let productCategories = $state(['All']);

	let userName = $state('User');

	async function fetchUserLocation() {
		try {
			// 1. Get pincode from profile
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.profile) {
					userName = data.profile.firstname + ' ' + (data.profile.lastname || '');
					// Pincode clean-up: convert "609309.0" -> "609309"
					userLoc.pincode = data.profile.pincode ? String(data.profile.pincode).split('.')[0] : '';
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
			// 1. Fetch Items
			let itemUrl = new URL(`${API_BASE_URL}/api/items`);
			if (selectedCategory !== 'All') itemUrl.searchParams.set('category', selectedCategory);
			
			if (userLoc.lat && userLoc.lng) {
				itemUrl.searchParams.set('lat', userLoc.lat);
				itemUrl.searchParams.set('long', userLoc.lng);
				itemUrl.searchParams.set('radius', userLoc.radius);
			} else if (userLoc.pincode) {
				itemUrl.searchParams.set('pincode', userLoc.pincode);
			}

			const iRes = await fetch(itemUrl.toString(), { credentials: 'include' });
			if (iRes.ok) items = await iRes.json();

			// 2. Fetch Businesses for the Map
			let bizUrl = new URL(`${API_BASE_URL}/api/businesses`);
			if (userLoc.lat && userLoc.lng) {
				bizUrl.searchParams.set('lat', userLoc.lat);
				bizUrl.searchParams.set('long', userLoc.lng);
				bizUrl.searchParams.set('radius', userLoc.radius);
			}
			const bRes = await fetch(bizUrl.toString(), { credentials: 'include' });
			if (bRes.ok) businesses = await bRes.json();

		} catch (err) {
			console.error('Failed to fetch data:', err);
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
	let interestModal = $state({
		show: false,
		step: 1, // 1: Confirm, 2: Success/Details
		item: null,
		biz: null,
		loading: false
	});

	function initDirectInterest(item) {
		interestModal.item = item;
		interestModal.show = true;
		interestModal.step = 1;
	}

	async function confirmInterest() {
		interestModal.loading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/requests`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					item_id: interestModal.item.id,
					target_business_ids: [interestModal.item.business_id],
					title: `Direct Order: ${interestModal.item.product_name} (from ${userName})`,
					category: [interestModal.item.category],
					lat: userLoc.lat,
					long: userLoc.lng,
					city: userLoc.city,
					pincode: userLoc.pincode,
					address: 'Order via Direct Interest'
				}),
				credentials: 'include'
			});

			if (res.ok) {
				// Fetch business details to show in step 2
				const bRes = await fetch(`${API_BASE_URL}/api/businesses/${interestModal.item.business_id}`);
				if (bRes.ok) {
					interestModal.biz = await bRes.json();
					interestModal.step = 2;
				} else {
					alert("Interest recorded! Check your messages.");
					interestModal.show = false;
				}
			} else {
				alert("Failed to send interest. Please try again.");
			}
		} catch (err) {
			console.error(err);
		} finally {
			interestModal.loading = false;
		}
	}
    
    function calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
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
				<div class="flex flex-col items-start -translate-y-px">
					<span class="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
						<Icon icon="mdi:map-marker-radius" class="text-orange-500" /> Discover Nearby
					</span>
					<span class="text-[10px] text-gray-400 ml-6">Range: {userLoc.radius} km • Based on {userLoc.lat ? 'GPS' : 'Pincode'}</span>
				</div>
				<span class="text-xs font-bold text-orange-500">{showNearbyMap ? 'Hide Map' : 'Show Map'}</span>
			</button>

			{#if showNearbyMap}
				<div class="mt-4 px-2 space-y-4">
					<div class="flex items-center gap-4">
						<label for="radius-range" class="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">Search Radius ({userLoc.radius}km)</label>
						<input 
							id="radius-range"
							type="range" min="1" max="150" step="5" 
							bind:value={userLoc.radius}
							onchange={fetchNearbyItems}
							class="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 dark:bg-gray-800"
						/>
					</div>
				</div>
			{/if}
			
			{#if showNearbyMap}
				<div class="mt-2 animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<NearBuyMap
						center={[userLoc.lng || 80.2707, userLoc.lat || 13.0827]}
						zoom={13}
						height="280px"
						showGeolocate={true}
						markers={[
							...(userLoc.lat ? [{ id: 'user', type: 'user', lat: userLoc.lat, lng: userLoc.lng, popup: '<b>📍 Your Location</b>' }] : []),
							...businesses.map(biz => ({
								id: biz.id,
								businessId: biz.id,
								lat: biz.lat,
								lng: biz.long,
								label: '🏢',
								type: 'business',
								popup: `<b>${biz.bname}</b><br/><span style="color:#888">${biz.city || ''}</span>`
							}))
						]}
						onMarkerClick={(marker) => {
							if (marker.id && marker.id !== 'user') {
								const biz = businesses.find(b => b.id === marker.id);
								if (biz) selectedBiz = biz;
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
						<div class="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none">
							<a 
								href={`/user/item/${item.id}`} 
								class="block"
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
                                        {#if userLoc.lat && item.biz_lat}
                                            {@const dist = calculateDistance(userLoc.lat, userLoc.lng, item.biz_lat, item.biz_long)}
                                            {#if dist}
                                                <span class="bg-orange-600/90 backdrop-blur-md text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-relaxed">
                                                    {dist} km away
                                                </span>
                                            {/if}
                                        {/if}
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
						</div>
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



	{#if interestModal.show}
		<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm animate-in fade-in duration-300 md:items-center md:p-4">
			<button class="absolute inset-0 cursor-default" onclick={() => interestModal.show = false} aria-label="Dismiss Modal"></button>
			
			<div class="relative w-full max-w-lg rounded-t-[40px] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500 dark:bg-gray-900 md:rounded-[40px]">
				<!-- Step 1: Confirmation -->
				{#if interestModal.step === 1}
					<div class="text-center">
						<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 dark:bg-orange-500/10">
							<Icon icon="mdi:heart-flash" class="text-4xl text-orange-500 animate-pulse" />
						</div>
						<h2 class="text-2xl font-black text-gray-900 dark:text-white">Confirm Interest</h2>
						<p class="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
							We'll share your profile and address with <span class="text-orange-500 font-bold">{interestModal.item?.business_name}</span> so they can contact you regarding <span class="font-bold">"{interestModal.item?.product_name}"</span>.
						</p>

						<div class="mt-8 flex gap-3">
							<button 
								onclick={() => interestModal.show = false}
								class="flex-1 rounded-2xl border border-gray-200 py-4 text-sm font-black text-gray-400 dark:border-gray-800"
							>
								Cancel
							</button>
							<button 
								onclick={confirmInterest}
								disabled={interestModal.loading}
								class="flex-1 rounded-2xl bg-orange-500 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
							>
								{interestModal.loading ? 'Processing...' : 'Yes, I\'m Interested!'}
							</button>
						</div>
					</div>
				
				<!-- Step 2: Success & Business Details -->
				{:else if interestModal.step === 2}
					<div class="text-center animate-in zoom-in-95 duration-300">
						<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 dark:bg-green-500/10">
							<Icon icon="mdi:check-decagram" class="text-4xl text-green-500" />
						</div>
						<h2 class="text-2xl font-black text-gray-900 dark:text-white">It's a Match!</h2>
						<p class="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
							Your interest has been SHARED. You can now contact the business directly.
						</p>

						<div class="mt-8 space-y-4 text-left">
							<div class="rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800/50">
								<h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Merchant Contact</h3>
								<div class="space-y-4">
									<div class="flex items-center gap-4">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-800 text-orange-500">
											<Icon icon="mdi:store" width="20" />
										</div>
										<div>
											<p class="text-[10px] font-black uppercase tracking-wider text-gray-400">Business Name</p>
											<p class="text-sm font-bold text-gray-900 dark:text-white">{interestModal.biz?.bname}</p>
										</div>
									</div>

									<div class="flex items-center gap-4">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-800 text-blue-500">
											<Icon icon="mdi:phone" width="20" />
										</div>
										<div>
											<p class="text-[10px] font-black uppercase tracking-wider text-gray-400">Mobile Number</p>
											<p class="text-sm font-bold text-gray-900 dark:text-white">{JSON.parse(interestModal.biz?.phones || '["N/A"]')[0]}</p>
										</div>
									</div>

									<div class="flex items-center gap-4">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-800 text-red-500">
											<Icon icon="mdi:email" width="20" />
										</div>
										<div>
											<p class="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</p>
											<p class="text-sm font-bold text-gray-900 dark:text-white">{JSON.parse(interestModal.biz?.emails || '["N/A"]')[0]}</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="mt-8 flex flex-col gap-3">
							<button 
								onclick={() => interestModal.show = false}
								class="w-full rounded-2xl bg-gray-900 py-4 text-sm font-black text-white dark:bg-white dark:text-gray-900 shadow-xl shadow-gray-900/10 active:scale-95 transition-all"
							>
								Great, Got it!
							</button>
							<a 
								href={`/user/messages`}
								class="w-full rounded-2xl border border-gray-100 py-4 text-sm font-black text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
							>
								Go to Chat
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ─── BUSINESS DETAIL MODAL ─── -->
	{#if selectedBiz}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
			<button class="absolute inset-0 cursor-default" onclick={() => selectedBiz = null} aria-label="Dismiss Modal"></button>
			<div class="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-gray-900">
				<div class="h-24 bg-linear-to-br from-orange-400 to-orange-600"></div>
				
				<div class="relative -mt-12 flex flex-col items-center px-6 pb-6">
					<div class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900 dark:bg-gray-800">
						{#if selectedBiz.avatar_url}
							<img src={toDisplayUrl(selectedBiz.avatar_url)} alt="Biz Logo" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center text-gray-400">
								<Icon icon="mdi:storefront" width="40" />
							</div>
						{/if}
					</div>

					<h3 class="mt-3 text-xl font-black text-gray-900 dark:text-white text-center">{selectedBiz.bname}</h3>
					<p class="text-[10px] font-bold uppercase tracking-widest text-orange-500">{selectedBiz.btype || 'Local Shop'}</p>
					
					<div class="mt-4 w-full space-y-3">
						<div class="flex items-start gap-2 bg-gray-50 p-3 rounded-2xl dark:bg-gray-800/50">
							<Icon icon="mdi:map-marker" class="mt-0.5 text-gray-400" />
							<p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
								{selectedBiz.address || 'Address not provided.'}<br/>
								<span class="font-bold">{selectedBiz.city}, {selectedBiz.pincode}</span>
							</p>
						</div>

						{#if selectedBiz.about}
							<p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic px-2">"{selectedBiz.about}"</p>
						{/if}
					</div>

					<div class="mt-6 flex w-full gap-3">
						<button 
							onclick={() => selectedBiz = null}
							class="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
						>
							Dismiss
						</button>
						<a 
							href={`/business/${selectedBiz.id}`}
							class="flex-1 rounded-2xl bg-orange-500 py-3 text-center text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
						>
							View Profile
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
