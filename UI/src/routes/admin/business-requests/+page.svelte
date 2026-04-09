<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import Icon from '@iconify/svelte';

	let pendingBusinesses = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');
	let actionLoadingId = $state('');
	let actionNotice = $state('');

	let filter = $state('all');
	const filtered = $derived(
		filter === 'all'
			? pendingBusinesses
			: pendingBusinesses.filter((b) => getTypeLabel(b).toLowerCase() === filter)
	);

	const typeIcon = (t) => (t === 'Product' ? 'lucide:package' : t === 'Service' ? 'lucide:wrench' : 'lucide:layers');
	const typeBadgeColor = (t) =>
		t === 'Product'
			? 'bg-blue-500/10 text-blue-400'
			: t === 'Service'
				? 'bg-orange-500/10 text-orange-400'
				: 'bg-purple-500/10 text-purple-400';

	function buildDocUrl(docPath) {
		if (!docPath) return '';
		if (/^https?:\/\//i.test(docPath)) return docPath;
		return `${API_BASE_URL}/api/media/${String(docPath).replace(/^\/+/, '')}`;
	}

	function getTypeLabel(biz) {
		const type = String(biz?.btype || biz?.type || '').toLowerCase();
		if (type === 'product') return 'Product';
		if (type === 'service') return 'Service';
		return 'Both';
	}

	function getLocationLabel(biz) {
		const city = biz?.city || '-';
		const state = biz?.state || '';
		return state ? `${city}, ${state}` : city;
	}

	function formatSubmittedDate(value) {
		if (!value) return '-';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
		return date.toISOString().slice(0, 10);
	}

	function normalizeDocPaths(biz) {
		if (Array.isArray(biz?.custom_kyc_docs)) return biz.custom_kyc_docs;
		if (Array.isArray(biz?.kyc_docs)) return biz.kyc_docs;
		return [];
	}



	async function fetchPendingRequests() {
		loading = true;
		errorMsg = '';

		try {
			const response = await fetch(`${API_BASE_URL}/api/admin/businesses/pending`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (response.status === 401 || response.status === 403) {
				throw new Error('Unauthorized. Super Admin token is missing/expired. Please login again.');
			}

			if (!response.ok) {
				throw new Error(data?.message || `Unable to fetch pending requests (${response.status}).`);
			}

			pendingBusinesses = Array.isArray(data?.businesses) ? data.businesses : [];
		} catch (err) {
			console.error('Failed to fetch pending businesses:', err);
			errorMsg = err?.message || 'Failed to fetch pending business requests.';
		} finally {
			loading = false;
		}
	}

	async function verifyBusiness(businessId, decision) {
		actionNotice = '';
		actionLoadingId = String(businessId);

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/admin/businesses/${businessId}/approve`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({ action: decision })
				}
			);

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (response.status === 401 || response.status === 403) {
				throw new Error('Unauthorized. Super Admin token is missing/expired. Please login again.');
			}

			if (!response.ok) {
				throw new Error(data?.message || `Failed to ${decision} request.`);
			}

			actionNotice = `Business ${decision}d successfully.`;
			await fetchPendingRequests();
		} catch (err) {
			console.error('Verification action failed:', err);
			actionNotice = err?.message || 'Failed to process request.';
		} finally {
			actionLoadingId = '';
		}
	}

	onMount(() => {
		fetchPendingRequests();
	});
</script>

<svelte:head>
	<title>Business Requests — NearBuy Admin</title>
	<meta
		name="description"
		content="Review and approve or reject pending business onboarding requests."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-5xl p-6 md:p-10">
	<div class="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Onboarding Queue</p>
			</div>
			<h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Business Requests</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">Review submitted verification documents and approve local vendors.</p>
		</div>
		<div class="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
			{#each ['all', 'product', 'service', 'both'] as f}
				<button
					id={`filter-${f}`}
					onclick={() => (filter = f)}
					class={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-orange-500'}`}
				>{f}</button>
			{/each}
		</div>
	</div>

	<div class="space-y-4">
		{#if errorMsg}
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
				{errorMsg}
			</div>
		{/if}

		{#if actionNotice}
			<div class="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-400">
				{actionNotice}
			</div>
		{/if}

		{#if loading}
			<div class="rounded-4xl border border-gray-100 bg-white p-8 text-sm font-bold text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				Loading pending business requests...
			</div>
		{/if}

		{#each filtered as biz}
			<div
				class="group flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-4xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-500/30 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
			>
				<div
					class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-orange-500/10 text-3xl text-orange-600 shadow-inner transition-transform group-hover:scale-110"
				>
					<Icon icon={typeIcon(getTypeLabel(biz))} />
				</div>
				<div class="min-w-0 flex-1 space-y-1">
					<div class="flex flex-wrap items-center gap-3">
						<h3 class="text-xl font-black text-gray-900 dark:text-white">{biz.bname || biz.name || '-'}</h3>
						<span class={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${typeBadgeColor(getTypeLabel(biz))}`}
							>{getTypeLabel(biz)}</span
						>
					</div>
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-gray-500">
						<span class="flex items-center gap-1.5">
							<Icon icon="lucide:user" class="text-orange-500" />
							{biz.founder_name || biz.owner || '-'}
						</span>
						<span class="flex items-center gap-1.5">
							<Icon icon="lucide:map-pin" class="text-orange-500" />
							{getLocationLabel(biz)}
						</span>
					</div>
					<div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-400">
						<span>Ref ID: <span class="text-orange-500">{biz.id || biz.business_id || '-'}</span></span>
						<span>•</span>
						<span>Submitted: {formatSubmittedDate(biz.created_at || biz.createdAt)}</span>
					</div>

					{#if normalizeDocPaths(biz).length > 0}
						<div class="pt-2">
							<p class="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Attached KYC Docs</p>
							<div class="flex flex-wrap gap-2">
								{#each normalizeDocPaths(biz) as docPath}
									<a
										href={buildDocUrl(docPath)}
										target="_blank"
										rel="noopener noreferrer"
										class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-orange-400 hover:text-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
									>
										View File
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<div class="flex w-full sm:w-auto items-center gap-2 pt-4 sm:pt-0">
					<a
						href={`/admin/inspect-business/${biz.id || biz.business_id}`}
						class="flex-1 sm:flex-none text-center rounded-2xl bg-gray-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-700 shadow-sm transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						View Details
					</a>
					<button
						onclick={() => verifyBusiness(biz.id || biz.business_id, 'reject')}
						disabled={actionLoadingId === String(biz.id || biz.business_id)}
						class="flex-1 sm:flex-none rounded-2xl bg-gray-50 dark:bg-gray-800 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-60"
					>
						{actionLoadingId === String(biz.id || biz.business_id) ? 'Processing...' : 'Reject'}
					</button>
					<button
						onclick={() => verifyBusiness(biz.id || biz.business_id, 'approve')}
						disabled={actionLoadingId === String(biz.id || biz.business_id)}
						class="flex-1 sm:flex-none text-center rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 active:scale-95 disabled:opacity-60"
					>
						{actionLoadingId === String(biz.id || biz.business_id) ? 'Processing...' : 'Approve'}
					</button>
				</div>
			</div>
		{/each}

		{#if !loading && filtered.length === 0}
			<div class="py-20 text-center animate-in fade-in zoom-in duration-500">
				<div class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-5xl text-gray-300 dark:bg-gray-800">
					<Icon icon="lucide:inbox" />
				</div>
				<h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Queue is Clear</h2>
				<p class="text-gray-500 font-bold">No pending business requests found in this category.</p>
			</div>
		{/if}
	</div>
</div>
