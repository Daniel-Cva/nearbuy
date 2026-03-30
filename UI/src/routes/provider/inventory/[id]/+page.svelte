<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl, uploadToUniversalApi } from '$lib/helpers/upload.js';

	const itemId = $page.params.id;

	// ── State ────────────────────────────────────────────────────────────────
	let bizId     = $state('');
	let item      = $state(null);
	let reviews   = $state([]);
	let loading   = $state(true);
	let errorMsg  = $state('');
	let deleting  = $state(false);

	// Image carousel
	let currentImageIndex = $state(0);
	let carouselEl        = $state(null);

	// Review image modal
	let lightboxSrc = $state('');

	// Delete review state
	let deletingReviewId = $state('');

	// ── Load ─────────────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			// 1. Get bizId from /api/me
			const me = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!me.ok) throw new Error('Not authenticated');
			const meData = await me.json();
			bizId = meData.profile?.biz_id ?? meData.business?.id ?? meData.biz_id ?? '';
			if (!bizId) throw new Error('No business ID found.');

			// 2. Load item details + reviews in parallel
			const [itemRes, reviewsRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/businesses/${bizId}/items/${itemId}`, {
					credentials: 'include', headers: { 'Accept': 'application/json' }
				}),
				fetch(`${API_BASE_URL}/api/businesses/${bizId}/items/${itemId}/reviews`, {
					credentials: 'include', headers: { 'Accept': 'application/json' }
				})
			]);

			if (!itemRes.ok) throw new Error(`Item not found (${itemRes.status})`);
			const itemData = await itemRes.json();
			item = itemData.item ?? itemData.data ?? itemData;

			if (reviewsRes.ok) {
				const revData = await reviewsRes.json();
				reviews = Array.isArray(revData.reviews ?? revData.data ?? revData)
					? (revData.reviews ?? revData.data ?? revData) : [];
			}
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load item.';
		} finally {
			loading = false;
		}
	});

	// ── Carousel ─────────────────────────────────────────────────────────────
	function handleScroll(e) {
		if (!carouselEl) return;
		currentImageIndex = Math.round(e.target.scrollLeft / e.target.clientWidth);
	}
	function scrollToImage(index) {
		if (!carouselEl) return;
		currentImageIndex = index;
		carouselEl.scrollTo({ left: carouselEl.clientWidth * index, behavior: 'smooth' });
	}

	// ── Delete item ───────────────────────────────────────────────────────────
	async function handleDelete() {
		if (!confirm('Delete this item permanently?')) return;
		deleting = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/items/${itemId}`, {
				method: 'DELETE', credentials: 'include'
			});
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			window.location.href = '/provider/inventory';
		} catch (err) {
			alert(err?.message ?? 'Failed to delete item.');
			deleting = false;
		}
	}

	// ── Delete review ─────────────────────────────────────────────────────────
	async function deleteReview(reviewId) {
		if (!confirm('Delete this review?')) return;
		deletingReviewId = reviewId;
		try {
			const res = await fetch(
				`${API_BASE_URL}/api/businesses/${bizId}/items/${itemId}/reviews/${reviewId}`,
				{ method: 'DELETE', credentials: 'include' }
			);
			if (!res.ok) throw new Error(`Failed (${res.status})`);
			reviews = reviews.filter(r => r.id !== reviewId);
		} catch (err) {
			alert(err?.message ?? 'Failed to delete review.');
		} finally {
			deletingReviewId = '';
		}
	}

	// ── Derived helpers ───────────────────────────────────────────────────────
	const images = $derived(() => {
		if (!item) return [];
		const raw = item.image ?? item.images ?? [];
		const arr = Array.isArray(raw) ? raw : [raw];
		return arr.filter(Boolean).map(p => toDisplayUrl(p));
	});

	const avgRating = $derived(() => {
		if (!reviews.length) return 0;
		return (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1);
	});

	function share() {
		navigator.share?.({ title: item?.product_name, url: window.location.href }).catch(() => {});
	}
</script>

<svelte:head>
	<title>{item?.product_name ?? 'Item'} — NearBuy Inventory</title>
</svelte:head>

