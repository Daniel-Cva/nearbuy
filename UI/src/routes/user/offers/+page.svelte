<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let rawOffers = $state([]);
	let loading = $state(true);
	let localLikes = $state({});

	onMount(async () => {
		try {
			// Assuming there is a public ads endpoint, otherwise fallback to items
			const res = await fetch(`${API_BASE_URL}/api/ads`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawOffers = data.ads || [];
			} else {
				// Fallback to items if ads endpoint doesn't exist
				const itemRes = await fetch(`${API_BASE_URL}/api/items?type=ad`, { credentials: 'include' });
				if (itemRes.ok) {
					const data = await itemRes.json();
					rawOffers = data.items || [];
				}
			}
		} catch (err) {
			console.error('Failed to fetch offers:', err);
		} finally {
			loading = false;
		}
	});

	let offers = $derived(
		rawOffers.map(a => {
			const biz = a.business || {};
			const liked = localLikes[a.id] || false;
			return {
				id: a.id,
				title: a.title,
				providerId: a.business_id || a.businessId,
				location: `${biz.city || 'Local Area'} • 1.2 km away`,
				image: a.image_url || a.image || 'https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=600&q=80',
				expiresIn: (a.endDate || a.end_date) && new Date(a.endDate || a.end_date) > new Date() ? 'Limited time' : 'Expired',
				discount: a.type === 'banner' ? 'BANNER' : 'SPECIAL',
				likes: liked ? 1 : 0,
				isLiked: liked
			};
		})
	);

	function toggleLike(id) {
		localLikes[id] = !localLikes[id];
	}
</script>

<svelte:head>
	<title>Local Offers — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
		<h1 class="font-bold flex-1">Offers</h1>
		<div class="text-xl">🎁</div>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		<p class="mb-5 text-xl font-black text-gray-900 dark:text-white">Amazing offers nearby you</p>

		<div class="space-y-5">
			{#each offers as offer}
				<div class="relative block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 group">
					<a href={`/user/offers/${offer.id}`} class="absolute inset-0 z-10" aria-label={`View ${offer.title} offer`}></a>
					<!-- Image Banner -->
					<div class="relative h-56 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
						<img src={offer.image} alt={offer.title} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
						
						<!-- Overlay Gradient -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

						<!-- Like Button -->
						<button 
							onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(offer.id); }}
							class="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform active:scale-95 dark:bg-gray-900/90 hover:scale-110"
							aria-label="Like offer"
						>
							{#if offer.isLiked}
								<span class="text-xl leading-none">❤️</span>
							{:else}
								<span class="text-xl leading-none grayscale opacity-70">🤍</span>
							{/if}
						</button>
						
						<div class="absolute bottom-4 left-4 right-4 text-white">
							<h2 class="text-2xl font-black leading-tight drop-shadow-md">{offer.title}</h2>
						</div>
					</div>

					<!-- Content Block -->
					<div class="px-5 py-4 flex items-center justify-between bg-white dark:bg-gray-900">
						<div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
							<span class="text-orange-500 text-lg leading-none">📍</span>
							<span class="text-sm font-bold">{offer.location}</span>
						</div>
						
						<div class="flex items-center gap-1.5 text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-500/20">
							<span class="leading-none text-sm">⏱️</span>
							<span class="text-xs font-black tracking-wide uppercase">{offer.expiresIn}</span>
						</div>
					</div>
				</div>
			{:else}
				<div class="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
					There are no new offers in your area right now.
				</div>
			{/each}
		</div>
	</div>
</div>
