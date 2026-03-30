<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	// ── State ────────────────────────────────────────────────────────────────
	let loading      = $state(false); // No longer loading anything on mount
	let errorMsg     = $state('');
	
	let profile      = $state(null);   
	let bizData      = $state(null);   
	let items        = $state([]);     
	let staff        = $state([]);     
	
	// Mock stats for things without API endpoints yet (like requirements/orders)
	let newReqCount  = $state(0);
	let orderStats   = $state({ delivered: 0, revenue: 0 });

	// ── Load ─────────────────────────────────────────────────────────────────
	onMount(async () => {
		// As requested: in home page dont call api/me
		// We only provide navigation to sub-pages that will load their own data
	});

	// Calculated getters (with defaults since profile is null)
	const displayName = $derived(profile?.name ?? profile?.founder_name ?? 'Partner');
	const bizName     = $derived(bizData?.bname ?? 'My Business');
	const itemCount   = $derived(items.length);
	const staffCount   = $derived(staff.length);
</script>

<svelte:head>
	<title>Home — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="mx-auto max-w-4xl px-6 py-8">
		
		{#if loading}
			<div class="space-y-6">
				<div class="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
				<div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
					{#each Array(6) as _}
						<div class="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
					{/each}
				</div>
			</div>
		{:else if errorMsg}
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
				<Icon icon="mdi:alert-circle" width="48" height="48" class="mx-auto text-red-500 mb-2" />
				<h2 class="font-bold text-red-500">Initialization Failed</h2>
				<p class="text-sm text-red-600/70 mt-1">{errorMsg}</p>
				<button onclick={() => window.location.reload()} class="mt-4 rounded-xl bg-red-500 px-6 py-2 text-xs font-bold text-white">Retry</button>
			</div>
		{:else}
			<!-- Greeting -->
			<div class="mb-8">
				<div class="flex items-center gap-2">
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">{bizName}</h1>
					<Icon icon="mdi:store" class="text-2xl text-orange-500" />
				</div>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 italic">
					Welcome back, {displayName.split(' ')[0]}! Here's your business overview.
				</p>
			</div>

			<!-- Quick Stats -->
			<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
				<!-- Requirements -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="text-2xl font-black text-orange-500">{newReqCount}</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">New Requirements</div>
				</div>
				<!-- Rating -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="flex items-center justify-center gap-1 text-2xl font-black text-green-500">
						{bizData?.rating || 0} <Icon icon="mdi:star" class="text-yellow-500" />
					</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">Business Rating</div>
				</div>
				<!-- Items -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="text-2xl font-black text-blue-500">{itemCount}</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">Items Count</div>
				</div>
				<!-- Jobs -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="text-2xl font-black text-purple-500">{orderStats.delivered}</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">Successful Jobs</div>
				</div>
				<!-- Staff -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="text-2xl font-black text-pink-500">{staffCount}</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">Staff Members</div>
				</div>
				<!-- Revenue -->
				<div class="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-4 text-center">
					<div class="text-2xl font-black text-yellow-500">₹{(orderStats.revenue / 1000).toFixed(1)}k</div>
					<div class="mt-1 text-[10px] font-black text-gray-400 tracking-wider uppercase">Total Revenue</div>
				</div>
			</div>

			<!-- Navigation Grid -->
			<div class="grid gap-4 md:grid-cols-2">
				<a href="/provider/dashboard" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:view-dashboard" />
					</div>
					<div>
						<p class="font-bold text-gray-900 dark:text-white">Dashboard</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Analytics & sales graphs</p>
					</div>
				</a>
				<a href="/provider/inventory" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:package-variant-closed" />
					</div>
					<div>
						<p class="font-bold text-gray-900 dark:text-white">Inventory</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Products & services</p>
					</div>
				</a>
				<a href="/provider/requirements" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-green-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:clipboard-text" />
					</div>
					<div>
						<p class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
							Requirements 
							{#if newReqCount > 0}
								<span class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black tracking-wider text-white shadow-sm uppercase">{newReqCount} NEW</span>
							{/if}
						</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">User requests nearby</p>
					</div>
				</a>
				<a href="/provider/staff" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:account-group" />
					</div>
					<div>
						<p class="font-bold text-gray-900 dark:text-white">Staff</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Manage team members</p>
					</div>
				</a>
				<a href="/provider/founder/profile" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:crown" />
					</div>
					<div>
						<p class="font-bold text-gray-900 dark:text-white">Founder Profile</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Profile & settings</p>
					</div>
				</a>
				<a href="/provider/advertise" class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-pink-500/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-500/10 text-2xl transition-transform group-hover:scale-110">
						<Icon icon="mdi:bullhorn" />
					</div>
					<div>
						<p class="font-bold text-gray-900 dark:text-white">Advertise</p>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Push local ads</p>
					</div>
				</a>
			</div>
		{/if}

	</div>
</div>
