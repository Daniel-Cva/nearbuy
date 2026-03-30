<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	function toUiStatus(biz) {
		const status = String(biz?.status || '').toLowerCase();
		const isVerified = Number(biz?.IsVerified ?? biz?.isVerified ?? 0) === 1;
		if (status === 'pending' || !isVerified) return 'pending';
		if (status === 'banned') return 'suspended';
		if (status === 'inactive') return 'inactive';
		return 'active';
	}

	function toUiPlan(value) {
		const normalized = String(value || '').toLowerCase();
		if (normalized === 'pro' || normalized === 'premium') return 'Pro';
		if (normalized === 'basic') return 'Basic';
		return 'Standard';
	}

	async function fetchBusinesses() {
		loading = true;
		errorMsg = '';
		try {
			const response = await fetch(`${API_BASE_URL}/api/admin/businesses`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch businesses (${response.status}).`);
			}

			businessRows = Array.isArray(data?.businesses) ? data.businesses : [];
		} catch (err) {
			console.error('Failed to load businesses:', err);
			errorMsg = err?.message || 'Failed to load businesses.';
		} finally {
			loading = false;
		}
	}

	// Derive admin-formatted business list from centralized stores
	const businesses = $derived(
		businessRows.map((b) => {
			const type = String(b.btype || b.type || '').toLowerCase();
			return {
				id: b.id || '-',
				name: b.bname || b.name || '-',
				type: type === 'product' ? 'Product' : type === 'service' ? 'Service' : 'Both',
				owner: b.founder_name || b.owner || b.founder || 'Unknown',
				location: `${b.city || '-'}, ${(b.state || '').slice(0, 2).toUpperCase()}`,
				lat: b.lat,
				lng: b.long || b.lng,
				joined: String(b.created_at || b.createdAt || '').slice(0, 10),
				plan: toUiPlan(b.subscription || b.plan),
				status: toUiStatus(b),
				rating: Number(b.rating || 0),
				reviews: Number(b.reviews || 0)
			};
		})
	);

	let search = $state('');
	let filterStatus = $state('all');
	let filterType = $state('all');
	let filterPlan = $state('all');
	let sortBy = $state('joined');

	const filtered = $derived(
		businesses
			.filter(
				(b) =>
					(filterStatus === 'all' || b.status === filterStatus) &&
					(filterType === 'all' ||
						(filterType === 'product' && (b.type === 'Product' || b.type === 'Both')) ||
						(filterType === 'service' && (b.type === 'Service' || b.type === 'Both')) ||
						(filterType === 'both' && b.type === 'Both')) &&
					(filterPlan === 'all' || b.plan.toLowerCase() === filterPlan) &&
					(search === '' ||
						b.name.toLowerCase().includes(search.toLowerCase()) ||
						b.owner.toLowerCase().includes(search.toLowerCase()) ||
						b.location.toLowerCase().includes(search.toLowerCase()))
			)
			.sort((a, b) => {
				if (sortBy === 'rating') return b.rating - a.rating;
				if (sortBy === 'reviews') return b.reviews - a.reviews;
				return new Date(b.joined) - new Date(a.joined);
			})
	);

	const planColors = {
		Basic: 'text-gray-400 bg-gray-700/40',
		Standard: 'text-blue-400 bg-blue-500/10',
		Pro: 'text-purple-400 bg-purple-500/10'
	};
	const statusColors = {
		active: 'text-green-400 bg-green-500/10',
		pending: 'text-yellow-400 bg-yellow-500/10',
		suspended: 'text-red-400 bg-red-500/10',
		inactive: 'text-gray-400 bg-gray-500/10'
	};

	const adminMapMarkers = $derived(
		filtered.map(b => ({
			id: b.id,
			lat: b.lat,
			lng: b.lng,
			label: b.name[0],
			popup: `<div><b style="font-size:13px">${b.name}</b><br/><span style="color:#888;font-size:11px">${b.location} • ${b.owner}</span><br/><span style="color:#f97316;font-weight:700;font-size:12px">⭐ ${b.rating} (${b.reviews})</span></div>`
		}))
	);

	onMount(() => {
		fetchBusinesses();
	});
</script>

<svelte:head>
	<title>All Businesses — NearBuy Admin</title>
	<meta
		name="description"
		content="View and manage all registered businesses on the NearBuy platform."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-7xl p-6 md:p-10">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant Directory</p>
			</div>
			<h1 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">All Businesses</h1>
			<p class="mt-1 text-xs font-bold text-gray-500">
				Monitor and lead the growing ecosystem of verified local merchants.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-xl border border-green-500/20">
				<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
				<span class="text-xs font-black text-green-600 uppercase tracking-widest">{businesses.filter((b) => b.status === 'active').length} Active</span>
			</div>
			<div class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-xl border border-red-500/20">
				<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
				<span class="text-xs font-black text-red-600 uppercase tracking-widest">{businesses.filter((b) => b.status === 'suspended').length} Suspended</span>
			</div>
		</div>
	</div>

	{#if errorMsg}
		<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
			{errorMsg}
		</div>
	{/if}

	{#if loading}
		<div class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
			Loading businesses from API...
		</div>
	{/if}

	<!-- Filters & Actions -->
	<div class="mb-6 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
		<div class="flex flex-wrap gap-3">
			<div class="relative flex-1 min-w-60 group">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500">🔍</span>
				<input
					type="search"
					bind:value={search}
					placeholder="Search by name, owner, or city..."
					class="w-full rounded-xl border border-gray-100 bg-gray-50 px-10 py-2.5 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<select bind:value={filterStatus} class="filter-select">
					<option value="all">Any Status</option>
					<option value="active">Active</option>
					<option value="suspended">Suspended</option>
				</select>
				<select bind:value={filterType} class="filter-select">
					<option value="all">Any Type</option>
					<option value="product">Products</option>
					<option value="service">Services</option>
					<option value="both">Both</option>
				</select>
				<select bind:value={filterPlan} class="filter-select">
					<option value="all">Any Plan</option>
					<option value="basic">Basic</option>
					<option value="standard">Standard</option>
					<option value="pro">Pro Plan</option>
				</select>
				<select bind:value={sortBy} class="filter-select bg-orange-500/5 border-orange-500/30! text-orange-600!">
					<option value="joined">Newest Joined</option>
					<option value="rating">Top Rated</option>
					<option value="reviews">Most Reviews</option>
				</select>
			</div>
		</div>
		<div class="flex items-center justify-between">
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">
				Showing {filtered.length} matching merchants
			</p>
			<button class="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors">Reset All Filters</button>
		</div>
	</div>

	<!-- Business Locations Map -->
	<div class="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
		<button
			onclick={() => showMap = !showMap}
			class="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
		>
			<span class="flex items-center gap-2">🗺️ Business Locations ({filtered.length})</span>
			<span class="text-xs text-gray-400">{showMap ? '▲ Hide' : '▼ Show map'}</span>
		</button>
		{#if showMap}
			<div class="border-t border-gray-100 dark:border-gray-800">
				{#await import('$lib/components/NearBuyMap.svelte') then { default: NearBuyMap }}
					<NearBuyMap
						center={[79.5, 11.5]}
						zoom={6.5}
						height="350px"
						markers={adminMapMarkers}
						showControls={true}
						interactive={true}
					/>
				{/await}
			</div>
		{/if}
	</div>

	<!-- Mobile View: Cards -->
	<div class="grid grid-cols-1 gap-4 md:hidden">
		{#each filtered as biz}
			<div class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-orange-500/30 dark:border-gray-800 dark:bg-gray-900">
				<div class="mb-3 flex items-center gap-3">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
						{biz.type === 'Product' ? '📦' : biz.type === 'Service' ? '🔧' : '📦🔧'}
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="font-black text-gray-900 dark:text-white truncate">{biz.name}</h3>
						<p class="text-xs font-bold text-gray-500">{biz.owner} • {biz.location}</p>
					</div>
					<span class={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusColors[biz.status]}`}>
						{biz.status}
					</span>
				</div>
				<div class="flex items-center justify-between mb-6">
					<div class="flex gap-2">
						<span class={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${planColors[biz.plan]}`}>
							{biz.plan}
						</span>
						<span class="text-xs font-bold text-yellow-500">⭐ {biz.rating}</span>
					</div>
					<p class="text-[10px] font-black text-gray-400 uppercase tracking-tighter">ID: {biz.id}</p>
				</div>
				<a
					href={`/admin/businesses/${biz.id}`}
					class="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 py-3 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
				>
					Inspect Profile
				</a>
			</div>
		{/each}
	</div>

	<!-- Desktop View: Table -->
	<div class="hidden overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 md:block">
		<table class="w-full border-collapse">
			<thead>
				<tr class="border-b border-gray-50 bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:bg-gray-950/50">
					<th class="px-8 py-5 text-left">Business Entity</th>
					<th class="px-6 py-5 text-left">Merchant Owner</th>
					<th class="px-6 py-5 text-left">Location</th>
					<th class="px-6 py-5 text-left">Tier</th>
					<th class="px-6 py-5 text-left">Reputation</th>
					<th class="px-6 py-5 text-left">Status</th>
					<th class="px-8 py-5 text-right">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
				{#each filtered as biz}
					<tr class="group transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-500/5">
						<td class="px-8 py-4">
							<div class="flex items-center gap-4">
								<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl shadow-inner group-hover:scale-110 transition-transform">
									{biz.type === 'Product' ? '📦' : biz.type === 'Service' ? '🔧' : '📦🔧'}
								</div>
								<div class="min-w-0">
									<p class="font-black text-gray-900 dark:text-white truncate">{biz.name}</p>
									<p class="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{biz.id}</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300">{biz.owner}</td>
						<td class="px-6 py-4 text-sm font-bold text-gray-400">{biz.location}</td>
						<td class="px-6 py-4">
							<span class={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${planColors[biz.plan]}`}>
								{biz.plan}
							</span>
						</td>
						<td class="px-6 py-4">
							<div class="flex flex-col">
								<span class="text-sm font-black text-yellow-500 tracking-tight">⭐ {biz.rating}</span>
								<span class="text-[10px] font-bold text-gray-400">{biz.reviews} reviews</span>
							</div>
						</td>
						<td class="px-6 py-4">
							<div class="flex items-center gap-2">
								<span class={`h-1.5 w-1.5 rounded-full ${biz.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
								<span class={`text-[10px] font-black uppercase tracking-widest ${statusColors[biz.status].split(' ')[0]}`}>
									{biz.status}
								</span>
							</div>
						</td>
						<td class="px-8 py-4 text-right">
							<a
								href={`/admin/businesses/${biz.id}`}
								class="inline-flex rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
							>
								Inspect
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if filtered.length === 0}
			<div class="py-24 text-center animate-in fade-in zoom-in duration-500">
				<div class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-5xl dark:bg-gray-800">🕵️</div>
				<h3 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">No Merchants Found</h3>
				<p class="text-gray-500 font-bold">Try adjusting your filters or search query.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.filter-select {
		appearance: none;
		border-radius: 1rem;
		border: 1px solid #f3f4f6;
		background-color: transparent;
		padding: 0.625rem 1.25rem;
		padding-right: 2.5rem;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		outline: none;
		cursor: pointer;
		transition: all 0.2s;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1rem;
	}
	
	:global(.dark) .filter-select {
		border-color: #1f2937;
		color: #9ca3af;
	}

	.filter-select:hover {
		border-color: #f97316;
		color: #f97316;
	}

	.filter-select:focus {
		border-color: #f97316;
		box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
	}
</style>
