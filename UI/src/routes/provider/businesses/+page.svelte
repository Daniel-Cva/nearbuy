<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let loading      = $state(true);
	let errorMsg     = $state('');
	let profile      = $state(null);   // from /api/me
	let myBusiness   = $state(null);   // from /api/businesses/[bizId]

	onMount(async () => {
		try {
			// 1. Get my profile (DJ.md §2.1)
			const meRes = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!meRes.ok) throw new Error('Not authenticated');
			const me = await meRes.json();
			profile = me.profile ?? me.founder ?? me;
			
			const bizId = profile.biz_id ?? profile.business_id ?? '';
			if (!bizId) {
				loading = false;
				return; // Founder has no business yet
			}

			// 2. Load the specific business profile (DJ.md §3.1)
			const bizRes = await fetch(`${API_BASE_URL}/api/businesses/${bizId}`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (bizRes.ok) {
				myBusiness = await bizRes.json();
			} else {
				console.warn(`Could not load business ${bizId}`);
			}
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load business list.';
		} finally {
			loading = false;
		}
	});

	// Derived
	const businesses = $derived(myBusiness ? [myBusiness] : []);
</script>

<svelte:head>
	<title>My Businesses — NearBuy</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 pb-20">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-black text-gray-900 dark:text-white">My Business</h1>
			<p class="mt-2 text-gray-500 dark:text-gray-400">Manage your business profile and branches.</p>
		</div>
		{#if !myBusiness && !loading}
			<a href="/provider/register"
				class="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95">
				+ Register Business
			</a>
		{/if}
	</div>

	{#if loading}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _}
				<div class="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
			{/each}
		</div>
	{:else if errorMsg}
		<div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
			{errorMsg}
		</div>
	{:else if businesses.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
			<Icon icon="mdi:store-off-outline" width="64" height="64" class="text-gray-300 dark:text-gray-700 mb-4" />
			<h2 class="text-xl font-bold text-gray-900 dark:text-white">No Business Found</h2>
			<p class="text-gray-500 dark:text-gray-400 mt-2 max-w-sm px-6">You haven't registered a business yet. Create your first profile to start selling.</p>
			<a href="/provider/register" class="mt-6 rounded-xl bg-orange-500 px-8 py-3 font-bold text-white shadow-lg shadow-orange-500/30">Get Started</a>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each businesses as biz}
				<a href={`/provider/businesses/${biz.id}`}
					class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 shadow-sm">
					
					{#if biz.status === 'pending'}
						<div class="absolute top-4 right-4 z-10 rounded-full bg-yellow-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-md">
							Pending Approval
						</div>
					{/if}

					<div class="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
						{#if biz.avatar_url}
							<img src={toDisplayUrl(biz.avatar_url)} alt={biz.bname} class={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${biz.status === 'pending' ? 'grayscale opacity-50' : ''}`} />
						{:else}
							<div class="flex h-full items-center justify-center text-gray-300 dark:text-gray-700">
								<Icon icon="mdi:store" width="64" height="64" />
							</div>
						{/if}
					</div>

					<div class="p-6">
						<div class="mb-2 flex items-center justify-between">
							<span class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/10">ID: {biz.id}</span>
							{#if biz.status === 'approved' || biz.status === 'active'}
								<span class="flex items-center gap-1 text-sm font-bold text-yellow-500">⭐ {biz.rating || 0}</span>
							{:else}
								<span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Verification</span>
							{/if}
						</div>
						<h2 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase truncate">
							{biz.bname}
						</h2>
						{#if biz.about}
							<p class="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{biz.about}</p>
						{/if}

						<div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
							<div class="text-[10px] font-black uppercase text-gray-400 tracking-wider">
								{biz.city}, {biz.state}
							</div>
							<div class="text-[10px] font-black uppercase text-orange-500 tracking-wider">
								VIEW DETAILS →
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
