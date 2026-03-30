<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const bizId = $derived($page.params.id);

	let loading = $state(true);
	let actionLoading = $state(false);
	let errorMsg = $state('');
	let noticeMsg = $state('');
	let business = $state(null);
	let founder = $state({});
	let docsFromApi = $state([]);



	function toAssetUrl(path) {
		if (!path) return '';
		if (/^https?:\/\//i.test(path)) return path;
		return `${API_BASE_URL}/${String(path).replace(/^\/+/, '')}`;
	}

	function pickFirst(...values) {
		for (const value of values) {
			if (value !== null && value !== undefined && String(value).trim() !== '') return value;
		}
		return '';
	}

	function displayValue(value) {
		if (value === null || value === undefined || String(value).trim() === '') return '-';
		return String(value);
	}

	function hasValue(value) {
		return value !== null && value !== undefined && String(value).trim() !== '';
	}

	function normalizeBusiness(input) {
		if (!input || typeof input !== 'object') return null;

		return {
			id: pickFirst(input.id, input.business_id, input.biz_id),
			bname: pickFirst(input.bname, input.name),
			bemail: pickFirst(input.bemail, input.business_email, input.email),
			bphone: pickFirst(input.bphone, input.business_phone, input.phone),
			btype: pickFirst(input.btype, input.type),
			about: pickFirst(input.about, input.description),
			city: pickFirst(input.city),
			pincode: pickFirst(input.pincode, input.pin_code, input.postal_code),
			district: pickFirst(input.district),
			state: pickFirst(input.state),
			address: pickFirst(input.address),
			lat: pickFirst(input.lat, input.latitude),
			long: pickFirst(input.long, input.lng, input.longitude),
			avatar_url: pickFirst(input.avatar_url, input.logo_url, input.logo, input.imagePath, input.image),
			theme: pickFirst(input.theme),
			founder_id: pickFirst(input.founder_id, input.owner_id),
			IsVerified: pickFirst(input.IsVerified, input.isVerified, input.is_verified),
			status: pickFirst(input.status),
			created_at: pickFirst(input.created_at, input.createdAt),
			updated_at: pickFirst(input.updated_at, input.updatedAt),
			custom_kyc_docs: Array.isArray(input.custom_kyc_docs) ? input.custom_kyc_docs : [],
			kyc_docs: Array.isArray(input.kyc_docs) ? input.kyc_docs : [],
			docs: Array.isArray(input.docs) ? input.docs : [],
			documents: input.documents && typeof input.documents === 'object' ? input.documents : null,
			_raw: input
		};
	}

	function pickFounder(biz, payload) {
		const f =
			(payload?.founder && typeof payload.founder === 'object' && payload.founder) ||
			(payload?.profile && typeof payload.profile === 'object' && payload.profile) ||
			(biz?._raw?.founder && typeof biz._raw.founder === 'object' && biz._raw.founder) ||
			{};

		return {
			id: pickFirst(f.id, f.founder_id, biz?.founder_id, biz?._raw?.founder_id),
			biz_id: pickFirst(f.biz_id, biz?.id),
			name: pickFirst(f.name, biz?._raw?.founder_name, biz?._raw?.owner, biz?._raw?.founderName),
			email: pickFirst(f.email, biz?._raw?.founder_email),
			phone: pickFirst(f.phone, f.mobile, biz?._raw?.founder_mobile, biz?._raw?.phone, biz?.bphone),
			avatar_url: pickFirst(f.avatar_url, biz?._raw?.founder_avatar, biz?._raw?.founder_avatar_url),
			bio: pickFirst(f.bio),
			created_at: pickFirst(f.created_at, f.createdAt),
			updated_at: pickFirst(f.updated_at, f.updatedAt)
		};
	}

	function getLogoUrl() {
		const candidates = [
			business?.avatar_url,
			founder?.avatar_url,
			business?.logo_url,
			business?.logo,
			business?.imagePath,
			business?.image
		];

		for (const value of candidates) {
			if (value) return toAssetUrl(value);
		}

		return '';
	}

	function getBusinessTypeLabel() {
		const type = String(business?.btype || business?.type || '').toLowerCase();
		if (type === 'product') return 'Product';
		if (type === 'service') return 'Service';
		if (type === 'both') return 'Both';
		return String(business?.btype || business?.type || 'Unknown');
	}

	function getDocPaths() {
		if (!business || typeof business !== 'object') return [];

		const merged = [
			...(Array.isArray(docsFromApi) ? docsFromApi : []),
			...(Array.isArray(business.custom_kyc_docs) ? business.custom_kyc_docs : []),
			...(Array.isArray(business.kyc_docs) ? business.kyc_docs : []),
			...(Array.isArray(business.docs) ? business.docs : [])
		];

		if (business.documents && typeof business.documents === 'object') {
			for (const value of Object.values(business.documents)) {
				if (typeof value === 'string') {
					merged.push(value);
					continue;
				}

				if (Array.isArray(value)) {
					for (const item of value) {
						if (typeof item === 'string') {
							merged.push(item);
						} else if (item && typeof item === 'object') {
							merged.push(item.path || item.url || item.file || item.name || '');
						}
					}
					continue;
				}

				if (value && typeof value === 'object') {
					merged.push(value.path || value.url || value.file || value.name || '');
				}
			}
		}

		return [...new Set(merged.map((v) => String(v || '').trim()).filter(Boolean))];
	}

	function getDocFileName(path) {
		const clean = String(path || '').split('?')[0];
		const segments = clean.split('/');
		return segments[segments.length - 1] || 'File';
	}

	async function fetchBusinessDetails() {
		loading = true;
		errorMsg = '';
		noticeMsg = '';
		docsFromApi = [];

		try {
		const detailResponse = await fetch(`${API_BASE_URL}/api/admin/businesses/${bizId}`, {
				credentials: 'include'
			});
			if (detailResponse.status === 401 || detailResponse.status === 403) {
				throw new Error('Unauthorized. Super Admin token is missing/expired. Please login again.');
			}

			let resolvedBusiness = null;
			let detailJson = null;

			if (detailResponse.ok) {
				const detailContentType = detailResponse.headers.get('content-type') || '';
				detailJson = detailContentType.includes('application/json') ? await detailResponse.json() : null;
				resolvedBusiness = detailJson?.business || detailJson?.data?.business || detailJson?.data || detailJson;
				docsFromApi = Array.isArray(detailJson?.custom_kyc_docs) ? detailJson.custom_kyc_docs : [];
			}

			if (!resolvedBusiness || typeof resolvedBusiness !== 'object') {
				const pendingResponse = await fetch(`${API_BASE_URL}/api/admin/businesses/pending`, {
					credentials: 'include'
				});
				if (pendingResponse.status === 401 || pendingResponse.status === 403) {
					throw new Error('Unauthorized. Super Admin token is missing/expired. Please login again.');
				}
				const pendingContentType = pendingResponse.headers.get('content-type') || '';
				const pendingJson = pendingContentType.includes('application/json') ? await pendingResponse.json() : null;

				if (!pendingResponse.ok) {
					throw new Error(pendingJson?.message || `Unable to load business details (${pendingResponse.status}).`);
				}

				const list = Array.isArray(pendingJson?.businesses) ? pendingJson.businesses : [];
				resolvedBusiness =
					list.find((item) => String(item.id || item.business_id) === String(bizId)) || null;
			}

			if (!resolvedBusiness) {
				throw new Error('Business details not found.');
			}

			business = normalizeBusiness(resolvedBusiness);
			founder = pickFounder(business, detailJson || resolvedBusiness);
		} catch (err) {
			console.error('Failed to load inspect business details:', err);
			errorMsg = err?.message || 'Unable to load business details right now.';
		} finally {
			loading = false;
		}
	}

	async function verifyBusiness(action) {
		actionLoading = true;
		noticeMsg = '';
		errorMsg = '';

		try {
			if (action !== 'approve' && action !== 'reject') throw new Error('Invalid verify action.');

			const businessId = business?.id || business?.business_id || bizId;
			if (!businessId) throw new Error('Business ID missing. Unable to verify this request.');

			const response = await fetch(`${API_BASE_URL}/api/admin/businesses/${encodeURIComponent(String(businessId))}/approve`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action })
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;
			const responseText = !isJson ? await response.text() : '';

			if (response.status === 401 || response.status === 403) {
				throw new Error('Unauthorized. Super Admin token is missing/expired. Please login again.');
			}

			if (!response.ok) {
				throw new Error(
					data?.message ||
					(responseText ? `Failed to ${action} this business (${response.status}): ${responseText}` : `Failed to ${action} this business (${response.status}).`)
				);
			}

			noticeMsg = data?.message || `Business ${action}d successfully.`;

			// Optimistically reflect moderation state immediately.
			if (business) {
				business = {
					...business,
					IsVerified: action === 'approve' ? 1 : 0,
					status: action === 'approve' ? 'active' : business.status
				};
			}

			await fetchBusinessDetails();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			console.error('Failed to process verification action:', err);
			errorMsg = err?.message || 'Failed to process the action.';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} finally {
			actionLoading = false;
		}
	}

	onMount(() => {
		fetchBusinessDetails();
	});
