<script>
	import { goto } from '$app/navigation';
	import NearBuyMap from '$lib/components/NearBuyMap.svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { onMount } from 'svelte';
	import { registerBusiness } from '$lib/helpers/authApi.js';
	import Icon from '@iconify/svelte';

	// Module-level cache — survives SPA navigations, fetched at most once per session
	let _categoryCache = null;

	let step = $state(1);
	const totalSteps = 4;

	let form = $state({
		bizName: '',
		bizEmail: '',
		bizPhone: '',
		category: 'product',
		username: '',
		description: '',
		address: '',
		city: '',
		district: '',
		state: '',
		pincode: '',
		lat: '',
		long: '',
		founderName: '',
		founderPhone: '',
		founderEmail: '',
		password: ''
	});

	const allowedBusinessTypes = ['product', 'service', 'both'];
	let categoryOptions = $state([]);
	let selectedCategoryIds = $state([]);

	let categorySearch = $state('');
	let filteredCategories = $state([]);
	let categorySearching = $state(false);

	// Called ONLY once on first mount — fetches API and fills the module-level cache
	async function loadCategories() {
		if (_categoryCache) {
			categoryOptions = _categoryCache;
			filteredCategories = _categoryCache;
			return;
		}
		categorySearching = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/categories`, {
				headers: { 'Accept': 'application/json' },
				credentials: 'include'
			});
			if (res.ok) {
				const raw = await res.json();
				if (Array.isArray(raw)) {
					const mapped = raw.map(cat => ({
						id: cat.id || cat.name,
						label: cat.name,
						subCategories: (cat.subCategories || []).map(sub => ({
							id: sub.id || sub.name,
							label: sub.name
						}))
					}));
					_categoryCache = mapped;
					categoryOptions = mapped;
					filteredCategories = mapped;
				}
			}
		} catch (err) {
			console.error('Failed to load categories:', err);
		} finally {
			categorySearching = false;
		}
	}

	// Called by Search button / Enter — always in-memory, never hits the API
	function filterCategories() {
		if (!_categoryCache) return;
		const q = categorySearch.trim().toLowerCase();
		filteredCategories = q
			? _categoryCache.filter(opt => opt.label.toLowerCase().includes(q))
			: _categoryCache;
	}

	onMount(() => {
		loadCategories(); // API called exactly once per session
	});


	let kycDocs = $state({
		AADHAR: null,
		PAN: null,
		INCOME: null,
		GST: null,
		OTHER: null
	});

	let otherDocName = $state('');
	let extraOtherDocs = $state([]);
	
	let businessAvatarFile = $state(null);
	let businessAvatarPreview = $state('');
	
	let founderAvatarFile = $state(null);
	let founderAvatarPreview = $state('');

	let expandedCategoryIds = $state([]);

	function toggleCategoryExpansion(categoryId) {
		if (expandedCategoryIds.includes(categoryId)) {
			expandedCategoryIds = expandedCategoryIds.filter(id => id !== categoryId);
		} else {
			expandedCategoryIds.push(categoryId);
		}
	}

	function handleBusinessAvatar(e) {
		const file = e.target.files?.[0];
		if (file) {
			businessAvatarFile = file;
			businessAvatarPreview = URL.createObjectURL(file);
		}
	}

	function handleFounderAvatar(e) {
		const file = e.target.files?.[0];
		if (file) {
			founderAvatarFile = file;
			founderAvatarPreview = URL.createObjectURL(file);
		}
	}

	let pincodeResults = $state([]);
	let isSearchingPincode = $state(false);
	let lastSearchedPincode = $state('');
	let errorMsg = $state('');
	let loading = $state(false);
	let registrationSuccess = $state(false);

	function next() {
		errorMsg = '';

		if (step === 1) {
			if (!form.bizName?.trim()) {
				errorMsg = 'Business name is required.';
				return;
			}
			if (!form.bizEmail?.trim()) {
				errorMsg = 'Business email is required.';
				return;
			}
			if (!form.bizPhone?.trim()) {
				errorMsg = 'Business phone is required.';
				return;
			}
		} else if (step === 2) {
			if (!form.founderName?.trim()) {
				errorMsg = 'Founder name is required.';
				return;
			}
			if (!form.founderEmail?.trim()) {
				errorMsg = 'Email address is required.';
				return;
			}
			if (!form.founderPhone?.trim()) {
				errorMsg = 'Phone number is required.';
				return;
			}
		} else if (step === 3) {
			if (!form.password) {
				errorMsg = 'Password is required.';
				return;
			}
		} else if (step === 4) {
			if (!form.address?.trim()) {
				errorMsg = 'Shop address is required.';
				return;
			}
		}

		if (step < totalSteps) step++;
	}

	function prev() {
		errorMsg = '';
		if (step > 1) step--;
	}

	function handleDocUpload(docType, e) {
		const file = e.target.files?.[0] || null;
		kycDocs[docType] = file;
	}

	function addExtraOtherDoc() {
		extraOtherDocs.push({ name: '', file: null });
	}

	function removeExtraOtherDoc(index) {
		extraOtherDocs.splice(index, 1);
	}

	function handleExtraOtherFile(index, e) {
		const file = e.target.files?.[0] || null;
		extraOtherDocs[index].file = file;
	}

	function toggleCategoryId(categoryId) {
		if (selectedCategoryIds.includes(categoryId)) {
			selectedCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
			return;
		}
		selectedCategoryIds = [...selectedCategoryIds, categoryId];
	}

	async function searchPincode(pin) {
		const cleanPin = String(pin || '').replace(/\D+/g, '').slice(0, 6);
		if (cleanPin.length !== 6) return;
		if (cleanPin === lastSearchedPincode) return;

		isSearchingPincode = true;
		pincodeResults = [];
		lastSearchedPincode = cleanPin;

		try {
		const response = await fetch(`${API_BASE_URL}/api/pincodes/${cleanPin}`, {
				credentials: 'include'
			});
			if (!response.ok) {
				throw new Error('Pincode not found.');
			}

			const data = await response.json();
			pincodeResults = Array.isArray(data.data)
				? data.data
				: data.data
					? [data.data]
					: [];

			if (pincodeResults.length === 1) {
				applyPincodeResult(pincodeResults[0]);
			}
		} catch (err) {
			console.error('Pincode search failed:', err);
			errorMsg = err?.message || 'Unable to fetch pincode details.';
		} finally {
			isSearchingPincode = false;
		}
	}

	function applyPincodeResult(result) {
		form.city = result.city || form.city;
		form.district = result.district || result.city || form.district;
		form.state = result.state || form.state;
		if (result.lat != null && result.long != null) {
			form.lat = String(result.lat);
			form.long = String(result.long);
			if (mapRef) {
				mapRef.flyTo({ center: [Number(result.long), Number(result.lat)], duration: 700 });
			}
		}
		pincodeResults = [];
	}

	let mapRef = $state(null);
	let locating = $state(false);
	let geocoding = $state(false);

	async function reverseGeocode(lat, lng) {
		geocoding = true;
		form.lat = String(lat.toFixed(6));
		form.long = String(lng.toFixed(6));
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
				headers: { 'Accept-Language': 'en' }
			});
			if (res.ok) {
				const data = await res.json();
				if (data.address) {
					form.address = data.display_name || form.address;
					form.city = data.address.city || data.address.town || data.address.village || form.city;
					form.district = data.address.state_district || data.address.county || form.district;
					form.state = data.address.state || form.state;
					form.pincode = data.address.postcode || form.pincode;
				}
			}
		} catch (e) {
			console.warn('Reverse geocode failed', e);
		}
		geocoding = false;
	}

	function handleMapReady(map) {
		mapRef = map;
		map.on('click', async (e) => {
			const { lng, lat } = e.lngLat;
			if (mapRef) {
				mapRef.flyTo({ center: [lng, lat], duration: 500 });
			}
			await reverseGeocode(lat, lng);
		});
	}

	function useMyLocation() {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
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
	
	function getMapCenter() {
		if (form.long !== '' && form.lat !== '') {
			return [Number(form.long), Number(form.lat)];
		}
		return [80.2707, 13.0827];
	}

	function getMapMarkers() {
		if (form.long === '' || form.lat === '') return [];
		return [
			{
				id: 'shop-marker',
				lat: Number(form.lat),
				lng: Number(form.long),
				label: '📍'
			}
		];
	}



	$effect(() => {
		const cleanPin = String(form.pincode || '').replace(/\D+/g, '').slice(0, 6);
		if (form.pincode !== cleanPin) {
			form.pincode = cleanPin;
		}
		if (cleanPin.length === 6) {
			searchPincode(cleanPin);
		}
	});

	async function handleSubmit(e) {
		if (e) e.preventDefault();
		errorMsg = '';
		loading = true;

		try {


			const email = form.founderEmail?.trim();
			const password = form.password;
			const bname = form.bizName?.trim();
			const founderName = form.founderName?.trim();
			const btype = form.category;

			if (!email || !password || !bname || !founderName) {
				throw new Error('Business name, founder name, founder email, and password are required.');
			}

			if (!allowedBusinessTypes.includes(btype)) {
				throw new Error('Business type must be product, service, or both.');
			}

			for (const doc of extraOtherDocs) {
				if (!doc.file && doc.name.trim()) {
					throw new Error('Please select a file for each additional OTHER document entry.');
				}
			}

			const formData = new FormData();

			const appendDoc = (key, file) => {
				if (!file) return;
				formData.append(key, file, file.name);
				// Add metadata clues for backend extension parsing (matching API/src/routes/api/auth/business/register/+server.js expectations)
				formData.append(`${key}_ORIGINAL_NAME`, file.name);
				formData.append(`${key}_MIME`, file.type);
			};

			formData.append('email', email);
			formData.append('mobile', form.founderPhone ? String(form.founderPhone).replace(/\D+/g, '') : '');
			formData.append('password', password);
			formData.append('founder_name', founderName);

			formData.append('bname', bname);
			formData.append('btype', btype);
			formData.append('categories', JSON.stringify(selectedCategoryIds));
			
			formData.append('emails', JSON.stringify([{email: form.bizEmail?.trim(), purpose: 'primary'}]));
			formData.append('phones', JSON.stringify([{phone: form.bizPhone ? String(form.bizPhone).replace(/\D+/g, '') : '', purpose: 'primary'}]));

			if (form.username?.trim()) formData.append('username', form.username.trim());
			formData.append('about', form.description?.trim() || '');
			formData.append('city', form.city?.trim() || '');
			formData.append('pincode', form.pincode?.trim() || '');
			formData.append('district', form.district?.trim() || form.city?.trim() || '');
			formData.append('state', form.state?.trim() || '');
			formData.append('address', form.address?.trim() || '');
			formData.append('lat', form.lat !== '' ? String(form.lat) : '');
			formData.append('long', form.long !== '' ? String(form.long) : '');
			
			// Backend expects 'biz_avatar' and 'founder_avatar'
			if (businessAvatarFile) {
				formData.append('biz_avatar', businessAvatarFile, businessAvatarFile.name);
				formData.append('biz_avatar_MIME', businessAvatarFile.type);
			}
			if (founderAvatarFile) {
				formData.append('founder_avatar', founderAvatarFile, founderAvatarFile.name);
				formData.append('founder_avatar_MIME', founderAvatarFile.type);
			}

			for (const docType of ['AADHAR', 'PAN', 'INCOME', 'GST']) {
				if (kycDocs[docType]) {
					appendDoc(docType, kycDocs[docType]);
				}
			}

			if (kycDocs.OTHER) {
				appendDoc('OTHER', kycDocs.OTHER);
			}

			for (const doc of extraOtherDocs) {
				if (doc.file) {
					appendDoc('OTHER', doc.file);
				}
			}

			await registerBusiness(formData);

			// Registration must be approved by admin before dashboard access
			registrationSuccess = true;
		} catch (err) {
			console.error('Business register error:', err);
			errorMsg = err?.message || 'Unable to complete business registration right now.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register Business — NearBuy</title>
	<meta
		name="description"
		content="Founder onboarding for creating a NearBuy business account."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 text-gray-900 dark:text-white">
	<div class="w-full max-w-xl">
		<div class="mb-8 text-center">
			<a href="/" class="text-4xl font-black"
				><span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span></a
			>
			<p class="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Founder onboarding: business details + founder details</p>
		</div>

		{#if registrationSuccess}
			<div class="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-lg dark:border-green-800 dark:bg-gray-900 border-t-8 border-t-green-500">
				<div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
					<Icon icon="mdi:party-popper" class="text-green-500" width="48" height="48" />
				</div>
				<h2 class="mb-3 text-2xl font-black text-gray-900 dark:text-white">Registration Submitted!</h2>
				<p class="mb-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
					Your business profile and founder details have been securely submitted to NearBuy. <br/><br/>
					<strong class="text-orange-500 dark:text-orange-400">What's Next?</strong><br/>
					An administrator will review your application. Once your business is formally approved, you will be able to log in and access your provider dashboard.
				</p>
				<p class="mb-4 text-xs font-bold text-gray-400">Redirecting to login in 5 seconds...</p>
				<a
					href="/provider/login"
					class="inline-block w-full rounded-2xl bg-gray-900 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 hover:bg-black active:scale-95 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
				>
					Go to Business Login
				</a>
			</div>
			<script>
				setTimeout(() => { window.location.href = '/provider/login'; }, 5000);
			</script>
		{:else}
			<!-- Progress -->
			<div class="mb-8 flex items-center gap-2">
				{#each Array(totalSteps) as _, i}
					<div
						class={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-800'}`}
					></div>
				{/each}
			</div>
			<p class="mb-6 text-sm font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 text-center">Step {step} of {totalSteps}</p>

			<div class="rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-8 shadow-sm">
				{#if errorMsg}
					<div class="mb-4 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500 animate-in flex items-center gap-2">
						<Icon icon="mdi:alert-circle-outline" width="16" height="16" class="shrink-0" />
						{errorMsg}
					</div>
				{/if}
			{#if step === 1}
				<h2 class="mb-5 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon icon="mdi:store" width="22" height="22" class="text-orange-500" /> Business Details</h2>
				<div class="space-y-5">
					<div class="flex flex-col items-center justify-center">
						<label class="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-500 transition-colors">
							{#if businessAvatarPreview}
								<img src={businessAvatarPreview} alt="Business Avatar" class="h-full w-full object-cover" />
							{:else}
								<Icon icon="mdi:camera" width="32" height="32" class="text-gray-400" />
								<span class="mt-1 text-[8px] font-bold uppercase text-gray-500">Avatar</span>
							{/if}
							<input type="file" accept="image/*" class="hidden" onchange={handleBusinessAvatar} />
						</label>
						<p class="mt-2 text-[10px] text-gray-500 dark:text-gray-400">Upload Business Profile Picture</p>
					</div>

					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-name">Business Name</label>
						<input
							id="biz-name"
							type="text"
							bind:value={form.bizName}
							placeholder="e.g., Ravi Electronics"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-email">Business Email</label>
						<input
							id="biz-email"
							type="email"
							bind:value={form.bizEmail}
							placeholder="business@example.com"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-phone">Business Mobile</label>
						<input
							id="biz-phone"
							type="tel"
							bind:value={form.bizPhone}
							placeholder="+91 98765 43210"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div>
						<p class="mb-2 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">Business Type</p>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<button
								id="type-product"
								type="button"
								onclick={() => (form.category = 'product')}
								class={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${form.category === 'product' ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/50'}`}
								><Icon icon="mdi:cube-outline" width="16" height="16" /> Products</button
							>
							<button
								id="type-service"
								type="button"
								onclick={() => (form.category = 'service')}
								class={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${form.category === 'service' ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/50'}`}
								><Icon icon="mdi:wrench-outline" width="16" height="16" /> Services</button
							>
							<button
								id="type-both"
								type="button"
								onclick={() => (form.category = 'both')}
								class={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${form.category === 'both' ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/50'}`}
								><Icon icon="mdi:view-grid-outline" width="16" height="16" /> Both</button
							>
						</div>
					</div>
					<div class="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
						<div class="mb-3 flex items-center justify-between">
							<p class="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">Business Categories (optional)</p>
							<span class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
								{selectedCategoryIds.length} selected
							</span>
						</div>
						<div class="mb-3">
							<div class="flex gap-2">
								<div class="relative flex-1">
									<Icon icon="mdi:magnify" width="16" height="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
									<input
										type="text"
										bind:value={categorySearch}
										placeholder="Search category... (e.g. electronics)"
										class="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white shadow-sm"
										onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); filterCategories(); } }}
									/>
								</div>
								<button
									type="button"
									onclick={filterCategories}
									disabled={categorySearching}
									class="flex items-center gap-1.5 rounded-xl border border-orange-500 bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-60"
								>
									{#if categorySearching}
										<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
									{:else}
										<Icon icon="mdi:magnify" width="14" height="14" />
									{/if}
									Search
								</button>
							</div>
						</div>
						
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
							{#each filteredCategories as option}
								<div class="flex flex-col gap-1.5">
									<button
										type="button"
										onclick={() => {
											// if it has subcategories, map clicks expand/collapse instead of selecting main category
											if (option.subCategories && option.subCategories.length > 0) {
												toggleCategoryExpansion(option.id);
											} else {
												toggleCategoryId(option.id);
											}
										}}
										class={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${selectedCategoryIds.includes(option.id) ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 shadow-sm'}`}
									>
										<span>{option.label}</span>
										{#if option.subCategories && option.subCategories.length > 0}
											<Icon icon={expandedCategoryIds.includes(option.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'} width="14" height="14" class="text-gray-400" />
										{/if}
									</button>
									
									{#if expandedCategoryIds.includes(option.id) && option.subCategories && option.subCategories.length > 0}
										<div class="ml-3 pl-2 border-l-2 border-orange-200 dark:border-orange-500/30 flex flex-col gap-1.5 mt-0.5 mb-1.5">
											{#each option.subCategories as sub}
												<button
													type="button"
													onclick={(e) => { e.stopPropagation(); toggleCategoryId(sub.id); }}
													class={`rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-all ${selectedCategoryIds.includes(sub.id) ? 'border-orange-400 bg-orange-500 text-white shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400'}`}
												>
													{sub.label}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
							{#if filteredCategories.length === 0}
								<p class="col-span-2 text-center text-xs text-gray-500 py-4">No matching categories found</p>
							{/if}
						</div>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-desc"
							>Business Description</label
						>
						<textarea
							id="biz-desc"
							bind:value={form.description}
							placeholder="Describe what your business offers..."
							rows="3"
							class="w-full resize-none rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
						></textarea>
					</div>
					
					<div class="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
						<p class="mb-3 text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">KYC Documents (Optional)</p>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#each ['AADHAR', 'PAN', 'INCOME', 'GST', 'OTHER'] as docType}
								<label class="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 cursor-pointer">
									<div class="flex items-center justify-between gap-2">
										<span>{docType}</span>
										<span class="text-[10px] text-gray-400 truncate max-w-30">{kycDocs[docType]?.name || 'Select file'}</span>
									</div>
									<input type="file" accept=".jpeg,.jpg,.png,.pdf,.doc,.docx" class="hidden" onchange={(e) => handleDocUpload(docType, e)} />
								</label>
							{/each}
						</div>
						{#if kycDocs.OTHER}
							<div class="mt-3">
								<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="other-doc-name">OTHER Document Name</label>
								<input
									id="other-doc-name"
									type="text"
									bind:value={otherDocName}
									placeholder="e.g. TRADE_LICENSE"
									class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
									required
								/>
							</div>
						{/if}

						<div class="mt-3 space-y-2">
							<div class="flex items-center justify-between">
								<p class="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">More OTHER Files</p>
								<button type="button" onclick={addExtraOtherDoc} class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-700 hover:border-orange-500 hover:text-orange-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
									+ Add More
								</button>
							</div>
							{#each extraOtherDocs as extraDoc, idx}
								<div class="rounded-xl border border-dashed border-gray-300 bg-white p-2.5 dark:border-gray-600 dark:bg-gray-900">
									<div class="flex items-center gap-2">
										<label class="flex-1 cursor-pointer rounded-lg border border-gray-300 px-2.5 py-2 text-[11px] font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">
											{extraDoc.file?.name || 'Select file'}
											<input type="file" accept=".jpeg,.jpg,.png,.pdf,.doc,.docx" class="hidden" onchange={(e) => handleExtraOtherFile(idx, e)} />
										</label>
										<button type="button" onclick={() => removeExtraOtherDoc(idx)} class="rounded-lg border border-red-300 bg-red-50 px-2 py-2 text-[10px] font-bold text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">Remove</button>
									</div>
									<input
										type="text"
										bind:value={extraDoc.name}
										placeholder="OTHER file name (e.g. TRADE_LICENSE_COPY_2)"
										class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
									/>
								</div>
							{/each}
						</div>
						<p class="mt-2 text-[10px] font-medium text-gray-400">Keys are sent as AADHAR, PAN, INCOME, GST, OTHER in the same request.</p>
					</div>
				</div>
				{:else if step === 2}
				<h2 class="mb-5 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon icon="mdi:account" width="22" height="22" class="text-orange-500" /> Founder Details</h2>
				<div class="space-y-5">
					<div class="flex flex-col items-center justify-center">
						<label class="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-500 transition-colors">
							{#if founderAvatarPreview}
								<img src={founderAvatarPreview} alt="Founder Avatar" class="h-full w-full object-cover" />
							{:else}
								<Icon icon="mdi:account-circle" width="32" height="32" class="text-gray-400" />
								<span class="mt-1 text-[8px] font-bold uppercase text-gray-500">Photo</span>
							{/if}
							<input type="file" accept="image/*" class="hidden" onchange={handleFounderAvatar} />
						</label>
						<p class="mt-2 text-[10px] text-gray-500 dark:text-gray-400">Upload Founder Picture</p>
					</div>

					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="founder-username">Business Username (optional)</label>
						<input
							id="founder-username"
							type="text"
							bind:value={form.username}
							placeholder="dani_biz123"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="founder-name"
							>Founder Full Name</label
						>
						<input
							id="founder-name"
							type="text"
							bind:value={form.founderName}
							placeholder="Full name"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="founder-phone">Phone Number</label>
						<input
							id="founder-phone"
							type="tel"
							bind:value={form.founderPhone}
							placeholder="+91 98765 43210"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="founder-email">Email Address</label
						>
						<input
							id="founder-email"
							type="email"
							bind:value={form.founderEmail}
							placeholder="founder@krishna.in"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					</div>

				{:else if step === 3}
				<h2 class="mb-5 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon icon="mdi:lock-outline" width="22" height="22" class="text-orange-500" /> Password</h2>
				<div class="space-y-5">
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="founder-password">Password</label>
						<input
							id="founder-password"
							type="password"
							bind:value={form.password}
							placeholder="Create a secure password"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
				
				</div>
				{:else if step === 4}
				<h2 class="mb-5 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon icon="mdi:map-marker" width="22" height="22" class="text-orange-500" /> Business Address</h2>
				<div class="space-y-5">
					<div>
						<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-address">Shop Address</label>
						<input
							id="biz-address"
							type="text"
							bind:value={form.address}
							placeholder="123 Main Street, Anna Nagar"
							class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm"
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-city">City</label>
							<input id="biz-city" type="text" bind:value={form.city} placeholder="Chennai" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
						</div>
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-district">District</label>
							<input id="biz-district" type="text" bind:value={form.district} placeholder="Chennai" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-state">State</label>
							<input id="biz-state" type="text" bind:value={form.state} placeholder="Tamil Nadu" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
						</div>
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-pincode">Pincode</label>
							<div class="relative">
								<input id="biz-pincode" type="text" bind:value={form.pincode} placeholder="600001" maxlength="6" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
								{#if isSearchingPincode}
									<span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon icon="mdi:loading" width="16" height="16" class="animate-spin" /></span>
								{/if}
							</div>
							{#if pincodeResults.length > 0}
								<div class="mt-2 space-y-2 max-h-28 overflow-y-auto pr-1">
									<p class="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Select location for this pincode</p>
									{#each pincodeResults as result}
										<button type="button" onclick={() => applyPincodeResult(result)} class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-600 hover:border-orange-500 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
											{result.city}, {result.state}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-lat">Latitude</label>
							<input id="biz-lat" type="text" inputmode="decimal" bind:value={form.lat} placeholder="13.0827" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
						</div>
						<div>
							<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="biz-long">Longitude</label>
							<input id="biz-long" type="text" inputmode="decimal" bind:value={form.long} placeholder="80.2707" class="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
						</div>
					</div>

					<!-- MAP BLOCK -->
					<div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 mt-4 relative">
						<div class="absolute top-2 left-2 z-10">
							<button type="button" onclick={useMyLocation} disabled={locating} class="rounded-xl bg-white/90 backdrop-blur px-3 py-2 text-xs font-bold text-gray-800 shadow-md hover:text-orange-600 disabled:opacity-50 flex items-center gap-1.5 dark:bg-gray-900/90 dark:text-gray-200 border border-gray-100 dark:border-gray-800">
								{#if locating}
									<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" /> Locating...
								{:else}
									<Icon icon="mdi:crosshairs-gps" width="14" height="14" /> Use My Location
								{/if}
							</button>
						</div>
						<NearBuyMap
							center={getMapCenter()}
							zoom={13}
							height="220px"
							markers={getMapMarkers()}
							interactive={true}
							showControls={true}
							showGeolocate={false}
							onMapReady={handleMapReady}
						/>
						{#if geocoding}
							<div class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white shadow-md backdrop-blur">
								Fetching address...
							</div>
						{/if}
					</div>
					<p class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1 mb-4">Tap anywhere on the map to set location and auto-fill address.</p>

				</div>
				{/if}

			<div class="mt-8 flex gap-3">
				{#if step > 1}
					<button
						id="btn-prev-step"
						type="button"
						onclick={prev}
						class="flex-1 rounded-2xl border border-gray-300 py-3.5 text-sm font-bold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800 active:scale-95 shadow-sm flex items-center justify-center gap-2"
						><Icon icon="mdi:arrow-left" width="16" height="16" /> Back</button
					>
				{/if}
				{#if step < totalSteps}
					<button
						id="btn-next-step"
						type="button"
						onclick={next}
						class="flex-1 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white transition-all shadow-md shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-0.5 active:scale-95 hover:shadow-orange-500/40 flex items-center justify-center gap-2"
						>Next <Icon icon="mdi:arrow-right" width="16" height="16" /></button
					>
				{:else}
					<button
						id="btn-submit-registration"
						type="button"
						onclick={handleSubmit}
						disabled={loading}
						class="flex-1 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white transition-all shadow-md shadow-green-600/20 hover:bg-green-500 hover:-translate-y-0.5 active:scale-95 hover:shadow-green-500/40 flex items-center justify-center gap-2"
						>{#if loading}<Icon icon="mdi:loading" width="16" height="16" class="animate-spin" /> Submitting...{:else}<Icon icon="mdi:check-circle-outline" width="16" height="16" /> Create Business Account{/if}</button
					>
				{/if}
			</div>
		</div>
		{/if}
	</div>
</div>