<!-- Lightbox -->
{#if lightboxSrc}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onclick={() => (lightboxSrc = '')}>
		<img src={lightboxSrc} alt="Review" class="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
		<button class="absolute top-4 right-4 text-white" onclick={() => (lightboxSrc = '')}>
			<Icon icon="mdi:close" width="28" height="28" />
		</button>
	</div>
{/if}

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/provider/inventory" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="16" height="16" /> Inventory
		</a>
		<h1 class="flex-1 font-bold text-gray-900 dark:text-white truncate">{item?.product_name ?? '…'}</h1>
		{#if item}
			<div class="flex items-center gap-2">
				<button onclick={share} class="text-gray-500 hover:text-orange-500">
					<Icon icon="mdi:share-variant-outline" width="20" height="20" />
				</button>
				<a href={`/provider/inventory/${itemId}/edit`}
					class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all">
					Edit
				</a>
				<button id="btn-delete-item" onclick={handleDelete} disabled={deleting}
					class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-60">
					{#if deleting}<Icon icon="mdi:loading" width="14" height="14" class="animate-spin inline" />{:else}Delete{/if}
				</button>
			</div>
		{/if}
	</header>

	<div class="mx-auto max-w-xl space-y-5 px-4 py-6">

		{#if errorMsg}
			<div class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500">
				<Icon icon="mdi:alert-circle-outline" width="16" height="16" />{errorMsg}
			</div>
		{/if}

		{#if loading}
			<div class="aspect-square w-full rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
			<div class="space-y-3">
				{#each [80, 60, 40] as w}
					<div class="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" style="width:{w}%"></div>
				{/each}
			</div>
		{:else if item}

		<!-- Image carousel -->
		<div class="relative group flex h-72 w-full overflow-hidden items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			{#if images().length > 0}
				<div class="flex h-full w-full snap-x snap-mandatory overflow-x-auto hide-scrollbar"
					bind:this={carouselEl} onscroll={handleScroll}>
					{#each images() as img, i}
						<div class="h-full min-w-full shrink-0 snap-center">
							<img src={img} alt={`${item.product_name} image ${i+1}`} class="h-full w-full object-cover" loading="lazy" />
						</div>
					{/each}
				</div>
				{#if images().length > 1}
					<div class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
						{#each images() as _, i}
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button onclick={() => scrollToImage(i)}
								class={`h-1.5 rounded-full transition-all ${currentImageIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}></button>
						{/each}
					</div>
					{#if currentImageIndex > 0}
						<button onclick={() => scrollToImage(currentImageIndex - 1)}
							aria-label="Previous image"
							class="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
							<Icon icon="mdi:chevron-left" width="20" height="20" />
						</button>
					{/if}
					{#if currentImageIndex < images().length - 1}
						<button onclick={() => scrollToImage(currentImageIndex + 1)}
							aria-label="Next image"
							class="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
							<Icon icon="mdi:chevron-right" width="20" height="20" />
						</button>
					{/if}
				{/if}
			{:else}
				<Icon icon="mdi:package-variant" width="80" height="80" class="text-gray-300 dark:text-gray-700" />
			{/if}
		</div>

		<!-- Item info -->
		<div>
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">{item.product_name}</h2>
					{#if item.brand}
						<p class="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">{item.brand}</p>
					{/if}
				</div>
				<div class="text-right">
					<p class="text-2xl font-black text-orange-600 dark:text-orange-400">{item.selling_price != null ? `₹${item.selling_price}` : '—'}</p>
					{#if item.mrp && item.mrp !== item.selling_price}
						<p class="text-xs text-gray-400 line-through">₹{item.mrp}</p>
					{/if}
				</div>
			</div>

			<!-- Meta badges -->
			<div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
				{#if reviews.length}
					<span class="flex items-center gap-1 text-yellow-500">
						<Icon icon="mdi:star" width="14" height="14" /> {avgRating()} <span class="text-gray-400">({reviews.length})</span>
					</span>
				{/if}
				{#if item.nos != null}
					<span class={`flex items-center gap-1 ${item.nos < 10 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
						<Icon icon="mdi:package-variant-closed" width="14" height="14" />
						{item.nos < 10 ? 'Low Stock' : 'In Stock'} ({item.nos})
					</span>
				{/if}
				{#if item.sold_via_platform}
					<span class="rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-orange-600 dark:text-orange-400 font-bold">
						Sold via NearBuy
					</span>
				{/if}
				{#if item.status}
					<span class={`rounded-full px-2 py-0.5 font-bold capitalize ${item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
						{item.status}
					</span>
				{/if}
			</div>
		</div>

		<!-- About -->
		{#if item.description}
			<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h3 class="mb-2 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<Icon icon="mdi:text-box-outline" width="16" height="16" class="text-orange-500" /> About
				</h3>
				<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>
			</div>
		{/if}

		<!-- Details grid -->
		<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h3 class="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
				<Icon icon="mdi:information-outline" width="16" height="16" class="text-orange-500" /> Item Details
			</h3>
			<div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
				{#each [
					['Item No.', `#${item.item_nos ?? item.id}`],
					['Brand', item.brand],
					['Selling Price', item.selling_price != null ? `₹${item.selling_price}` : null],
					['MRP', item.mrp != null ? `₹${item.mrp}` : null],
					['Stock (nos)', item.nos],
					['Via Platform', item.sold_via_platform ? 'Yes' : 'No'],
					['Status', item.status],
					['Created', item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : null],
				] as [lbl, val]}
					{#if val != null}
						<div>
							<p class="text-[10px] font-black uppercase tracking-wider text-gray-400">{lbl}</p>
							<p class="mt-0.5 font-semibold text-gray-800 dark:text-gray-200 capitalize">{val}</p>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Reviews -->
		<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<Icon icon="mdi:star-outline" width="16" height="16" class="text-orange-500" />
					Reviews <span class="text-xs font-medium text-gray-400 ml-1">({reviews.length})</span>
				</h3>
			</div>

			{#if reviews.length === 0}
				<p class="text-sm italic text-gray-400">No reviews yet.</p>
			{:else}
				<div class="space-y-5">
					{#each reviews as review}
						<div class="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-0 last:pb-0">
							<!-- Reviewer row -->
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
										{(review.userid ?? review.user_id ?? 'U').toString()[0].toUpperCase()}
									</div>
									<div>
										<p class="text-sm font-bold text-gray-900 dark:text-white">
											User #{review.userid ?? review.user_id ?? '—'}
										</p>
										{#if review.created_at}
											<p class="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<!-- Star rating -->
									<div class="flex items-center gap-0.5">
										{#each Array(5) as _, i}
											<Icon icon={i < (review.rating ?? 0) ? 'mdi:star' : 'mdi:star-outline'} width="14" height="14" class={i < (review.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'} />
										{/each}
									</div>
									<!-- Delete review -->
									<button onclick={() => deleteReview(review.id)} disabled={deletingReviewId === review.id}
										class="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-60">
										{#if deletingReviewId === review.id}
											<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
										{:else}
											<Icon icon="mdi:trash-can-outline" width="14" height="14" />
										{/if}
									</button>
								</div>
							</div>

							<!-- Review text -->
							{#if review.comment ?? review.review_text}
								<p class="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
									{review.comment ?? review.review_text}
								</p>
							{/if}

							<!-- Review images -->
							{#if Array.isArray(review.review_imageurl) && review.review_imageurl.length}
								<div class="mt-3 flex gap-2 flex-wrap">
									{#each review.review_imageurl as imgPath}
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
										<img src={toDisplayUrl(imgPath)} alt="Review image"
											class="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
											onclick={() => (lightboxSrc = toDisplayUrl(imgPath))} />
									{/each}
								</div>
							{/if}

							<!-- Review videos -->
							{#if Array.isArray(review.review_videourl) && review.review_videourl.length}
								<div class="mt-3 flex gap-2 flex-wrap">
									{#each review.review_videourl as vidPath}
										<!-- svelte-ignore a11y_media_has_caption -->
										<video src={toDisplayUrl(vidPath)} controls
											class="h-32 rounded-xl border border-gray-200 dark:border-gray-700 object-cover"></video>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{/if}
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar { display: none; }
	.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
