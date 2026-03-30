<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const id = page.params.id;
	let loading = $state(true);
	let rawAd = $state(null);

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/ads/${id}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawAd = data.ad || data;
			}
		} catch (err) {
			console.error('Failed to fetch offer detail:', err);
		} finally {
			loading = false;
		}
	});

	let offer = $derived(rawAd ? {
		id: rawAd.id,
		title: rawAd.title || 'Store Offer',
		provider: rawAd.business?.name || 'Local Store',
		providerId: rawAd.business_id || rawAd.businessId,
		location: `${rawAd.business?.city || 'Local'} • 1.2 km away`,
		images: rawAd.images && rawAd.images.length > 0 ? rawAd.images : [
			rawAd.image_url || rawAd.image || 'https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=600&q=80',
			'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600&q=80'
		],
		description: rawAd.description || 'Visit us in-store to learn more about this exciting new offer!',
		expiresIn: (rawAd.end_date || rawAd.endDate) && new Date(rawAd.end_date || rawAd.endDate) > new Date() ? 'Limited time' : 'Ends soon',
		likes: 124,
		isLiked: false,
		savedCount: 56
	} : {
		id: '', title: 'Loading...', provider: '...', images: [], description: '...', expiresIn: '...', likes: 0, isLiked: false, savedCount: 0
	});

	let currentImageIndex = $state(0);

	function toggleLike() {
		offer.isLiked = !offer.isLiked;
		offer.likes += offer.isLiked ? 1 : -1;
	}

	function nextImage() {
		if (offer.images.length > 0) {
			currentImageIndex = (currentImageIndex + 1) % offer.images.length;
		}
	}

	function prevImage() {
		if (offer.images.length > 0) {
			currentImageIndex = (currentImageIndex - 1 + offer.images.length) % offer.images.length;
		}
	}

	function shareOffer() {
		if (navigator.share) {
			navigator.share({
				title: offer.title,
				text: `Check out this amazing offer from ${offer.provider} on NearBuy!`,
				url: window.location.href
			}).catch(console.error);
		} else {
			alert('Sharing not supported.');
		}
	}

	$effect(() => {
		if (offer.images && offer.images.length > 1) {
			const interval = setInterval(() => {
				nextImage();
			}, 5000);
			return () => clearInterval(interval);
		}
	});
</script>

<svelte:head>
	<title>{offer.title} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<!-- Transparent Header overlaying image -->
	<header class="fixed top-0 z-30 flex w-full items-center justify-between px-4 py-4 bg-gradient-to-b from-black/60 to-transparent">
		<a href="/user/offers" class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 transition-colors drop-shadow-sm font-bold border border-white/10">
			←
		</a>
		<div class="flex gap-2">
			<button 
				onclick={shareOffer}
				aria-label="Share Offer"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 transition-colors drop-shadow-sm border border-white/10"
			>
				📤
			</button>
			<button 
				onclick={toggleLike}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md transition-colors hover:bg-black/40 drop-shadow-sm border border-white/10"
			>
				{#if offer.isLiked}
					<span class="text-xl">❤️</span>
				{:else}
					<span class="text-xl grayscale font-bold">🤍</span>
				{/if}
			</button>
		</div>
	</header>

	<div class="mx-auto max-w-xl bg-white dark:bg-gray-900 min-h-screen sm:shadow-sm">
		<!-- Image Carousel -->
		<div class="relative h-72 sm:h-80 md:h-96 w-full bg-gray-900 group">
			<!-- Carousel Track -->
			<div class="relative h-full w-full overflow-hidden flex">
				{#each offer.images as img, i}
					<div 
						class="absolute top-0 left-0 h-full w-full transition-opacity duration-300"
						style="opacity: {i === currentImageIndex ? 1 : 0}; z-index: {i === currentImageIndex ? 10 : 0}"
					>
						<img src={img} alt="Offer {i+1}" class="h-full w-full object-cover" />
					</div>
				{/each}
			</div>

			<!-- Image Controls -->
			{#if offer.images.length > 1}
				<button onclick={prevImage} class="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/50">
					‹
				</button>
				<button onclick={nextImage} class="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/50">
					›
				</button>
				<!-- Dots -->
				<div class="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 backdrop-blur-md bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
					{#each offer.images as _, i}
						<button 
							onclick={() => currentImageIndex = i}
							class={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
							aria-label={`Go to slide ${i + 1}`}
						></button>
					{/each}
				</div>
			{/if}
			
			<div class="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
		</div>

		<!-- Details Content -->
		<div class="px-5 py-6">
			<!-- Title & Expiry -->
			<div class="mb-5 flex items-start justify-between gap-4">
				<h1 class="text-2xl sm:text-3xl font-black leading-tight">{offer.title}</h1>
				<div class="flex shrink-0 flex-col items-end">
					<span class="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 flex items-center gap-1 rounded-lg border border-red-100 dark:border-red-900">
						⏱️ {offer.expiresIn}
					</span>
					<span class="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
						{offer.likes} Likes
					</span>
				</div>
			</div>

			<!-- Provider Card -->
			<div class="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800/50 p-4 transition-all hover:border-gray-200 dark:hover:border-gray-700">
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-500/30 text-lg font-bold text-orange-600">
						{offer.provider[0]}
					</div>
					<div class="flex-1">
						<h3 class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-sm">{offer.provider}</h3>
						<p class="text-sm font-semibold text-orange-500 flex items-center gap-1 mt-0.5">📍 {offer.location}</p>
					</div>
					<a 
						href={`/user/business/${offer.providerId}`}
						class="flex h-10 items-center justify-center rounded-xl bg-gray-50 px-4 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50"
					>
						Profile
					</a>
				</div>
			</div>

			<!-- Description -->
			<div class="mb-8 p-5 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
				<h3 class="mb-2 text-xs font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">Offer Details</h3>
				<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
					{offer.description}
				</p>
			</div>
		</div>
	</div>
</div>