</script>

<svelte:head>
	<title>Inspect Business {bizId} — NearBuy Admin</title>
	<meta name="description" content="Inspect full business and founder details before approval." />
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6 transition-colors duration-300 dark:bg-gray-950 md:p-10">
	<div class="mx-auto max-w-5xl space-y-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<a
					href="/admin/business-requests"
					class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-orange-500 dark:border-gray-800 dark:bg-gray-900"
				>
					<span class="text-lg">←</span>
				</a>
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-orange-500">Inspection</p>
					<h1 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Business Details</h1>
				</div>
			</div>
			<div class="text-xs font-black uppercase tracking-widest text-gray-400">
				ID: {bizId}
			</div>
		</div>

		{#if errorMsg}
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
				{errorMsg}
			</div>
		{/if}

		{#if noticeMsg}
			<div class="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
				{noticeMsg}
			</div>
		{/if}

		{#if loading}
			<div class="rounded-3xl border border-gray-200 bg-white p-8 text-sm font-bold text-gray-500 dark:border-gray-800 dark:bg-gray-900">
				Loading business details...
			</div>
		{:else if business}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<div class="flex items-center gap-4">
							<div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
								{#if getLogoUrl()}
									<img src={getLogoUrl()} alt="Business logo" class="h-full w-full object-cover" />
								{:else}
									<span class="text-3xl">🏪</span>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h2 class="truncate text-2xl font-black text-gray-900 dark:text-white">{displayValue(business.bname)}</h2>
								<p class="mt-1 text-sm font-bold text-gray-500">Type: {getBusinessTypeLabel()}</p>
								<p class="mt-0.5 text-xs font-semibold text-gray-400">{displayValue(business.address)}</p>
							</div>
						</div>

						<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business ID</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.id)}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Email</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.bemail)}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Phone</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.bphone)}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">City</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.city)}</p>
							</div>
							{#if hasValue(business.district)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">District</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.district)}</p>
								</div>
							{/if}
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">State</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.state)}</p>
							</div>
							{#if hasValue(business.pincode)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Pincode</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.pincode)}</p>
								</div>
							{/if}
							{#if hasValue(business.lat) || hasValue(business.long)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Coordinates</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.lat)}, {displayValue(business.long)}</p>
								</div>
							{/if}
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.status)}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Verification</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{String(business.IsVerified) === '1' ? 'Verified' : 'Pending'}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Created At</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.created_at)}</p>
							</div>
							{#if hasValue(business.about)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70 sm:col-span-2">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">About</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(business.about)}</p>
								</div>
							{/if}
						</div>
					</div>

					<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<h3 class="text-lg font-black text-gray-900 dark:text-white">Founder Details</h3>
						<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#if hasValue(founder.id)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Founder ID</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(founder.id)}</p>
								</div>
							{/if}
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Name</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(founder.name)}</p>
							</div>
							<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
								<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(founder.email)}</p>
							</div>
							{#if hasValue(founder.phone)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70 sm:col-span-2">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(founder.phone)}</p>
								</div>
							{/if}
							{#if hasValue(founder.bio)}
								<div class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/70 sm:col-span-2">
									<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Bio</p>
									<p class="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{displayValue(founder.bio)}</p>
								</div>
							{/if}
						</div>
					</div>

					<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<div class="flex items-center justify-between gap-3">
							<h3 class="text-lg font-black text-gray-900 dark:text-white">Uploaded Files For Verification</h3>
							<span class="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">{getDocPaths().length} files</span>
						</div>
						{#if getDocPaths().length > 0}
							<div class="mt-4 space-y-2">
								{#each getDocPaths() as docPath}
									<div class="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
										<p class="truncate text-xs font-bold text-gray-700 dark:text-gray-200">{getDocFileName(docPath)}</p>
										<a
											href={toAssetUrl(docPath)}
											target="_blank"
											rel="noopener noreferrer"
											class="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-400"
										>
											View
										</a>
									</div>
								{/each}
							</div>
						{:else}
							<p class="mt-3 text-sm font-semibold text-gray-500">No KYC files available.</p>
						{/if}
					</div>
				</div>

				<div class="space-y-6">
					<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<h3 class="text-lg font-black text-gray-900 dark:text-white">Action</h3>
						<div class="mt-4 space-y-3">
							{#if business.status !== 'active'}
								<button
									type="button"
									onclick={() => verifyBusiness('approve')}
									disabled={actionLoading}
									class="w-full rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:opacity-60"
								>
									{actionLoading ? 'Processing...' : 'Approve'}
								</button>
							{/if}
							<button
								type="button"
								onclick={() => verifyBusiness('reject')}
								disabled={actionLoading}
								class="w-full rounded-2xl bg-gray-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-500/10"
							>
								{actionLoading ? 'Processing...' : 'Reject'}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
