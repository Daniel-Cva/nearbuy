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
		city: 'Detecting...',
	});

	let selectedCategory = $state('All');
	let productCategories = $state(['All']);
	let userName = $state('User');

    function calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    }

	async function fetchUserLocation() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.profile) {
					userName = data.profile.firstname;
					userLoc.pincode = String(data.profile.pincode || '').split('.')[0];
					userLoc.city = data.profile.city || 'Koranad';
				}
			}
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition((pos) => {
					userLoc.lat = pos.coords.latitude;
					userLoc.lng = pos.coords.longitude;
				}, null, { timeout: 10000 });
			}
		} catch (e) {}
	}

	async function fetchCategories() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/categories`);
			if (res.ok) {
				const cats = await res.json();
				productCategories = ['All', ...cats.filter(c => c.type === 'product').map(c => c.name)];
			}
		} catch (e) {}
	}

	let fetchedIds = new Set();
	async function fetchNearbyItems() {
		loading = true;
		try {
			let url = new URL(`${API_BASE_URL}/api/items`);
			if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory);
			if (userLoc.lat) {
                url.searchParams.set('lat', userLoc.lat);
                url.searchParams.set('long', userLoc.lng);
            }

			const res = await fetch(url.toString());
			if (res.ok) {
                const data = await res.json();
				fetchedIds.clear();
                items = data.map(item => {
					fetchedIds.add(item.id);
					return {
						...item,
						distance: calculateDistance(userLoc.lat, userLoc.lng, item.biz_lat, item.biz_long)
					};
				});
            }

            // Fetch ALL businesses without geofence limits so they all plot on the map
            const bRes = await fetch(`${API_BASE_URL}/api/businesses`);
            if (bRes.ok) businesses = await bRes.json();
		} catch (e) {
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await Promise.all([fetchCategories(), fetchUserLocation()]);
	});

	let lastFetchKey = '';
	$effect(() => {
		const currentKey = `${userLoc.lat || ''}-${userLoc.lng || ''}-${selectedCategory}`;
		if (currentKey !== lastFetchKey) {
			lastFetchKey = currentKey;
			fetchNearbyItems();
		}
	});

	function getFirstImage(imgStr) {
		try {
			const imgs = JSON.parse(imgStr || '[]');
			return toDisplayUrl(imgs[0]) || 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80';
		} catch {
			return 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80';
		}
	}

    let interestModal = $state({ show: false, step: 1, item: null, biz: null, loading: false });

    async function confirmInterest() {
		interestModal.loading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/requests`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					item_id: interestModal.item.id,
					target_business_ids: [interestModal.item.business_id],
					title: `Requirement: ${interestModal.item.product_name}`,
					category: [interestModal.item.category],
					image: getFirstImage(interestModal.item.image),
					lat: userLoc.lat, long: userLoc.lng, city: userLoc.city, pincode: userLoc.pincode,
					description: {
						title: interestModal.item.product_name,
						details: `I am interested in this item. Please provide your best quote.`,
						budget: interestModal.item.price || ''
					}
				}),
				credentials: 'include'
			});
			if (res.ok) {
				const bRes = await fetch(`${API_BASE_URL}/api/businesses/${interestModal.item.business_id}`);
				if (bRes.ok) { interestModal.biz = await bRes.json(); interestModal.step = 2; }
			}
		} catch (err) {} finally { interestModal.loading = false; }
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<div class="mx-auto flex max-w-2xl items-center justify-between">
			<div>
				<h1 class="text-xl font-black text-gray-900 dark:text-white">Near<span class="text-orange-500">Buy</span></h1>
				<p class="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
					<Icon icon="mdi:map-marker" class="text-orange-500" /> {userLoc.city || 'Home'}
				</p>
			</div>
            <a href="/user/search" class="text-xl text-gray-400"><Icon icon="mdi:magnify" /></a>
		</div>
	</header>

	<div class="mx-auto max-w-2xl px-4 py-5 space-y-6">
		<button onclick={() => showNearbyMap = !showNearbyMap} class="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="flex flex-col items-start">
				<span class="flex items-center gap-2 text-sm font-bold dark:text-white">
					<Icon icon="mdi:map-marker-radius" class="text-orange-500" /> Nearby Discovery
				</span>
			</div>
			<span class="text-xs font-bold text-orange-500">{showNearbyMap ? 'Hide Map' : 'Show Map'}</span>
		</button>

		{#if showNearbyMap}
			<div class="animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-gray-900">
				<NearBuyMap
					center={[userLoc.lng || 80.2707, userLoc.lat || 13.0827]}
					zoom={13} height="280px"
					markers={[
						...(userLoc.lat ? [{ id: 'user', type: 'user', lat: userLoc.lat, lng: userLoc.lng, popup: '<b>📍 Me</b>' }] : []),
						...businesses.map(biz => ({ id: biz.id, lat: biz.lat, lng: biz.long, label: '🏢', type: 'business', popup: `<b>${biz.bname}</b>` }))
					]}
					onMarkerClick={(m) => { if (m.id !== 'user') selectedBiz = businesses.find(b => b.id === m.id); }}
				/>
			</div>
		{/if}

		<div class="flex overflow-x-auto gap-2 py-1 hide-scrollbar -mx-1">
			{#each productCategories as cat}
				<button onclick={() => selectedCategory = cat} class={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white border-orange-500 scale-105 shadow-lg shadow-orange-500/20' : 'bg-white text-gray-500 border-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'}`}>
					{cat}
				</button>
			{/each}
		</div>

		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">Local Deals</h2>
				<span class="text-[10px] font-black text-orange-500">{items.length} items found</span>
			</div>

			{#if loading && items.length === 0}
				<div class="grid grid-cols-2 gap-4">
					{#each Array(4) as _} <div class="h-48 rounded-2xl bg-gray-200 dark:bg-gray-900 animate-pulse"></div> {/each}
				</div>
			{/if}

			{#if items.length > 0}
				<div class="grid grid-cols-2 gap-2 md:gap-4 {loading ? 'opacity-70 grayscale-[0.2]' : ''} transition-all duration-500">
					{#each items as item}
						<div class="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl">
							<a href={`/user/item/${item.id}`} class="block">
								<div class="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
									<img src={getFirstImage(item.image)} alt={item.product_name} class="w-full h-full object-cover transition-transform group-hover:scale-110" />
									<div class="absolute top-2 left-2 flex flex-col gap-1">
										{#if item.distance}
											<span class="bg-orange-600/90 backdrop-blur-md text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{item.distance} km away</span>
										{/if}
									</div>
								</div>
								<div class="p-3">
									<h3 class="text-sm font-black text-gray-900 dark:text-white truncate">{item.product_name}</h3>
									<div class="flex items-center gap-1 mt-1">
										<Icon icon="mdi:store" class="text-orange-500" />
										<span class="text-[9px] font-black text-gray-500 dark:text-gray-400 truncate">{item.business_name}</span>
									</div>
                                    <div class="mt-2 flex items-center justify-between">
                                        {#if item.price}
                                            <span class="text-xs font-black text-orange-500">₹{item.price}</span>
                                        {/if}
                                        <button onclick={(e) => { e.preventDefault(); interestModal.item = item; interestModal.show = true; }} class="text-[10px] font-black text-orange-500 bg-orange-500/5 px-2 py-1 rounded-lg uppercase">Interested</button>
                                    </div>
								</div>
							</a>
						</div>
					{/each}
				</div>
			{:else if !loading && items.length === 0}
				<div class="text-center py-20 bg-white dark:bg-gray-900 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
					<Icon icon="mdi:package-variant-closed" class="mx-auto text-4xl text-gray-200 mb-2" />
					<p class="text-xs font-black text-gray-400 uppercase tracking-widest">No local deals found</p>
					<button onclick={() => fetchNearbyItems()} class="mt-4 text-[10px] font-black text-orange-500 uppercase">Try Refreshing</button>
				</div>
			{/if}
		</section>

		<a href="/user/post-requirement" class="block rounded-3xl bg-linear-to-r from-orange-600 to-orange-500 p-6 text-white shadow-xl shadow-orange-500/30 transition-all active:scale-95">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<h3 class="text-lg font-black leading-tight">Can't find it?</h3>
					<p class="text-[10px] font-black text-orange-100 uppercase tracking-widest">Broadcasting your need to local sellers</p>
				</div>
				<Icon icon="mdi:chevron-right" class="text-2xl text-white" />
			</div>
		</a>
	</div>
</div>

{#if interestModal.show}
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
        <button class="absolute inset-0" onclick={() => interestModal.show = false}></button>
        <div class="relative w-full max-w-sm rounded-t-[40px] bg-white p-8 shadow-2xl dark:bg-gray-900 md:rounded-[40px] animate-in slide-in-from-bottom duration-300">
            {#if interestModal.step === 1}
                <div class="text-center">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-3xl">❤️</div>
                    <h2 class="text-xl font-black text-gray-900 dark:text-white">Confirm Interest</h2>
                    <p class="mt-2 text-xs font-medium text-gray-500">We'll notify <b>{interestModal.item?.business_name}</b> that you're interested in <b>{interestModal.item?.product_name}</b>.</p>
                    <div class="mt-8 flex gap-3">
                        <button onclick={() => interestModal.show = false} class="flex-1 rounded-2xl bg-gray-50 py-4 text-xs font-black text-gray-400 dark:bg-gray-800">No, Wait</button>
                        <button onclick={confirmInterest} disabled={interestModal.loading} class="flex-1 rounded-2xl bg-orange-500 py-4 text-xs font-black text-white shadow-lg active:scale-95 transition-all">Send Now</button>
                    </div>
                </div>
            {:else}
                <div class="text-center">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">✅</div>
                    <h2 class="text-xl font-black text-gray-900 dark:text-white">Interest Sent!</h2>
                    <p class="mt-2 text-xs font-medium text-gray-500">The merchant will review and send you a <b>Quote</b>. Track it in your Quotes tab.</p>
                    <div class="mt-8 flex flex-col gap-2">
                        <a href="/user/quotes" onclick={() => interestModal.show = false} class="w-full rounded-2xl bg-orange-500 py-4 text-xs font-black text-white shadow-lg text-center">📋 View My Quotes</a>
                        <button onclick={() => interestModal.show = false} class="w-full rounded-xl py-3 text-xs font-bold text-gray-400">Close</button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

{#if selectedBiz}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <button class="absolute inset-0" onclick={() => selectedBiz = null}></button>
        <div class="relative w-full max-w-xs overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-gray-900 animate-in zoom-in-95 duration-200">
            <a href={`/business/${selectedBiz.id}`} class="block transition-transform hover:scale-[1.02]">
                <div class="h-20 bg-orange-500"></div>
                <div class="px-6 pb-6 text-center">
                    <div class="mx-auto -mt-10 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 dark:border-gray-900 dark:bg-gray-800 shadow-md">
                        <img src={toDisplayUrl(selectedBiz.avatar_url)} alt="biz" class="h-full w-full object-cover" />
                    </div>
                    <h3 class="mt-3 text-lg font-black dark:text-white">{selectedBiz.bname}</h3>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedBiz.city}</p>
                    <p class="mt-2 text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 rounded-lg py-1">Tap to Expand Profile</p>
                </div>
            </a>
            <div class="px-6 pb-6 flex gap-2">
                <button onclick={() => selectedBiz = null} class="flex-1 rounded-xl bg-gray-100 py-3 text-[10px] font-bold dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">Dismiss</button>
            </div>
        </div>
    </div>
{/if}

<style>
	.hide-scrollbar::-webkit-scrollbar { display: none; }
	.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
