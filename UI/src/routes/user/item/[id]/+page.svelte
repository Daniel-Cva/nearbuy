<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';
	import { getCurrentUserId } from '$lib/stores/auth.svelte.js';

	const itemId = page.params.id;

	let loading = $state(true);
	let interested = $state(false);
	let done = $state(false);
	let showShopMap = $state(false);
	
	let item = $state({
		id: itemId,
		name: 'Loading...',
		shop: 'Business Name',
		shopId: '',
		type: 'product',
		category: '',
		rating: 0,
		reviewsCount: 0,
		images: [],
		description: '',
		specification: {},
		location: '',
		phone: '',
		email: '',
		shopLat: 0,
		shopLng: 0
	});

	let reviews = $state([]);
	let reviewsLoading = $state(true);

	let currentImageIndex = $state(0);
	let carouselEl = $state(null);

	onMount(async () => {
		try {
			// Fetch Item details
			const iRes = await fetch(`${API_BASE_URL}/api/items/${itemId}`, { credentials: 'include' });
			if (iRes.ok) {
				const i = await iRes.json();
				const b = i.business || {};
				
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
				const imgs = unroll(i.image || []);

				let specs = {};
				try { specs = JSON.parse(i.specification || '{}'); } catch(_) {}

				item = {
					...item,
					id: i.id,
					name: i.product_name,
					shop: i.business_name || b.bname || 'Store',
					shopId: i.business_id,
					type: i.item_type || 'product',
					category: i.category,
					images: imgs.length ? imgs.map(p => toDisplayUrl(p)) : ['https://images.unsplash.com/photo-1620712943543-bcc4628c9759?w=800&q=80'],
					description: i.description || 'No description available.',
					specification: specs,
					location: `${i.city || b.city || ''}, ${i.state || b.state || ''}`,
					phone: i.mobile || b.mobile || '',
					email: i.email || b.email || '',
					shopLat: i.lat || 0,
					shopLng: i.long || 0
				};
			}

			// Fetch Reviews
			const rRes = await fetch(`${API_BASE_URL}/api/reviews?item_id=${itemId}`);
			if (rRes.ok) {
				reviews = await rRes.json();
				item.reviewsCount = reviews.length;
				if (reviews.length > 0) {
					const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
					item.rating = (sum / reviews.length).toFixed(1);
				}
			}
		} catch (err) {
			console.error('Failed to load item:', err);
		} finally {
			loading = false;
			reviewsLoading = false;
		}
	});
	
	async function handleInterest() {
		interested = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders`, { credentials: 'include',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					business_id: item.shopId,
					items: [{ id: item.id, qty: 1 }],
					notes: `Interesed in ${item.name}`
				}),
				credentials: 'include'
			});
			
			if (res.ok) {
				setTimeout(() => (done = true), 1500);
			}
		} catch (err) {
			console.error('Failed to create interest order:', err);
			interested = false;
		}
	}

	function handleScroll(e) {
		if (!carouselEl) return;
		const scrollLeft = e.target.scrollLeft;
		const width = e.target.clientWidth;
		currentImageIndex = Math.round(scrollLeft / width);
	}

	function scrollToImage(index) {
		if (!carouselEl) return;
		currentImageIndex = index;
		const width = carouselEl.clientWidth;
		carouselEl.scrollTo({
			left: width * index,
			behavior: 'smooth'
		});
	}

	function nextImage() {
		if (item.images && item.images.length > 1) {
			if (currentImageIndex < item.images.length - 1) {
				scrollToImage(currentImageIndex + 1);
			} else {
				scrollToImage(0); // Loop back
			}
		}
	}

	function prevImage() {
		if (currentImageIndex > 0) {
			scrollToImage(currentImageIndex - 1);
		}
	}

	$effect(() => {
		if (item.images && item.images.length > 1) {
			const interval = setInterval(() => {
				nextImage();
			}, 5000);
			return () => clearInterval(interval);
		}
	});

	function shareItem() {
		if (navigator.share) {
			navigator.share({
				title: item.name,
				text: `Check out ${item.name} on NearBuy!`,
				url: window.location.href
			}).catch(console.error);
		} else {
			alert('Sharing not supported.');
		}
	}
</script>

<svelte:head>
	<title>{item.name} — NearBuy</title>
	<meta
		name="description"
		content="View details of {item.name} from {item.shop} on NearBuy. {item.description}"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="flex-1 font-bold">{item.name}</h1>
		<div class="flex items-center gap-3">
			<button onclick={shareItem} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" title="Share Item">📤</button>
			<button class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">♡</button>
		</div>
	</header>

	<div class="mx-auto max-w-xl space-y-5 px-4 py-6">
		<!-- Image Carousel -->
		<div class="relative group flex h-72 w-full overflow-hidden items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			{#if item.images && item.images.length > 0}
				<div 
					class="flex h-full w-full snap-x snap-mandatory overflow-x-auto hide-scrollbar" 
					bind:this={carouselEl} 
					onscroll={handleScroll}
				>
					{#each item.images as img, i}
						<div class="h-full min-w-full shrink-0 snap-center">
							<img src={img} alt={`${item.name} image ${i + 1}`} class="h-full w-full object-cover" loading="lazy" />
						</div>
					{/each}
				</div>

				<!-- Dots -->
				{#if item.images.length > 1}
					<div class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
						{#each item.images as _, i}
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button 
								onclick={() => scrollToImage(i)}
								class={`h-1.5 rounded-full shadow-sm transition-all ${currentImageIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'}`}
							></button>
						{/each}
					</div>

					<!-- Arrows (visible on hover) -->
					<button 
						onclick={prevImage}
						aria-label="Previous image"
						class={`absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 group-hover:opacity-100 ${currentImageIndex === 0 ? 'hidden' : ''}`}
					>
						←
					</button>
					<button 
						onclick={nextImage}
						aria-label="Next image"
						class={`absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 group-hover:opacity-100 ${currentImageIndex === item.images.length - 1 ? 'hidden' : ''}`}
					>
						→
					</button>
				{/if}
			{:else}
				<span class="text-8xl">{item.icon}</span>
			{/if}
		</div>

		<!-- Info -->
		<div>
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-xl font-bold">{item.name}</h2>
					<div class="flex flex-col">
						<a href={`/business/${item.shopId}`} class="text-sm font-bold text-orange-600 hover:underline dark:text-orange-400">
							{item.shop}
						</a>
						<span class="text-[10px] text-gray-400 font-mono">ID: {item.shopId}</span>
					</div>
				</div>
			</div>
			
			<div class="mt-2 flex items-center gap-1">
				<span class="text-yellow-500 font-bold">⭐ {item.rating}</span>
				<span class="text-xs text-gray-400">({item.reviewsCount} reviews)</span>
			</div>
			
			{#if item.category}
				<div class="mt-3 flex flex-wrap gap-2">
					<span class="rounded-lg bg-orange-100 dark:bg-orange-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
						{item.category}
					</span>
				</div>
			{/if}
		</div>

		<!-- Description -->
		<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h3 class="mb-2 font-bold flex items-center gap-2"><Icon icon="mdi:text-subject" /> Description</h3>
			<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>
		</div>

		<!-- Specifications -->
		{#if Object.keys(item.specification).length > 0}
			<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h3 class="mb-4 font-bold flex items-center gap-2"><Icon icon="mdi:list-status" /> Specifications</h3>
				<div class="grid gap-3">
					{#each Object.entries(item.specification) as [key, val]}
						<div class="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
							<span class="text-xs font-bold text-gray-400 uppercase tracking-widest">{key}</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">{val}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Reviews Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between px-1">
				<h3 class="font-bold">Customer Feedback</h3>
				{#if reviews.length > 5}
					<a href={`/user/reviews/items/${item.id}`} class="text-xs font-bold text-orange-500 hover:underline">View All</a>
				{/if}
			</div>

			{#if reviewsLoading}
				<div class="rounded-2xl border border-gray-200 bg-white p-10 animate-pulse dark:bg-gray-900"></div>
			{:else if reviews.length === 0}
				<div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:bg-gray-900 dark:border-gray-800">
					<p class="text-sm font-medium text-gray-400">No reviews yet for this product.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each reviews.slice(0, 3) as rev}
						<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-xs font-bold">{rev.firstname ?? 'User'}</span>
								<span class="text-xs text-yellow-500">{'⭐'.repeat(rev.rating)}</span>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400">{rev.review_text}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Location -->
		<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="font-bold">📍 Shop Location</h3>
				<a href={`/business/${item.shopId}`} class="text-xs font-bold text-orange-600 hover:underline">
					View Profile →
				</a>
			</div>
			<p class="text-sm text-gray-600 dark:text-gray-300">{item.location}</p>
			{#if item.shopLat && item.shopLng}
				<div class="mt-1 flex gap-3 text-[10px] font-mono text-gray-400">
					<span>Lat: {item.shopLat.toFixed(6)}</span>
					<span>Long: {item.shopLng.toFixed(6)}</span>
				</div>
			{/if}
			<button
				onclick={() => showShopMap = !showShopMap}
				class="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-600 transition-all hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
			>
				🗺️ {showShopMap ? 'Hide Map' : 'View on Map'}
			</button>
			{#if showShopMap}
				<div class="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
					{#await import('$lib/components/NearBuyMap.svelte') then { default: NearBuyMap }}
						<NearBuyMap
							center={[item.shopLng, item.shopLat]}
							zoom={15}
							height="200px"
							showControls={true}
							markers={[
								{ id: item.shopId, businessId: item.shopId, lat: item.shopLat, lng: item.shopLng, label: item.shop[0], popup: `<b>${item.shop}</b><br/><span style="color:#888;font-size:11px">${item.location}</span><br/><span style="color:#f97316;font-size:11px;font-weight:600">Tap to view shop →</span>` }
							]}
							onMarkerClick={(marker) => {
								if (marker.businessId) {
									window.location.href = `/business/${marker.businessId}`;
								}
							}}
						/>
					{/await}
				</div>
			{/if}
		</div>
	</div>

	<!-- CTA Bar -->
	<div
		class="fixed right-0 bottom-0 left-0 z-20 mx-auto max-w-xl border-t border-gray-200 bg-white/95 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95"
	>
		{#if !done}
			<button
				id="btn-im-interested"
				onclick={handleInterest}
				disabled={interested}
				class={`w-full rounded-2xl py-4 text-lg font-bold text-white transition-all shadow-lg ${interested ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-400 hover:-translate-y-1 shadow-orange-500/20'}`}
			>
				{#if interested}
					<span class="flex items-center justify-center gap-2">
						<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						Notifying Provider...
					</span>
				{:else}
					✋ I'm Interested
				{/if}
			</button>
		{:else}
			<div class="flex flex-col gap-3 animate-in slide-in-from-bottom duration-500">
				<div class="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 py-2 text-sm font-bold text-green-600 dark:text-green-400">
					<span>✅</span> Private Contact Exchange Authorized
				</div>
				<button onclick={() => window.location.href='/user/messages'} class="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-lg font-bold text-white shadow-xl hover:bg-black transition-all dark:bg-gray-800 active:scale-95">
					💬 Message Provider
				</button>
			</div>
		{/if}
	</div>
</div>

{#if done}
	<!-- Exchanged Data Card -->
	<div class="mx-auto max-w-xl px-4 pb-6 mt-[-10px] animate-in fade-in slide-in-from-top duration-700">
		<div class="rounded-3xl border border-green-200 bg-linear-to-br from-white to-green-50/50 p-6 shadow-xl shadow-green-900/5 dark:border-green-800/30 dark:from-gray-900 dark:to-green-950/20">
			<div class="flex items-center gap-3 mb-5">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-2xl shadow-lg shadow-green-500/20 animate-bounce-short">
					🤝
				</div>
				<div>
					<h3 class="font-black text-gray-900 dark:text-white leading-tight">Interest Expressed</h3>
					<p class="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Transaction Active</p>
				</div>
			</div>

			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
						<p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendor Name</p>
						<p class="font-bold text-gray-900 dark:text-white truncate">{item.ownerName || item.shop}</p>
					</div>
					<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
						<p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile</p>
						<p class="font-bold text-gray-900 dark:text-white">{item.phone}</p>
					</div>
				</div>

				<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
					<p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Official Email</p>
					<p class="font-bold text-gray-900 dark:text-white truncate">{item.email}</p>
				</div>

				<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
					<p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Business Address</p>
					<p class="font-bold text-gray-800 dark:text-gray-200 leading-tight text-sm">{item.location}</p>
				</div>

				<div class="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
					<span class="text-base">🛡️</span>
					<span>Your verified contact details have been securely shared with the vendor.</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes bounce-short {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	.animate-bounce-short {
		animation: bounce-short 2s ease-in-out infinite;
	}

	/* Hide scrollbar for Chrome, Safari and Opera */
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	/* Hide scrollbar for IE, Edge and Firefox */
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
