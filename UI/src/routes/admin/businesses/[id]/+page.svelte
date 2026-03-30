<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let loading = $state(true);
	let errorMsg = $state('');
	let businessData = $state(null);

	function toBusinessType(value) {
		const type = String(value || '').toLowerCase();
		if (type === 'product') return 'Product';
		if (type === 'service') return 'Service';
		return 'Both';
	}

	function toBusinessStatus(data) {
		const status = String(data?.status || '').toLowerCase();
		const isVerified = Number(data?.IsVerified ?? 0) === 1;
		if (status === 'pending' || !isVerified) return 'pending';
		if (status === 'banned') return 'suspended';
		if (status === 'inactive') return 'inactive';
		return 'active';
	}

	async function fetchBusinessDetail() {
		loading = true;
		errorMsg = '';
		try {
		const response = await fetch(`${API_BASE_URL}/api/admin/businesses/${$page.params.id}`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch business (${response.status}).`);
			}

			businessData = data?.business || data?.data || null;
		} catch (err) {
			console.error('Failed to load business:', err);
			errorMsg = err?.message || 'Failed to load business details.';
		} finally {
			loading = false;
		}
	}

	const bizId = $derived($page.params.id);
	const biz = $derived(
		businessData
			? {
					id: businessData.id || bizId,
					name: businessData.bname || businessData.name || '-',
					type: toBusinessType(businessData.btype || businessData.type),
					owner: businessData.founder_name || businessData.owner || '-',
					location: `${businessData.city || '-'}${businessData.state ? `, ${businessData.state}` : ''}`,
					joined: String(businessData.created_at || businessData.createdAt || '').slice(0, 10),
					plan: String(businessData.subscription || businessData.plan || 'Standard'),
					status: toBusinessStatus(businessData),
					rating: Number(businessData.rating || 0),
					reviews: Number(businessData.reviews || 0),
					phone: businessData.bphone || businessData.mobile || '-',
					email: businessData.bemail || businessData.email || '-',
					gstin: businessData.gstin || 'N/A'
			  }
			: null
	);

	onMount(() => {
		fetchBusinessDetail();
	});
</script>

<svelte:head>
	<title>{biz ? `${biz.name} - Business Profile` : 'Business Not Found'} - NearBuy Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl p-6 md:p-10">
	{#if biz}
		<div class="mb-8 flex items-center justify-between gap-4">
			<div>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Inspect View</p>
				<h1 class="text-3xl font-black text-gray-900 dark:text-white">{biz.name}</h1>
				<p class="mt-1 text-sm font-bold text-gray-500">{biz.id} • Joined {biz.joined}</p>
			</div>
			<a href={`/admin/businesses/${biz.id}/edit`} class="rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white">Edit Business</a>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</p>
				<p class="mt-1 text-lg font-black text-gray-900 dark:text-white">{biz.owner}</p>
				<p class="mt-2 text-sm font-bold text-gray-500">{biz.phone}</p>
				<p class="text-sm font-bold text-gray-500">{biz.email}</p>
			</div>
			<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Compliance</p>
				<p class="mt-1 text-lg font-black text-gray-900 dark:text-white">GSTIN</p>
				<p class="mt-2 font-mono text-sm font-black text-orange-600">{biz.gstin}</p>
			</div>
			<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 md:col-span-2">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance</p>
				<div class="mt-3 flex flex-wrap items-center gap-4">
					<span class="rounded-full bg-green-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-green-600">{biz.status}</span>
					<span class="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-600">{biz.plan}</span>
					<span class="text-sm font-black text-yellow-500">Rating {biz.rating}</span>
					<span class="text-sm font-bold text-gray-500">{biz.reviews} reviews</span>
				</div>
				<p class="mt-4 text-sm font-bold text-gray-500">{biz.location}</p>
			</div>
		</div>
	{:else if loading}
		<div class="rounded-3xl border border-gray-100 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
			<h1 class="text-2xl font-black text-gray-900 dark:text-white">Loading Business</h1>
			<p class="mt-2 text-sm font-bold text-gray-500">Fetching business details...</p>
		</div>
	{:else}
		<div class="rounded-3xl border border-gray-100 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
			<h1 class="text-2xl font-black text-gray-900 dark:text-white">Business Not Found</h1>
			<p class="mt-2 text-sm font-bold text-gray-500">{errorMsg || `No record exists for ID: ${$page.params.id}`}</p>
			<a href="/admin/businesses" class="mt-6 inline-block rounded-xl bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Back to Businesses</a>
		</div>
	{/if}
</div>
