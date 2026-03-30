<script>
	import { getCurrentUserId, auth } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let mounted = $state(false);
	let loading = $state(true);
	let myProfile = $state(null);
	let rawNearbyFounders = $state([]);
	
	let range = $state(100);
	let categoryFilter = $state('all');
	let activeRouteFounder = $state(null);
	let isSharing = $state(false);

	async function fetchRadar() {
		try {
			const [profileRes, radarRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/me/founder-profile`, { credentials: 'include' }),
				fetch(`${API_BASE_URL}/api/founder-collab/radar?range=${range}`, { credentials: 'include' })
			]);

			if (profileRes.ok) {
				myProfile = await profileRes.json();
				isSharing = myProfile.is_sharing || myProfile.isSharing || false;
			}
			
			if (radarRes.ok) {
				const data = await radarRes.json();
				rawNearbyFounders = data.founders || [];
			}
		} catch (err) {
			console.error('Failed to fetch radar data:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		mounted = true;
		fetchRadar();
	});

	const myLocation = $derived({ lat: myProfile?.lat || 13.0827, lng: myProfile?.lng || 80.2707 });

	// Nearby founders logic
	const nearbyFounders = $derived(
		rawNearbyFounders.map(f => ({
			id: f.id,
			name: f.mode === 'public' ? f.name : 'Anonymous',
			biz: f.mode === 'public' ? f.biz : '***',
			category: f.category || 'Business',
			distance: f.distance_text || 'Nearby',
			lat: f.lat,
			lng: f.lng,
			mode: f.mode
		}))
	);

	const filtered = $derived(
		categoryFilter === 'all'
			? nearbyFounders
			: nearbyFounders.filter((f) => f.category.toLowerCase() === categoryFilter.toLowerCase())
	);

	async function toggleCollab() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/founder-collab/toggle`, {
				method: 'POST',
				credentials: 'include'
			});
			if (res.ok) {
				isSharing = !isSharing;
				fetchRadar();
			}
		} catch (err) {
			console.error('Failed to toggle sharing:', err);
		}
	}
</script>

<svelte:head>
	<title>Founder Collab — NearBuy</title>
	<meta
		name="description"
		content="Find and connect with nearby founders during your commute using NearBuy's exclusive Collab feature."
	/>
</svelte:head>

