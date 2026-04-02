<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	const itemId = $page.params.id;

	// ── State ─────────────────────────────────────────────────────────────────
	let bizId        = $state('');
	let item         = $state(null);
	let loading      = $state(true);
	let saving       = $state(false);
	let uploading    = $state(false);
	let errorMsg     = $state('');
	let successMsg   = $state('');

	// Form fields matching DJ.md §4.4 PATCH payload
	let productName    = $state('');
	let itemType       = $state('product');
	let brand          = $state('');
	let description    = $state('');
	let category       = $state('');
	let specRows       = $state([{ key: '', value: '' }]); // Key-value pairs for specifications

	// Image state — existing paths + new file uploads
	let existingImages = $state([]);   // current R2 paths from API
	let newImageFiles  = $state([]);   // new File objects to upload
	let newPreviews    = $state([]);   // blob URLs for new files

	// ── Load item + bizId ─────────────────────────────────────────────────────
	let availableCategories = $state([]);
	// ── Load item + bizId ─────────────────────────────────────────────────────
	onMount(async () => {
		const unroll = (val) => {
			if (!val) return [];
			if (typeof val === 'string') {
				const trimmed = val.trim();
				if (trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.includes(':'))) {
					try {
						let parsed;
						try { parsed = JSON.parse(trimmed); } catch(e) { parsed = JSON.parse(trimmed.replace(/'/g, '"')); }
						return unroll(parsed);
					} catch(e) { return [trimmed]; }
				}
				return trimmed ? [trimmed] : [];
			}
			if (Array.isArray(val)) return val.flatMap(v => unroll(v));
			return [val];
		};

		try {
			// 1. Get bizId from /api/me (DJ.md §2.1)
			const me = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!me.ok) throw new Error('Not authenticated');
			const meData = await me.json();
			bizId = meData.biz_id ?? meData.profile?.biz_id ?? meData.business?.id ?? '';
			if (!bizId) throw new Error('No business ID found.');

			// 2. GET /api/items/[itemId] (Unified endpoint)
			const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!res.ok) throw new Error(`Item not found (${res.status})`);
			const data = await res.json();
			item = data.item ?? data.data ?? data;

			// Populate form from API response
			productName    = item.product_name  ?? '';
			itemType       = item.item_type      ?? 'product';
			brand          = item.brand          ?? '';
			description    = item.description    ?? '';

			// Load categories
			const cRes = await fetch(`${API_BASE_URL}/api/categories`);
			if (cRes.ok) availableCategories = await cRes.json();
			category       = item.category       ?? '';
			
			// Robust unroll for images
			existingImages = unroll(item.image ?? item.images ?? []);
			
			// Parse specifications
			try {
				const sRaw = item.specification || item.specs || '{}';
				const sData = typeof sRaw === 'string' ? JSON.parse(sRaw) : sRaw;
				if (sData && typeof sData === 'object' && !Array.isArray(sData)) {
					specRows = Object.entries(sData).map(([k, v]) => ({ key: k, value: v }));
				}
				if (specRows.length === 0) specRows = [{ key: '', value: '' }];
			} catch(e) {
				specRows = [{ key: '', value: '' }];
			}
			

		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load item.';
		} finally {
			loading = false;
		}
	});

	// ── New image handling ────────────────────────────────────────────────────
	function handleImagePick(e) {
		const files = Array.from(e.target.files ?? []);
		const remaining = 5 - existingImages.length - newImageFiles.length;
		const toAdd = files.slice(0, remaining);
		newImageFiles = [...newImageFiles, ...toAdd];
		newPreviews   = [...newPreviews,   ...toAdd.map(f => URL.createObjectURL(f))];
		e.target.value = '';
	}

	function removeExisting(index) {
		existingImages = existingImages.filter((_, i) => i !== index);
	}

	function handleRemoveExisting(index) {
		existingImages = existingImages.filter((_, i) => i !== index);
	}

	// ── Specifications ────────────────────────────────────────────────────────
	function addSpecRow() {
		specRows = [...specRows, { key: '', value: '' }];
	}

	function removeSpecRow(index) {
		specRows = specRows.filter((_, i) => i !== index);
		if (specRows.length === 0) specRows = [{ key: '', value: '' }];
	}


	function removeNew(index) {
		newImageFiles = newImageFiles.filter((_, i) => i !== index);
		newPreviews   = newPreviews.filter((_, i) => i !== index);
	}

	// ── Categories ────────────────────────────────────────────────────────────
	function handleSubCategoryKeyDown(e) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const val = subCategoryInput.trim();
			if (val && !subCategories.includes(val)) {
				subCategories = [...subCategories, val];
			}
			subCategoryInput = '';
		}
	}

	function removeSubCategory(index) {
		subCategories = subCategories.filter((_, i) => i !== index);
	}

	// ── Submit: PATCH /api/businesses/[bizId]/items/[itemId] (DJ.md §4.4) ────
	async function handleSubmit(e) {
		e.preventDefault();
		if (!productName.trim()) { errorMsg = 'Product name is required.'; return; }
		if (!category.trim())    { errorMsg = 'Category is required.'; return; }
		errorMsg = ''; successMsg = ''; saving = true;

		try {
			// Step 1 — upload new images if any
			let uploadedPaths = [];
			if (newImageFiles.length > 0) {
				uploading = true;
				uploadedPaths = await Promise.all(
					newImageFiles.map((file, idx) =>
						uploadToUniversalApi({ 
							type: 'business-item', 
							bizId, 
							itemId, 
							file, 
							imageName: `item_${Date.now()}_${idx}` // Ensure unique keys in R2
						}).then(r => r.path)
					)
				);
				uploading = false;
			}

			// Combine: keep existing + add newly uploaded
			const finalImages = [...existingImages, ...uploadedPaths];

			// Step 2 — PATCH payload (DJ.md §4.4, only send changed fields)
			// Convert specifications array to object
			const specsObj = {};
			specRows.forEach(row => {
				if (row.key.trim() && row.value.trim()) {
					specsObj[row.key.trim()] = row.value.trim();
				}
			});

			// Step 2 — PATCH payload (DJ.md §4.4, only send changed fields)
			const payload = {
				product_name:      productName.trim()    || undefined,
				item_type:         itemType              || undefined,
				brand:             brand.trim()          || undefined,
				description:       description.trim()    || undefined,
				category:          category.trim()       || undefined,
				image:             finalImages,    // Send as raw array
				specification:     specsObj        // Send as raw object
			};

			const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
				method:      'PATCH',
				credentials: 'include',
				headers:     { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body:        JSON.stringify(payload)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.message ?? `Update failed (${res.status})`);
			}

			successMsg = 'Item updated successfully!';
			setTimeout(() => window.location.href = `/provider/inventory/${itemId}`, 1500);
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to update item.';
		} finally {
			saving = false; uploading = false;
		}
	}

	const totalImages = $derived(existingImages.length + newImageFiles.length);
