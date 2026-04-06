<script>
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';
	import { getCurrentUserId } from '$lib/stores/auth.svelte.js';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let form = $state({
		title: '',
		description: '',
		address1: '',
		address2: '',
		city: '',
		district: '',
		state: '',
		pincode: '',
		lat: '',
		lng: '',
		minBudget: '',
		maxBudget: '',
		attachments: []
	});

	let pincodeResults = $state([]);
	let isSearchingPincode = $state(false);
	let pincodeError = $state('');

	async function searchPincode() {
		if (String(form.pincode).length !== 6) return;
		isSearchingPincode = true;
		pincodeResults = [];
		pincodeError = '';

		try {
			const response = await fetch(`${API_BASE_URL}/api/pincodes/${form.pincode}`, {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				pincodeResults = Array.isArray(data.data) ? data.data : [data.data];
			} else {
				pincodeError = 'Pincode not found';
			}
		} catch (err) {
			console.error('Pincode fetch error:', err);
		} finally {
			isSearchingPincode = false;
		}
	}

	function applyPincodeResult(res) {
		form.city = res.city;
		form.district = res.district;
		form.state = res.state;
		pincodeResults = [];
	}

	let categoryPath = $state([]);
	let categoryError = $state('');
	let showMapPicker = $state(false);
	let pickerMarker = $state([]);
	let geocoding = $state(false);
	let pickerCenter = $state([80.2707, 13.0827]);
	let mapRef = $state(null);
	let locating = $state(false);

	function openMapPicker() {
		// If lat/lng already set, center map there
		if (form.lat && form.lng) {
			const lat = parseFloat(form.lat);
			const lng = parseFloat(form.lng);
			if (!isNaN(lat) && !isNaN(lng)) {
				pickerCenter = [lng, lat];
				pickerMarker = [{ id: 'picked', lat, lng: lng, type: 'shop', label: '📍' }];
			}
		}
		showMapPicker = true;
	}

	function handleMapReady(map) {
		mapRef = map;
		map.on('click', async (e) => {
			const { lng, lat } = e.lngLat;
			pickerMarker = [{ id: 'picked', lat, lng, type: 'shop', label: '📍' }];
			await reverseGeocode(lat, lng);
		});
	}

	async function reverseGeocode(lat, lng) {
		geocoding = true;
		form.lat = lat.toFixed(6);
		form.lng = lng.toFixed(6);
		// Address fields will be filled using pincode search (your API)
		geocoding = false;
	}

	function confirmLocation() {
		showMapPicker = false;
	}

	async function useMyLocation() {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				pickerCenter = [lng, lat];
				pickerMarker = [{ id: 'picked', lat, lng, type: 'user', label: '📍' }];
				if (mapRef) mapRef.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
				await reverseGeocode(lat, lng);
				locating = false;
			},
			(err) => {
				console.error('Geolocation error:', err);
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}
	
	const allCategories = {
		'Product': {
			'Electronics': {
				'TV': {
					'MI': ['32 INCH', '43 INCH', '55 INCH'],
					'Samsung': ['43 INCH', '55 INCH', '65 INCH'],
					'LG': ['43 INCH', '55 INCH']
				},
				'Mobiles': {
					'Apple': ['iPhone 13', 'iPhone 14', 'iPhone 15'],
					'Samsung': ['S23', 'S24']
				},
				'Accessories': ['Cases', 'Chargers', 'Headphones']
			},
			'Fashion': {
				'Men': ['Shirts', 'T-Shirts', 'Trousers'],
				'Women': ['Sarees', 'Kurtas', 'Dresses']
			},
			'Groceries': {
				'Staples': ['Rice', 'Dal', 'Flour'],
				'Snacks': ['Chips', 'Biscuits']
			},
			'Furniture': {
				'Living Room': ['Sofas', 'TV Units'],
				'Bedroom': ['Beds', 'Wardrobes']
			}
		},
		'Service': {
			'Repair': ['Mobile Repair', 'Appliance Repair', 'Plumbing'],
			'Cleaning': ['Home Cleaning', 'Car Wash'],
			'Salon': ['Haircut', 'Facial', 'Massage']
		}
	};

	function getCurrentCategoryOptions() {
		let current = allCategories;
		for (const key of categoryPath) {
			if (current[key]) {
				current = current[key];
			} else {
				return [];
			}
		}
		return Array.isArray(current) ? current : Object.keys(current);
	}

	let submitError = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit(e) {
		e.preventDefault();
		
		if (categoryPath.length === 0) {
			categoryError = 'Please select at least one category.';
			return;
		}
		
		const budget = form.minBudget && form.maxBudget ? `₹${form.minBudget} - ₹${form.maxBudget}` : form.minBudget ? `Above ₹${form.minBudget}` : '';

		categoryError = '';
		submitError = '';
		isSubmitting = true;

		try {
			// First, post the requirement without attachments so we get the requestId
			const payload = {
				description: { title: form.title, detail: form.description, budget },
				category: [categoryPath[0] || ''],
				sub_categories: categoryPath.slice(1),
				lat: parseFloat(form.lat) || 13.0827,
				lng: parseFloat(form.lng) || 80.2707,
				address: `${form.address1}${form.address2 ? ', ' + form.address2 : ''}`,
				city: form.city,
				district: form.district,
				pincode: form.pincode
			};

			const response = await fetch(`${API_BASE_URL}/api/requests`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || err.error || 'Failed to post requirement');
			}

			const result = await response.json();
			const reqId = result.id;

			// Handle Attachments
			const files = document.getElementById('req-attachments').files;
			if (files && files.length > 0) {
				for (const file of files) {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('type', 'request-attachment');
					formData.append('requestId', reqId);

					await fetch(`${API_BASE_URL}/api/upload`, {
						method: 'POST',
						credentials: 'include',
						body: formData
					});
				}
			}

			window.location.href = `/user/radar-search?id=${reqId}`;
		} catch (error) {
			console.error('Submit error', error);
			submitError = error.message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Post Requirement — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white pb-10">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="font-bold flex-1">Post a Requirement</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Title -->
			<div>
				<label class="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300" for="req-title">What do you need?</label>
				<input
					id="req-title"
					type="text"
					bind:value={form.title}
					placeholder="e.g., Need a plumber for pipe leak at home"
					class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-500 focus:outline-none shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
					required
				/>
			</div>

			<!-- Dynamic Categories -->
			<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<p class="mb-3 block text-sm font-bold text-gray-700 dark:text-gray-300">Category</p>
				
				<!-- Breadcrumbs -->
				{#if categoryPath.length > 0}
					<div class="flex flex-wrap items-center gap-1.5 mb-3 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
						<button type="button" onclick={() => categoryPath = []} class="text-xs font-bold text-orange-600 hover:underline">Start</button>
						{#each categoryPath as pathItem, i}
							<span class="text-gray-400 text-xs shadow-sm">›</span>
							<button type="button" onclick={() => categoryPath = categoryPath.slice(0, i + 1)} class={`text-xs font-bold hover:underline ${i === categoryPath.length - 1 ? 'text-gray-900 dark:text-white' : 'text-orange-500'}`}>
								{pathItem}
							</button>
						{/each}
					</div>
				{/if}

				<div class="flex flex-wrap gap-2">
					{#each getCurrentCategoryOptions() as cat}
						<button
							type="button"
							onclick={() => categoryPath = [...categoryPath, cat]}
							class="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400 dark:hover:bg-orange-500/10"
						>{cat}</button>
					{/each}
					{#if getCurrentCategoryOptions().length === 0}
						<p class="text-sm text-green-600 dark:text-green-500 font-bold bg-green-50 dark:bg-green-500/10 p-2.5 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">✅ Deepest category selected</p>
					{/if}
				</div>
				{#if categoryError}
					<p class="mt-3 text-sm font-bold text-red-500">{categoryError}</p>
				{/if}
			</div>

			<!-- Budget (Only for Products) -->
			{#if categoryPath[0] === 'Product'}
			<div class="animate-in slide-in-from-top-2 duration-300">
				<div class="mb-1.5 flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
					<span>Budget Range</span>
					<span class="text-xs text-orange-500 font-normal">Optional</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="relative w-full">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
						<input
							type="number"
							bind:value={form.minBudget}
							placeholder="Min"
							class="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-500 focus:outline-none shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
					<span class="text-gray-400 text-sm font-medium">to</span>
					<div class="relative w-full">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
						<input
							type="number"
							bind:value={form.maxBudget}
							placeholder="Max"
							class="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-500 focus:outline-none shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				</div>
			</div>
			{/if}

			<!-- Description -->
			<div>
				<label class="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300" for="req-description">Describe in detail</label>
				<textarea
					id="req-description"
					bind:value={form.description}
					placeholder="Tell businesses exactly what you need, quantity, any specific requirements..."
					rows="4"
					class="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-500 focus:outline-none shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
					required
				></textarea>
			</div>

			<!-- Expanded Location -->
			<div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h3 class="font-bold text-sm text-gray-700 dark:text-gray-300 mb-1">Location</h3>
				
				<input
					type="text"
					bind:value={form.address1}
					placeholder="Address Line 1"
					class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
					required
				/>
				<input
					type="text"
					bind:value={form.address2}
					placeholder="Address Line 2 (Optional)"
					class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
				/>
				
				<div class="grid grid-cols-2 gap-3">
					<input
						type="text"
						bind:value={form.city}
						placeholder="City"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
					/>
					<input
						type="text"
						bind:value={form.district}
						placeholder="District"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
					/>
				</div>

				<div class="grid grid-cols-1 gap-3">
					<input
						type="text"
						bind:value={form.state}
						placeholder="State"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
					/>
				</div>
				
				<div class="relative">
					<input
						type="number"
						bind:value={form.pincode}
						placeholder="Pincode"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white pr-10"
						required
					/>
					<button type="button" onclick={searchPincode} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
						{#if isSearchingPincode}
							<span class="loader-sm w-4 h-4"></span>
						{:else}
							🔍
						{/if}
					</button>
				</div>

				{#if pincodeError}
					<p class="text-[10px] font-bold text-red-500 animate-in">{pincodeError}</p>
				{/if}

				{#if pincodeResults.length > 0}
					<div class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
						<p class="text-[10px] font-bold text-orange-400 uppercase tracking-widest pl-1">Choose your location:</p>
						{#each pincodeResults as res}
							<button 
								type="button" 
								onclick={() => applyPincodeResult(res)} 
								class="w-full flex flex-col items-start p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-orange-500 hover:bg-orange-500/5 transition-all text-left group"
							>
								<span class="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">📍 {res.city}</span>
								<span class="text-[10px] text-gray-500 mt-0.5 uppercase font-semibold">{res.district}, {res.state}</span>
							</button>
						{/each}
					</div>
				{/if}
				
				<div class="grid grid-cols-2 gap-3">
					<input
						type="text"
						bind:value={form.lat}
						placeholder="Latitude"
						readonly
						class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white cursor-not-allowed"
					/>
					<input
						type="text"
						bind:value={form.lng}
						placeholder="Longitude"
						readonly
						class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white cursor-not-allowed"
					/>
				</div>
				<p class="text-xs text-gray-400 dark:text-gray-500 -mt-2">📌 Use the map picker below to auto-fill coordinates</p>
				
				<button
					type="button"
					onclick={openMapPicker}
					class="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-orange-500 py-2.5 font-bold text-orange-500 transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10"
				>
					🗺️ Open in map for exact coordinates
				</button>

				{#if form.lat && form.lng}
					<p class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-lg p-2 text-center font-medium">
						📍 {form.lat}, {form.lng} — {form.district || form.city}{form.state ? `, ${form.state}` : ''}{form.pincode ? ` - ${form.pincode}` : ''}
					</p>
				{/if}
			</div>

			<!-- Attachments -->
			<div>
				<p class="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Attachments (optional)</p>
				<label
					for="req-attachments"
					class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white py-8 text-sm font-medium text-gray-500 transition-colors shadow-sm hover:border-orange-500 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-orange-500"
				>
					<span class="text-3xl mb-1">📎</span>
					<span>Upload images about requirements</span>
				</label>
				<input id="req-attachments" type="file" multiple accept="image/*,.pdf" class="hidden" />
			</div>

			<!-- Error Output -->
			{#if submitError}
				<div class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
					🚨 {submitError}
				</div>
			{/if}

			<!-- Submit -->
			<button
				id="btn-search-provider"
				type="submit"
				disabled={isSubmitting}
				class={`w-full rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 py-4 text-lg font-bold text-white shadow-[0_8px_32px_-4px_rgba(249,115,22,0.55)] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_12px_36px_-4px_rgba(249,115,22,0.65)] active:translate-y-0'}`}
			>
				{#if isSubmitting}
					<span class="loader-sm w-4 h-4 mr-2"></span> Posting Requirement...
				{:else}
					🔍 Search Business
				{/if}
			</button>
		</form>
	</div>
</div>

<!-- Map Picker Modal -->
{#if showMapPicker}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-9999 flex flex-col bg-white dark:bg-gray-950" onclick={(e) => e.stopPropagation()}>
		<!-- Modal Header -->
		<div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-white dark:bg-gray-950">
			<button type="button" onclick={() => showMapPicker = false} class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium text-sm">✕ Cancel</button>
			<h2 class="font-bold text-sm">Tap to pick location</h2>
			<button
				type="button"
				onclick={confirmLocation}
				disabled={!form.lat}
				class="text-sm font-bold text-orange-500 disabled:text-gray-300 disabled:dark:text-gray-700"
			>Confirm</button>
		</div>

		<!-- Info Banner -->
		{#if geocoding || locating}
			<div class="bg-orange-50 dark:bg-orange-500/10 px-4 py-2 text-center text-xs font-medium text-orange-600 dark:text-orange-400 border-b border-orange-100 dark:border-orange-900">
				⏳ {locating ? 'Getting your location...' : 'Fetching address details...'}
			</div>
		{:else if form.lat && form.lng}
			<div class="bg-green-50 dark:bg-green-500/10 px-4 py-2 text-center text-xs font-medium text-green-700 dark:text-green-400 border-b border-green-100 dark:border-green-900">
				📍 {form.lat}, {form.lng}{form.pincode ? ` • Pincode: ${form.pincode}` : ''}{form.district ? ` • ${form.district}` : ''}{form.state ? `, ${form.state}` : ''}
			</div>
		{:else}
			<div class="bg-blue-50 dark:bg-blue-500/10 px-4 py-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900">
				👆 Tap anywhere on the map or use your live location
			</div>
		{/if}

		<!-- Map -->
		<div class="flex-1 relative min-h-0">
			<NearBuyMap
				center={pickerCenter}
				zoom={14}
				markers={pickerMarker}
				interactive={true}
				showControls={true}
				showGeolocate={false}
				height="100%"
				className="h-full"
				onMapReady={handleMapReady}
			/>
			<!-- Use My Location FAB -->
			<button
				type="button"
				onclick={useMyLocation}
				disabled={locating}
				class="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-lg border border-gray-200 transition-all hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
			>
				{#if locating}
					<span class="animate-spin">⏳</span> Locating...
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
					Use my location
				{/if}
			</button>
		</div>

		<!-- Extracted Details -->
		{#if form.lat}
			<div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 max-h-40 overflow-y-auto">
				<div class="grid grid-cols-3 gap-2 text-xs">
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
						<span class="block text-gray-400 text-[10px] font-bold uppercase">Pincode</span>
						<span class="font-bold text-gray-900 dark:text-white">{form.pincode || '—'}</span>
					</div>
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
						<span class="block text-gray-400 text-[10px] font-bold uppercase">District</span>
						<span class="font-bold text-gray-900 dark:text-white">{form.district || '—'}</span>
					</div>
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
						<span class="block text-gray-400 text-[10px] font-bold uppercase">State</span>
						<span class="font-bold text-gray-900 dark:text-white">{form.state || '—'}</span>
					</div>
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
						<span class="block text-gray-400 text-[10px] font-bold uppercase">Latitude</span>
						<span class="font-bold text-gray-900 dark:text-white">{form.lat}</span>
					</div>
					<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
						<span class="block text-gray-400 text-[10px] font-bold uppercase">Longitude</span>
						<span class="font-bold text-gray-900 dark:text-white">{form.lng}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
