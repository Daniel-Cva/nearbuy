<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentUserId, getCurrentBusinessId, getCurrentProfile } from '$lib/stores/auth.svelte.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	// ── Props ────────────────────────────────────────────────────────────────
	const bizId = $page.params.id;

	// ── State ────────────────────────────────────────────────────────────────
	let business     = $state(null);
	let items        = $state([]);
	let loading      = $state(true);
	let errorMsg     = $state('');
	let activeTab    = $state('overview');
	
	let isEditing    = $state(false);
	let saving       = $state(false);
	let uploadError  = $state('');

	// ── Auth ─────────────────────────────────────────────────────────────────
	const profile     = $derived(getCurrentProfile());
	const isFounder   = $derived(profile?.id === business?.founder_id || profile?.biz_id === bizId);

	// ── Data Fetching ────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			await loadData();
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load business details.';
		} finally {
			loading = false;
		}
	});

	async function loadData() {
		// Parallel fetch for business and items
		const [bRes, iRes] = await Promise.all([
			fetch(`${API_BASE_URL}/api/businesses/${bizId}`, {
				credentials: 'include', headers: { 'Accept': 'application/json' }
			}),
			fetch(`${API_BASE_URL}/api/businesses/${bizId}/items`, {
				credentials: 'include', headers: { 'Accept': 'application/json' }
			})
		]);

		if (!bRes.ok) throw new Error(`Business not found (${bRes.status})`);
		business = await bRes.json();
		
		if (iRes.ok) {
			const iData = await iRes.json();
			items = iData.items ?? iData.data ?? iData ?? [];
		}
	}

	async function saveChanges() {
		saving = true;
		errorMsg = '';
		try {
			// DJ.md §3.2 (If profile update or biz update - currently §2.2 for founder profile)
			// Assuming there's a PATCH /api/businesses/[bizId] eventually.
			// For now, we'll just log or use what's available.
			isEditing = false;
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to save changes.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{business?.name || 'Business'} — NearBuy</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8 pb-32">
	{#if loading}
		<div class="space-y-8 animate-pulse">
			<div class="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800"></div>
			<div class="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="md:col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
				<div class="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
			</div>
		</div>
	{:else if errorMsg}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<Icon icon="mdi:alert-circle" width="64" height="64" class="text-red-500 mb-4" />
			<h2 class="text-2xl font-black text-gray-900 dark:text-white">Oops!</h2>
			<p class="text-gray-500 mt-2">{errorMsg}</p>
			<a href="/provider/home" class="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 font-bold text-white shadow-lg">Back Home</a>
		</div>
	{:else}
		<!-- Header / Breadcrumbs -->
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm text-gray-500">
				<a href="/provider/businesses" class="hover:text-orange-500">Businesses</a>
				<Icon icon="mdi:chevron-right" width="16" />
				<span class="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{business.name}</span>
			</div>
			<div class={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${business.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
				{business.status}
			</div>
		</div>

		<!-- Banner & Logo -->
		<div class="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="relative h-48 w-full bg-linear-to-r from-orange-400 to-orange-600 sm:h-64">
				<div class="absolute inset-0 bg-black/20"></div>
				<div class="absolute -bottom-12 left-8">
					<div class="h-24 w-24 rounded-2xl border-4 border-white bg-white shadow-lg dark:border-gray-900 sm:h-32 sm:w-32 overflow-hidden">
						{#if business.avatar_url}
							<img src={toDisplayUrl(business.avatar_url)} alt="Logo" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-orange-50 text-4xl">🏪</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="px-8 pt-16 pb-8">
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<h1 class="text-3xl font-black text-gray-900 dark:text-white">{business.name}</h1>
						<div class="mt-1 flex items-center gap-3">
							<span class="text-sm font-bold text-orange-500 uppercase">@{business.username || business.id}</span>
							<span class="flex items-center gap-1 text-sm font-bold text-yellow-500">⭐ {business.rating || 'N/A'}</span>
						</div>
					</div>
					{#if isFounder}
						<button onclick={() => isEditing = !isEditing}
							class="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
							{isEditing ? 'Save Profile' : 'Edit Profile'}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="mb-8 flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto hide-scrollbar">
			<button onclick={() => activeTab = 'overview'}
				class={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
				Overview
			</button>
			<button onclick={() => activeTab = 'items'}
				class={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'items' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
				Active Catalog ({items.length})
			</button>
		</div>

		{#if activeTab === 'overview'}
			<div class="grid gap-8 lg:grid-cols-3">
				<div class="lg:col-span-2 space-y-8">
					<section class="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
						<h2 class="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">Description</h2>
						<p class="leading-relaxed text-gray-600 dark:text-gray-400">{business.about || 'No description provided.'}</p>
					</section>

					<section class="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
						<h2 class="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">Recent Activity</h2>
						<div class="flex flex-col items-center justify-center py-10 opacity-40">
							<Icon icon="mdi:timeline-text-outline" width="48" height="48" />
							<p class="text-xs font-bold mt-2 uppercase tracking-tighter">No recent logs</p>
						</div>
					</section>
				</div>

				<div class="space-y-6">
					<div class="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
						<h3 class="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">Contact & Info</h3>
						<div class="space-y-4">
							<div class="flex items-start gap-3">
								<Icon icon="mdi:email-outline" class="mt-1 text-orange-500" />
								<div><p class="text-[10px] font-black uppercase text-gray-400">Email</p><p class="text-sm font-bold">{business.contact_email || 'Not listed'}</p></div>
							</div>
							<div class="flex items-start gap-3">
								<Icon icon="mdi:phone-outline" class="mt-1 text-orange-500" />
								<div><p class="text-[10px] font-black uppercase text-gray-400">Mobile</p><p class="text-sm font-bold">{business.contact_mobile || 'Not listed'}</p></div>
							</div>
							<div class="flex items-start gap-3">
								<Icon icon="mdi:map-marker-outline" class="mt-1 text-orange-500" />
								<div><p class="text-[10px] font-black uppercase text-gray-400">Address</p><p class="text-sm font-bold leading-snug">{business.address || 'Chennai, India'}</p></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each items as item}
					<div class="group overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 transition-all hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
						<div class="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800 mb-4">
							<img src={toDisplayUrl(item.image_urls?.[0])} alt={item.name} class="h-full w-full object-cover group-hover:scale-105 transition-transform" />
						</div>
						<h3 class="font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
						<div class="flex items-center justify-between">
							<span class="text-lg font-black text-orange-500">₹{item.price}</span>
							<span class="text-xs font-bold text-gray-400 uppercase">{item.category}</span>
						</div>
					</div>
				{/each}
				{#if items.length === 0}
					<div class="col-span-full py-20 text-center text-gray-400">No items found in catalog.</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