</script>

<svelte:head>
	<title>Edit Item — NearBuy Inventory</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href={`/provider/inventory/${itemId}`} class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="16" height="16" /> Cancel
		</a>
		<h1 class="flex-1 font-bold text-gray-900 dark:text-white">Edit Item</h1>
	</header>

	{#if loading}
		<div class="mx-auto max-w-xl px-4 py-10 space-y-4">
			{#each [1, 2, 3, 4] as _}
				<div class="h-12 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
			{/each}
		</div>
	{:else}
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
					<Icon icon="mdi:image-multiple-outline" width="16" height="16" class="text-orange-500" />
					Product Images
					<span class="text-xs font-medium text-gray-400">({totalImages}/5)</span>
				</h3>

				<div class="flex flex-wrap gap-2 mb-3">
					<!-- Existing images -->
					{#each existingImages as path, i}
						<div class="relative group">
							<img src={toDisplayUrl(path)} alt="Item" class="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
							<button type="button" onclick={() => removeExisting(i)}
								class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
								<Icon icon="mdi:close" width="12" height="12" />
							</button>
						</div>
					{/each}

					<!-- New image previews -->
					{#each newPreviews as preview, i}
						<div class="relative group">
							<img src={preview} alt="New" class="h-20 w-20 rounded-xl object-cover border-2 border-orange-400 dark:border-orange-500" />
							<button type="button" onclick={() => removeNew(i)}
								class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
								<Icon icon="mdi:close" width="12" height="12" />
							</button>
							<span class="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-orange-500 text-white rounded-b-xl py-0.5">NEW</span>
						</div>
					{/each}
				</div>

				{#if totalImages < 5}
					<label for="edit-images"
						class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-all">
						<Icon icon="mdi:cloud-upload-outline" width="20" height="20" />
						{totalImages > 0 ? 'Add more images' : 'Upload images'}
					</label>
					<input id="edit-images" type="file" accept="image/*" multiple class="hidden" onchange={handleImagePick} />
				{/if}
			</div>

			<!-- Core details -->
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
				<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
					<Icon icon="mdi:package-variant" width="16" height="16" class="text-orange-500" /> Core Details
				</h3>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="edit-product-name">
							Product Name <span class="text-red-500">*</span>
						</label>
						<input id="edit-product-name" type="text" bind:value={productName} required
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
					</div>
					<div>
						<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="edit-item-type">Item Type</label>
						<select id="edit-item-type" bind:value={itemType} class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all">
							<option value="product">Product</option>
							<option value="service">Service</option>
						</select>
					</div>
				</div>

				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="edit-brand">Brand</label>
					<input id="edit-brand" type="text" bind:value={brand} placeholder="e.g. Samsung"
						class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
				</div>

				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="edit-desc">Description</label>
					<textarea id="edit-desc" bind:value={description} rows="3"
						class="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"></textarea>
				</div>
			</div>



			<!-- Specifications -->
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
				<div class="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
					<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
						<Icon icon="mdi:list-status" width="16" height="16" class="text-orange-500" /> Specifications
					</h3>
					<button type="button" onclick={addSpecRow} class="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 hover:underline">
						+ Add Row
					</button>
				</div>
				<div class="space-y-3">
					{#each specRows as row, i}
						<div class="flex items-center gap-2">
							<input type="text" bind:value={row.key} placeholder="Label (e.g. Color)"
								class="w-1/3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
							<input type="text" bind:value={row.value} placeholder="Value (e.g. Red)"
								class="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all" />
							<button type="button" onclick={() => removeSpecRow(i)} class="text-gray-400 hover:text-red-500">
								<Icon icon="mdi:close-circle-outline" width="16" height="16" />
							</button>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
				<h3 class="flex items-center gap-2 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
					<Icon icon="mdi:tag-outline" width="16" height="16" class="text-orange-500" /> Category
				</h3>
				
				<div class="grid grid-cols-1">
					<div>
						<select id="edit-category" bind:value={category} required
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all">
							<option value="">Select Category</option>
							{#each availableCategories as cat}
								<option value={cat.name}>{cat.name}</option>
							{/each}
						</select>
					</div>
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
					<Icon icon="mdi:content-save-outline" width="18" height="18" /> Save Changes
				{/if}
			</button>
		</form>
	{/if}
</div>
