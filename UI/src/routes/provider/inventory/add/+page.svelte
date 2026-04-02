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
	let itemType      = $state('product'); // 'product' or 'service'
	let category      = $state('');
	let brand         = $state('');
	let description   = $state('');
	let specRows      = $state([{key: '', value: ''}]);

	// Image upload — up to 5 images
	let imageFiles    = $state([]);    // File objects
	let imagePreviews = $state([]);    // blob URLs for display
	let uploading     = $state(false);

	// ── Load bizId ────────────────────────────────────────────────────────────
	let availableCategories = $state([]);

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

			// Load categories
			const cRes = await fetch(`${API_BASE_URL}/api/categories`);
			if (cRes.ok) availableCategories = await cRes.json();
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

	function addSpecRow() {
		specRows = [...specRows, {key: '', value: ''}];
	}

	function removeSpecRow(index) {
		specRows = specRows.filter((_, i) => i !== index);
	}



	// ── Submit ────────────────────────────────────────────────────────────────
	async function handleSubmit(e) {
		e.preventDefault();
		if (!productName.trim()) { errorMsg = 'Product name is required.'; return; }
		if (!category.trim()) { errorMsg = 'Main category is required.'; return; }
		if (!bizId) { errorMsg = 'Business ID not found.'; return; }

		errorMsg = ''; successMsg = ''; saving = true;

		try {
			// Generate a unique ID for the item BEFORE uploading so images route to correct folder
			const newItemId = 'itm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

			// Step 1 — upload all images to R2
			uploading = true;
			const uploadedPaths = await Promise.all(
				imageFiles.map((file, idx) =>
					uploadToUniversalApi({ 
						type: 'business-item', 
						bizId, 
						itemId: newItemId, 
						imageName: idx === 0 ? 'main' : `img_${idx}`, 
						file 
					}).then(r => r.path)
				)
			);
			uploading = false;

			let specs = {};
			for (const r of specRows) {
				if (r.key.trim() && r.value.trim()) specs[r.key.trim()] = r.value.trim();
			}

			// Step 2 — POST item to database
			const payload = {
				id:               newItemId,
				product_name:     productName.trim(),
				item_type:        itemType,
				category:         category.trim(),
				brand:            brand.trim()       || undefined,
				description:      description.trim() || undefined,
				specification:    Object.keys(specs).length ? JSON.stringify(specs) : undefined,
				image:            uploadedPaths.length ? JSON.stringify(uploadedPaths) : undefined
			};

			const res = await fetch(`${API_BASE_URL}/api/items`, {
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
			productName = ''; brand = ''; description = ''; itemType = 'product';
			category = '';
			specRows = [{key: '', value: ''}];
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

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="product-name">
						Product Name <span class="text-red-500">*</span>
					</label>
					<input id="product-name" type="text" bind:value={productName} required placeholder="e.g. Cotton T-Shirt"
						class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
				</div>
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-type">Item Type</label>
					<select id="item-type" bind:value={itemType} class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all">
						<option value="product">Product</option>
						<option value="service">Service</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="category">
						Category <span class="text-red-500">*</span>
					</label>
					<select id="category" bind:value={category} required
						class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all">
						<option value="">Select Category</option>
						{#each availableCategories as cat}
							<option value={cat.name}>{cat.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-brand">Brand</label>
					<input id="item-brand" type="text" bind:value={brand} placeholder="e.g. NearBuy"
						class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
				</div>
			</div>

			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="item-desc">Description</label>
				<textarea id="item-desc" bind:value={description} rows="3" placeholder="Describe the product..."
					class="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"></textarea>
			</div>
		</div>

		<!-- Specifications -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
			<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:list-status" width="16" height="16" class="text-orange-500" /> Specifications
			</h3>
			
			<div class="space-y-3">
				{#each specRows as row, i}
					<div class="flex items-center gap-2">
						<input type="text" bind:value={row.key} placeholder="Key (e.g. Color)" class="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none transition-all dark:text-white" />
						<input type="text" bind:value={row.value} placeholder="Value (e.g. Red)" class="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none transition-all dark:text-white" />
						<button type="button" onclick={() => removeSpecRow(i)} class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors dark:bg-red-500/10 dark:hover:bg-red-500">
							<Icon icon="mdi:close" width="16" height="16" />
						</button>
					</div>
				{/each}
				<button type="button" onclick={addSpecRow} class="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-all">
					<Icon icon="mdi:plus" width="16" height="16" /> Add Specification
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
