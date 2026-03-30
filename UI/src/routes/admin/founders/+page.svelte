<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	function toInitials(name) {
		const text = String(name || '').trim();
		if (!text) return 'NA';
		return text
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() || '')
			.join('');
	}

	async function fetchFounders() {
		loading = true;
		errorMsg = '';
		try {
			const response = await fetch(`${API_BASE_URL}/api/admin/founders`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch founders (${response.status}).`);
			}

			founderRows = Array.isArray(data?.founders) ? data.founders : [];
		} catch (err) {
			console.error('Failed to load founders:', err);
			errorMsg = err?.message || 'Failed to load founders.';
		} finally {
			loading = false;
		}
	}

	const founders = $derived(
		founderRows.map((f) => {
			const collabMode = String(f.collab_mode || f.collab || 'OFF').toUpperCase();
			const city = f.city || '-';
			const state = f.state || '';
			return {
				id: f.id || '-',
				name: f.name || '-',
				business: f.bname || f.business || f.biz_name || '-',
				location: state ? `${city}, ${state}` : city,
				industry: f.industry || f.category || 'General',
				connections: Number(f.connections || 0),
				collab: collabMode === 'ON' ? 'Open' : 'Closed',
				bio: f.bio || 'No bio available.',
				avatar: toInitials(f.name),
				joined: String(f.created_at || f.createdAt || '').slice(0, 10),
				online: false
			};
		})
	);

	const industryColors = {
		Electronics: 'bg-blue-500/10 text-blue-400',
		Fashion: 'bg-pink-500/10 text-pink-400',
		Repair: 'bg-yellow-500/10 text-yellow-400',
		Retail: 'bg-orange-500/10 text-orange-400',
		Services: 'bg-gray-500/10 text-gray-400',
		Food: 'bg-amber-500/10 text-amber-400',
		Health: 'bg-green-500/10 text-green-400'
	};

	const avatarColors = [
		'bg-orange-500',
		'bg-blue-500',
		'bg-purple-500',
		'bg-green-500',
		'bg-pink-500',
		'bg-amber-500',
		'bg-cyan-500'
	];

	let search = $state('');
	let filterCollab = $state('all');
	let filterIndustry = $state('all');

	const industries = $derived([...new Set(founders.map((f) => f.industry))]);

	const filtered = $derived(
		founders.filter(
			(f) =>
				(filterCollab === 'all' || f.collab.toLowerCase() === filterCollab) &&
				(filterIndustry === 'all' || f.industry === filterIndustry) &&
				(search === '' ||
					f.name.toLowerCase().includes(search.toLowerCase()) ||
					f.business.toLowerCase().includes(search.toLowerCase()))
		)
	);

	onMount(() => {
		fetchFounders();
	});
</script>

<svelte:head>
	<title>Founders — NearBuy Admin</title>
	<meta name="description" content="View all business founders on the NearBuy platform." />
</svelte:head>

<div class="mx-auto w-full max-w-7xl p-6 md:p-10">
	<!-- Header -->
	<div class="mb-10 flex flex-wrap items-start justify-between gap-6">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Networking Hub</p>
			</div>
			<h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Founders</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">
				Manage and monitor the leadership of businesses in the NearBuy network.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
				<span class="h-2 w-2 rounded-full bg-green-400"></span>
				<span class="text-xs font-black text-green-600 uppercase tracking-widest">{founders.filter((f) => f.online).length} Active</span>
			</div>
			<div class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20">
				<span class="h-2 w-2 rounded-full bg-blue-500"></span>
				<span class="text-xs font-black text-blue-600 uppercase tracking-widest">{founders.filter((f) => f.collab === 'Open').length} Looking to Collab</span>
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
			Loading founders from API...
		</div>
	{/if}

	<!-- Filters -->
	<div class="mb-8 p-6 bg-white dark:bg-gray-900 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
		<div class="flex flex-wrap gap-4">
			<div class="relative flex-1 min-w-70 group">
				<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500">🔍</span>
				<input
					type="search"
					bind:value={search}
					placeholder="Search founders or business names..."
					class="w-full rounded-2xl border border-gray-100 bg-gray-50 px-12 py-3.5 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<select bind:value={filterCollab} class="filter-select">
					<option value="all">Any Status</option>
					<option value="open">🤝 Open</option>
					<option value="closed">🔒 Closed</option>
				</select>
				<select bind:value={filterIndustry} class="filter-select">
					<option value="all">Any Industry</option>
					{#each industries as ind}
						<option value={ind}>{ind}</option>
					{/each}
				</select>
			</div>
		</div>
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">
			Resulting in {filtered.length} matching leads
		</p>
	</div>

	<!-- Cards grid -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filtered as founder, i}
			<div
				class="group relative flex flex-col rounded-4xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-500/30 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
			>
				<!-- Online Badge -->
				{#if founder.online}
					<div class="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-500/10 px-2 py-1">
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
						<span class="text-[9px] font-black uppercase tracking-widest text-green-600">Online</span>
					</div>
				{/if}

				<!-- Avatar Header -->
				<div class="flex items-center gap-4 mb-6">
					<div
						class={`h-14 w-14 shrink-0 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xl font-black text-white shadow-lg transition-transform group-hover:scale-110 shadow-${avatarColors[i % avatarColors.length].split('-')[1]}-500/20`}
					>
						{founder.avatar}
					</div>
					<div class="min-w-0">
						<h3 class="font-black text-gray-900 dark:text-white truncate">{founder.name}</h3>
						<p class="text-[10px] font-black text-orange-500 uppercase tracking-tighter">ID: {founder.id}</p>
					</div>
				</div>

				<!-- Stats -->
				<div class="space-y-4 flex-1">
					<div>
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Business</p>
						<p class="text-sm font-bold text-gray-800 dark:text-gray-200">{founder.business}</p>
						<p class="text-xs font-medium text-gray-500">📍 {founder.location}</p>
					</div>

					<div>
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">About</p>
						<p class="line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">{founder.bio}</p>
					</div>

					<div class="flex flex-wrap gap-2">
						<span class={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${industryColors[founder.industry] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
							{founder.industry}
						</span>
						<span class={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${founder.collab === 'Open' ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
							{founder.collab === 'Open' ? '🤝 Open' : '🔒 Closed'}
						</span>
					</div>
				</div>

				<!-- Footer -->
				<div class="mt-6 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-4">
					<div class="flex items-center gap-1.5">
						<span class="text-lg">🤝</span>
						<span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{founder.connections} Conns</span>
					</div>
					<a
						href={`/admin/founders/${founder.id}`}
						class="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors"
					>View Profile →</a>
				</div>
			</div>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="py-24 text-center animate-in fade-in zoom-in duration-500">
			<div class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-5xl dark:bg-gray-800">🕵️</div>
			<h3 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">No Founders Found</h3>
			<p class="text-gray-500 font-bold">Try adjusting your filters or search query.</p>
		</div>
	{/if}
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
