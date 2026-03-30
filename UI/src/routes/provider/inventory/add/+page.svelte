<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let bizId   = $state('');
	let saving  = $state(false);
	let errorMsg  = $state('');
	let successMsg = $state('');

	// Form fields
	let productName   = $state('');
	let brand         = $state('');
	let sellingPrice  = $state('');
	let mrp           = $state('');
	let nos           = $state('');
	let description   = $state('');
	let soldViaPlatform = $state(false);

	// Image upload — up to 5 images
	let imageFiles    = $state([]);    // File objects
	let imagePreviews = $state([]);    // blob URLs for display
	let uploading     = $state(false);

	// ── Load bizId ────────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!res.ok) throw new Error('Not authenticated');
			const data = await res.json();
			bizId = data.profile?.biz_id ?? data.business?.id ?? data.biz_id ?? '';
			if (!bizId) throw new Error('No business ID. Register a business first.');
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load session.';
		}
	});

	// ── Image handling ────────────────────────────────────────────────────────
	function handleImagePick(e) {
		const files = Array.from(e.target.files ?? []);
		const remaining = 5 - imageFiles.length;
		const toAdd = files.slice(0, remaining);
		imageFiles = [...imageFiles, ...toAdd];
		imagePreviews = [...imagePreviews, ...toAdd.map(f => URL.createObjectURL(f))];
		e.target.value = ''; // reset input so same file can be re-picked
	}

	function removeImage(index) {
		imageFiles = imageFiles.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}

	// ── Submit ────────────────────────────────────────────────────────────────
	async function handleSubmit(e) {
		e.preventDefault();
		if (!productName.trim()) { errorMsg = 'Product name is required.'; return; }
		if (!sellingPrice) { errorMsg = 'Selling price is required.'; return; }
		if (!bizId) { errorMsg = 'Business ID not found.'; return; }

		errorMsg = ''; successMsg = ''; saving = true;

		try {
			// Step 1 — upload all images to R2
			uploading = true;
			const uploadedPaths = await Promise.all(
				imageFiles.map(file =>
					uploadToUniversalApi({ type: 'business-item', bizId, file })
						.then(r => r.path)
				)
			);
			uploading = false;

			// Step 2 — POST item to database
			const payload = {
				product_name:     productName.trim(),
				brand:            brand.trim()       || undefined,
				selling_price:    Number(sellingPrice),
				mrp:              mrp ? Number(mrp) : undefined,
				nos:              nos ? Number(nos) : undefined,
				description:      description.trim() || undefined,
				sold_via_platform: soldViaPlatform ? 1 : 0,
				image:            uploadedPaths.length ? uploadedPaths : undefined
			};

			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/items`, {
				method:      'POST',
				credentials: 'include',
				headers:     { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body:        JSON.stringify(payload)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.message ?? `Failed to add item (${res.status})`);
			}

			successMsg = 'Item added successfully!';
			// Reset form
			productName = ''; brand = ''; sellingPrice = ''; mrp = '';
			nos = ''; description = ''; soldViaPlatform = false;
			imageFiles = []; imagePreviews = [];
			setTimeout(() => window.location.href = '/provider/inventory', 1500);
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to add item.';
		} finally {
			saving = false; uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Add Item — NearBuy Inventory</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/provider/inventory" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="16" height="16" /> Inventory
		</a>
		<h1 class="flex-1 font-bold text-gray-900 dark:text-white">Add New Item</h1>
	</header>

	<form onsubmit={handleSubmit} class="mx-auto max-w-xl px-4 py-6 space-y-5">

		<!-- Banners -->
		{#if errorMsg}
			<div class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500">
				<Icon icon="mdi:alert-circle-outline" width="16" height="16" class="shrink-0" />{errorMsg}
			</div>
		{/if}
		{#if successMsg}
			<div class="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-xs font-bold text-green-600 dark:text-green-400">
				<Icon icon="mdi:check-circle-outline" width="16" height="16" class="shrink-0" />{successMsg}
			</div>
		{/if}

		<!-- Images -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
			<h3 class="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
				<Icon icon="mdi:image-multiple-outline" width="16" height="16" class="text-orange-500" /> Product Images
				<span class="text-xs font-medium text-gray-400">(up to 5)</span>
			</h3>

			<!-- Preview strip -->
			{#if imagePreviews.length > 0}
				<div class="mb-3 flex gap-2 flex-wrap">
					{#each imagePreviews as preview, i}
						<div class="relative group">
							<img src={preview} alt="Preview" class="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
							<button type="button" onclick={() => removeImage(i)}
								class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
								<Icon icon="mdi:close" width="12" height="12" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if imageFiles.length < 5}
				<label for="item-images"
					class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-all">
					<Icon icon="mdi:cloud-upload-outline" width="20" height="20" />
					{imagePreviews.length ? 'Add more images' : 'Upload images'}
				</label>
				<input id="item-images" type="file" accept="image/*" multiple class="hidden" onchange={handleImagePick} />
			{/if}
		</div>

		<!-- Core info -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
			<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:package-variant" width="16" height="16" class="text-orange-500" /> Core Details
			</h3>

			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="product-name">
					Product Name <span class="text-red-500">*</span>
				</label>
				<input id="product-name" type="text" bind:value={productName} required placeholder="e.g. Cotton T-Shirt"
					class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
			</div>

			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-brand">Brand</label>
				<input id="item-brand" type="text" bind:value={brand} placeholder="e.g. NearBuy"
					class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
			</div>

			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-desc">Description</label>
				<textarea id="item-desc" bind:value={description} rows="3" placeholder="Describe the product..."
					class="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"></textarea>
			</div>
		</div>

		<!-- Pricing + Stock -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
			<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:currency-inr" width="16" height="16" class="text-orange-500" /> Pricing & Stock
			</h3>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="selling-price">
						Selling Price <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
						<input id="selling-price" type="number" min="0" step="0.01" bind:value={sellingPrice} required placeholder="499"
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-7 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all" />
					</div>
				</div>
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-mrp">MRP</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
						<input id="item-mrp" type="number" min="0" step="0.01" bind:value={mrp} placeholder="599"
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-7 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all" />
					</div>
				</div>
			</div>
			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-nos">Stock (nos / units)</label>
				<input id="item-nos" type="number" min="0" bind:value={nos} placeholder="e.g. 100"
					class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
			</div>

			<!-- Platform toggle -->
			<div class="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
				<div>
					<p class="font-bold text-sm text-gray-900 dark:text-white">Sold via NearBuy Platform</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enable in-platform ordering for this item</p>
				</div>
				<button type="button" onclick={() => (soldViaPlatform = !soldViaPlatform)}
					aria-label="Toggle platform selling"
					class={`relative h-7 w-14 rounded-full transition-colors shadow-inner shrink-0 ${soldViaPlatform ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
					<span class={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${soldViaPlatform ? 'left-8' : 'left-1'}`}></span>
				</button>
			</div>
		</div>

		<!-- Submit -->
		<button type="submit" disabled={saving || !bizId}
			class="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-60">
			{#if uploading}
				<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" /> Uploading images…
			{:else if saving}
				<Icon icon="mdi:loading" width="18" height="18" class="animate-spin" /> Saving…
			{:else}
				<Icon icon="mdi:plus-circle-outline" width="18" height="18" /> Add Item
			{/if}
		</button>

	</form>
</div>
