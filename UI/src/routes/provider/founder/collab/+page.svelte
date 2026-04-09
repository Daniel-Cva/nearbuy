<script>
	import { onMount, onDestroy } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import Icon from '@iconify/svelte';
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let profile         = $derived(getCurrentProfile());
	let bizId           = $derived(profile?.biz_id);

	let collabActive    = $state(false);
	let myLat           = $state(null);
	let myLng           = $state(null);
	let founders        = $state([]);
	let selectedFounder = $state(null);
	let wsStatus        = $state('idle');   // idle | connecting | live | error
	let locationErr     = $state('');

	// Map ref getter from NearBuyMap's onMapReady
	let mapRef = null;

	// Build markers array: 'me' + one per nearby founder
	let mapMarkers = $derived([
		// My position — pulsing blue dot (user type)
		...(myLat !== null ? [{
			id: 'me',
			type: 'user',
			lat: myLat,
			lng: myLng,
			popup: '<b>👑 You</b><br/><small>Your live location</small>'
		}] : []),
		// Nearby founders
		...founders.map(f => ({
			id: f.founderId,
			type: 'founder',
			lat: f.lat,
			lng: f.lng,
			label: (f.founderName || 'F')[0].toUpperCase(),
			name: f.founderName,
			popup: `<b>${f.founderName}</b><br/><small>${f.bizName}</small><br/><small style="color:#f97316">${f.distanceM}m away</small>`
		}))
	]);

	// Center follows my position; default to India center
	let mapCenter = $derived(myLat !== null ? [myLng, myLat] : [80.2707, 13.0827]);

	// ── WebSocket ──────────────────────────────────────────────────────────────
	let ws      = null;
	let hbTimer = null;

	// Fetch a WS ticket from the server (httpOnly cookies can't be read by JS)
	async function getWsUrl() {
		const res = await fetch(`${API_BASE_URL}/api/collab/ticket`, { credentials: 'include' });
		if (!res.ok) throw new Error('Not authenticated for collab');
		const { ticket } = await res.json();
		const base = API_BASE_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
		return `${base}/api/collab/ws?token=${encodeURIComponent(ticket)}`;
	}

	async function startWs() {
		if (ws) return;
		wsStatus = 'connecting';
		try {
			const url = await getWsUrl(); // Fetch ticket server-side (httpOnly cookie)
			ws = new WebSocket(url);
			ws.onopen    = () => { wsStatus = 'live'; sendHeartbeat(); hbTimer = setInterval(sendHeartbeat, 5000); };
			ws.onmessage = (e) => {
				try {
					const msg = JSON.parse(e.data);
					if (msg.type === 'founders') founders = msg.founders;
				} catch (_) {}
			};
			ws.onerror = () => { wsStatus = 'error'; };
			ws.onclose = () => { wsStatus = 'idle'; clearInterval(hbTimer); ws = null; founders = []; };
		} catch (e) { 
			console.error('[Collab] WS connect failed:', e.message);
			wsStatus = 'error'; 
		}
	}

	function stopWs() {
		clearInterval(hbTimer);
		if (ws) { ws.close(); ws = null; }
		wsStatus = 'idle';
		founders  = [];
	}

	function sendHeartbeat() {
		if (!ws || ws.readyState !== WebSocket.OPEN || myLat === null) return;
		ws.send(JSON.stringify({
			type:        'heartbeat',
			founderId:   profile?.id || bizId,
			bizId,
			bizName:     profile?.bname || profile?.firstname || 'Business',
			founderName: profile?.firstname || 'Founder',
			bizCategory: profile?.category || '',
			lat: myLat, lng: myLng
		}));
	}

	// ── Geolocation ────────────────────────────────────────────────────────────
	let geoWatch = null;

	function startGeo() {
		if (!navigator.geolocation) { locationErr = 'GPS not supported'; return; }
		geoWatch = navigator.geolocation.watchPosition(
			(pos) => {
				myLat = pos.coords.latitude;
				myLng = pos.coords.longitude;
				locationErr = '';
				// Pan map to new position
				if (mapRef) mapRef.panTo([myLng, myLat]);
				if (ws?.readyState === WebSocket.OPEN) sendHeartbeat();
			},
			(err) => { locationErr = 'GPS error: ' + err.message; },
			{ enableHighAccuracy: true, maximumAge: 5000 }
		);
	}

	function stopGeo() {
		if (geoWatch !== null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
	}

	// ── Toggle ─────────────────────────────────────────────────────────────────
	function toggleCollab() {
		if (collabActive) {
			collabActive = false; stopWs(); stopGeo();
		} else {
			collabActive = true; startGeo(); startWs();
		}
	}

	// ── Map callbacks ──────────────────────────────────────────────────────────
	function handleMapReady(mapInstance) {
		mapRef = mapInstance;
	}

	function handleLocationFound(coords) {
		if (myLat === null) {
			myLat = coords.latitude;
			myLng = coords.longitude;
		}
	}

	function handleMarkerClick(marker) {
		if (marker.id === 'me') return;
		// Find the founder from our list
		const f = founders.find(f => f.founderId === marker.id);
		if (f) selectedFounder = f;
	}

	// ── Message a founder ──────────────────────────────────────────────────────
	async function messageFounder(f) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ recipient_id: f.bizId || f.founderId, type: 'general' })
			});
			if (res.ok) { const { id } = await res.json(); window.location.href = `/provider/messages/${id}`; }
		} catch (e) { console.error(e); }
	}

	// ── Stealth Navbar Logic ───────────────────────────────────────────────────
	let showHeader = $state(true);
	let clickCount = $state(0);
	let hideTimer  = null;
	let resetTimer = null;
	
	function hideHeaderLater() {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (collabActive) showHeader = false;
		}, 3000);
	}

	function handleMapTap() {
		clickCount++;
		clearTimeout(resetTimer);
		
		// Reset click count after 1s if they stop tapping
		resetTimer = setTimeout(() => { clickCount = 0; }, 1000); 
		
		if (clickCount >= 4) {
			showHeader = true;
			clickCount = 0;
			hideHeaderLater();
		}
	}

	onMount(() => {
		hideHeaderLater();
		// Get coarse position immediately for map center...
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(pos => {
				if (myLat === null) {
					myLat = pos.coords.latitude;
					myLng = pos.coords.longitude;
				}
			});
		}
	});

	onDestroy(() => { stopWs(); stopGeo(); clearTimeout(hideTimer); });