<div>
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/founder/profile" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Profile</a>
			<h1 class="font-bold text-gray-900 dark:text-white">Collab Radar</h1>
		</div>
		<span class="rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-[10px] tracking-wider font-black uppercase shadow-sm text-orange-700 dark:text-orange-400"
			>👑 Founder Exclusive</span
		>
	</div>

	<div class="mx-auto max-w-2xl space-y-6 px-6 py-6 md:py-0 md:px-0">
		<!-- Toggle Sharing -->
		<div
			class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm"
		>
			<div>
				<h2 class="font-bold text-gray-900 dark:text-white">Share My Location</h2>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
					{isSharing ? '📡 Broadcasting to nearby founders' : 'Start sharing to appear on radars'}
				</p>
			</div>
			<button
				id="toggle-sharing"
				aria-label="Toggle location sharing"
				onclick={toggleCollab}
				class={`relative h-7 w-14 rounded-full transition-colors shadow-inner ${isSharing ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}
			>
				<span
					class={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${isSharing ? 'left-8' : 'left-1'}`}
				></span>
			</button>
		</div>

		<!-- Map Placeholder -->
		<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
			<div class="relative h-64 w-full overflow-hidden bg-gray-50 dark:bg-linear-to-br dark:from-gray-800 dark:to-gray-900 z-0">
				{#if !isSharing}
					<div class="text-center absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/60 backdrop-blur-sm z-10 flex-col">
						<div class="mb-2 text-5xl drop-shadow-sm">🔒</div>
						<p class="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">Location Hidden</p>
						<p class="text-xs font-medium text-gray-500 mt-1 px-8 text-center truncate">Enable broadcasting to see nearby founders</p>
					</div>
				{/if}
				{#if mounted}
					{#await import('$lib/components/NearBuyMap.svelte') then { default: NearBuyMap }}
						<div class="absolute inset-0 z-0 w-full h-full">
							<NearBuyMap
								center={[myLocation.lng, myLocation.lat]}
								zoom={18}
								height="100%"
								className="w-full h-full rounded-none"
								markers={[
									...(isSharing ? [{ id: 'me', lat: myLocation.lat, lng: myLocation.lng, label: '👑', popup: '<b>You (Founder)</b>' }] : []),
									...filtered.filter(f => f.mode !== 'private' && isSharing).map(f => ({
										id: f.id.toString(),
										lat: f.lat,
										lng: f.lng,
										label: f.name[0],
										popup: `<b>${f.name}</b><br/><span style="color:#888;font-size:11px">${f.biz}</span>`
									}))
								]}
								showControls={false}
								interactive={true}
								radiusKm={isSharing ? range / 1000 : 0}
								radiusCenter={[myLocation.lng, myLocation.lat]}
								routeStart={activeRouteFounder ? [myLocation.lng, myLocation.lat] : null}
								routeEnd={activeRouteFounder ? [activeRouteFounder.lng, activeRouteFounder.lat] : null}
							/>
						</div>
					{/await}
				{/if}
			</div>
			<div class="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
				{#if activeRouteFounder}
					<div class="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 p-3">
						<div class="mr-auto flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100">
							📍 Routing to <span class="text-orange-600 dark:text-orange-400">{activeRouteFounder.name}</span>
						</div>
						<a 
							href={`https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${activeRouteFounder.lat},${activeRouteFounder.lng}`}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 rounded-xl bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 transition-all hover:bg-blue-200 dark:hover:bg-blue-500/30 active:scale-95"
						>
							↗️ Google Maps
						</a>
						<button 
							onclick={() => activeRouteFounder = null}
							class="flex items-center gap-1 rounded-xl bg-white dark:bg-gray-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 border border-gray-200 dark:border-gray-700"
						>
							✕ Cancel
						</button>
					</div>
				{/if}
				<label for="range-slider" class="mb-2 block text-xs tracking-wider uppercase font-bold text-gray-500 dark:text-gray-400"
					>Search radius: <span class="text-gray-900 dark:text-white">{range}m</span></label
				>
				<input
					id="range-slider"
					type="range"
					min="50"
					max="500"
					step="50"
					bind:value={range}
					class="w-full accent-orange-500"
				/>
			</div>
		</div>

		<!-- Filters -->
		<div class="flex gap-2">
			{#each ['all', 'product', 'service'] as f}
				<button
					id={`collab-filter-${f}`}
					onclick={() => (categoryFilter = f)}
					class={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all shadow-sm ${categoryFilter === f ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
					>{f}</button
				>
			{/each}
		</div>

		<!-- Nearby Founders -->
		<div>
			<h2 class="mb-3 font-bold text-gray-900 dark:text-white">Nearby Founders <span class="text-gray-400">({filtered.length})</span></h2>
			<div class="space-y-3">
				{#each filtered as founder}
					<div class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 shadow-inner text-lg font-bold text-white uppercase"
						>
							{founder.mode === 'private' ? '?' : founder.name[0]}
						</div>
						<div class="flex-1 overflow-hidden">
							<p class="font-bold text-gray-900 dark:text-white truncate">{founder.name}</p>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{founder.biz} · {founder.category}</p>
							<p class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
								{founder.distance} away · {founder.mode === 'private' ? '🔒 Private' : '🌍 Public'}
							</p>
						</div>
						{#if founder.mode !== 'private'}
							<div class="flex flex-col gap-1.5 shrink-0">
								{#if activeRouteFounder?.id === founder.id}
									<button
										onclick={() => activeRouteFounder = null}
										class="flex items-center justify-center gap-1 rounded-xl bg-blue-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 transition-all shadow-sm active:scale-95"
									>
										📍 Routing...
									</button>
								{:else}
									<button
										onclick={() => {
											activeRouteFounder = founder;
											isSharing = true; // Make sure map is visible
											window.scrollTo({ top: 0, behavior: 'smooth' });
										}}
										class="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 active:scale-95"
									>
										🗺️ Route
									</button>
								{/if}
								<a
									href={`/provider/messages/founder_${founder.id}`}
									class="flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-600 shadow-sm shadow-orange-500/20 active:scale-95"
								>
									💬 Message
								</a>
							</div>
						{/if}
					</div>
				{/each}
				{#if filtered.length === 0}
					<div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
						<div class="mb-3 text-4xl opacity-40">📡</div>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 px-6 text-center">
							No founders found nearby. Enable sharing and wait for others to appear.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