</script>

<svelte:head>
	<title>Collab Mode — NearBuy Founders</title>
	<meta name="description" content="Discover founders within 500m in real-time using NearBuy Collab Mode." />
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
	class="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gray-950"
	onclick={handleMapTap}
>

	<!-- Floating header (Stealth Mode) -->
	<div class="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-safe pt-4 pointer-events-none transition-all duration-700 {showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}">
		<div class="pointer-events-auto flex items-center gap-2">
			<a href="/provider/profile" aria-label="Back to profile"
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/10">
				<Icon icon="mdi:arrow-left" width="18" />
			</a>
			<div class="rounded-xl bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5">
				<p class="text-[9px] font-black uppercase tracking-widest text-orange-400">Founder Collab</p>
				<p class="text-[10px] font-semibold text-white/60">500m Live Radar</p>
			</div>
		</div>

		<!-- WS status pill -->
		<div class="pointer-events-auto">
			{#if wsStatus === 'live'}
				<span class="flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-400/40 px-3 py-1.5 text-[10px] font-black text-green-400 uppercase tracking-wider">
					<span class="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>Live
				</span>
			{:else if wsStatus === 'connecting'}
				<span class="flex items-center gap-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/40 px-3 py-1.5 text-[10px] font-black text-yellow-400 uppercase tracking-wider">
					<span class="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse"></span>Connecting
				</span>
			{:else if wsStatus === 'error'}
				<span class="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-3 py-1.5 text-[10px] font-black text-red-400 uppercase tracking-wider">
					<Icon icon="mdi:wifi-off" width="10" />WS Offline
				</span>
			{:else}
				<span class="flex items-center gap-1.5 rounded-full bg-black/40 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
					Standby
				</span>
			{/if}
		</div>
	</div>

	<!-- Full-screen NearBuyMap -->
	<div class="absolute inset-0 z-0">
		<NearBuyMap
			center={mapCenter}
			zoom={15}
			theme="liberty"
			height="100%"
			className="h-full w-full"
			markers={mapMarkers}
			interactive={true}
			showControls={true}
			showGeolocate={false}
			radiusKm={collabActive ? 0.5 : 0}
			radiusCenter={myLat !== null ? [myLng, myLat] : null}
			onMapReady={handleMapReady}
			onLocationFound={handleLocationFound}
			onMarkerClick={handleMarkerClick}
		/>
	</div>

	<!-- Bottom controls -->
	<div class="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 space-y-2 pointer-events-none">

		<!-- Nearby founders strip -->
		{#if collabActive && founders.length > 0}
			<div class="pointer-events-auto flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md" style="scrollbar-width:none">
				<p class="shrink-0 text-[9px] font-black uppercase tracking-widest text-orange-400">{founders.length} nearby</p>
				<div class="h-4 w-px bg-white/10 shrink-0"></div>
				{#each founders as f}
					<button onclick={() => selectedFounder = f}
						class="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 transition-all hover:bg-white/20 active:scale-95">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-700 text-xs font-black text-white">
							{(f.founderName||'F')[0]}
						</div>
						<div class="text-left">
							<p class="text-[11px] font-black leading-tight text-white">{f.founderName}</p>
							<p class="text-[9px] text-gray-400">{f.distanceM}m away</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		{#if locationErr}
			<div class="pointer-events-auto rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400">
				{locationErr}
			</div>
		{/if}

		<!-- Start/Stop button -->
		<button
			id="collab-toggle"
			aria-label="{collabActive ? 'Stop' : 'Start'} Collab Mode"
			onclick={toggleCollab}
			class="pointer-events-auto w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 {collabActive ? 'bg-red-600 shadow-red-900/40 text-white' : 'bg-orange-500 shadow-orange-900/40 text-white'}"
		>
			{#if collabActive}
				<span class="flex items-center justify-center gap-2"><Icon icon="mdi:broadcast-off" /> Stop Collab Mode</span>
			{:else}
				<span class="flex items-center justify-center gap-2"><Icon icon="mdi:broadcast" /> Start Collab Mode</span>
			{/if}
		</button>

		{#if !collabActive}
			<p class="pointer-events-none text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
				Your location is private until you start
			</p>
		{/if}
	</div>
</div>

<!-- Founder detail bottom sheet -->
{#if selectedFounder}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
		<button class="absolute inset-0" onclick={() => selectedFounder = null} aria-label="Close"></button>
		<div class="relative w-full max-w-lg rounded-t-[32px] border border-white/10 bg-gray-900 p-6 pb-10">
			<div class="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20"></div>

			<div class="mb-6 flex items-center gap-4">
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-orange-700 text-2xl font-black text-white">
					{(selectedFounder.founderName||'F')[0]}
				</div>
				<div class="min-w-0 flex-1">
					<h2 class="truncate text-lg font-black text-white">{selectedFounder.founderName}</h2>
					<p class="text-sm font-bold text-orange-400">{selectedFounder.bizName}</p>
					{#if selectedFounder.bizCategory}
						<p class="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-500">{selectedFounder.bizCategory}</p>
					{/if}
				</div>
				<div class="shrink-0 text-right">
					<p class="text-2xl font-black leading-none text-orange-500">{selectedFounder.distanceM}m</p>
					<p class="text-[9px] uppercase tracking-widest text-gray-500">away</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<button onclick={() => messageFounder(selectedFounder)}
					class="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95">
					<Icon icon="mdi:chat-processing" /> Message
				</button>
				<a href="/business/{selectedFounder.bizId}"
					class="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4 text-sm font-black text-white transition-all active:scale-95">
					<Icon icon="mdi:store" /> View Shop
				</a>
			</div>

			<button onclick={() => selectedFounder = null}
				class="mt-3 w-full rounded-xl py-3 text-xs font-bold text-gray-500 transition-colors hover:text-white">
				Close
			</button>
		</div>
	</div>
{/if}
