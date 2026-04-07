<script>
	import { getCurrentUserId, getCurrentBusinessId, getCurrentProfile, isAuthenticated, setAuthFromResponse } from '$lib/stores/auth.svelte.js';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';

	let { children } = $props();
	let loadingAuth = $state(true);
	let navVisible = $state(true);
	let scrollY = $state(0);
	let lastScrollY = $state(0);
	let showMore = $state(false);
	
	// Reactive placeholders for UI elements that were previously in fake stores
	let newReqCount = $state(0);
	let profile = $derived(getCurrentProfile());
	let bizId = $derived(getCurrentBusinessId());

	let isHome = $derived(page.url.pathname === '/provider/home');
	let isAuthPage = $derived(
		[
			'/provider/login', 
			'/provider/register', 
			'/provider/status', 
			'/provider/businesses',
			'/forgot-password',
			'/reset-password',
			'/verify-otp'
		].includes(page.url.pathname)
	);

	onMount(async () => {
		if (isAuthPage || isHome) { loadingAuth = false; return; }

		// If store already populated (from login), skip /api/me
		if (isAuthenticated()) { loadingAuth = false; return; }

		// Page refresh — re-verify via cookie
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				const p = data.profile ?? data;
				if (p?.id && (data.role === 'founder' || data.role === 'provider' || data.role === 'staff' || p.biz_id)) {
					setAuthFromResponse({ profile: p, business: data.business, userid: p.id }, 'provider');
					loadingAuth = false;
					return;
				}
			}
		} catch (_) {}

		goto('/provider/login');
	});

	function handleTap() {
		if (isHome) return;
		navVisible = true;
	}

	$effect(() => {
		if (isHome) {
			if (scrollY > lastScrollY && scrollY > 50) {
				navVisible = false;
			} else if (scrollY < lastScrollY) {
				navVisible = true;
			}
			lastScrollY = scrollY;
		} else {
			navVisible = false;
		}
	});

	const sidebarItems = [
		{ href: '/provider/inventory',    icon: 'mdi:package-variant-closed',  label: 'Inventory',    short: 'Stock' },
		{ href: '/provider/messages',     icon: 'mdi:chat',                    label: 'Messages',     short: 'Chat', badge: 0 },
		{ href: '/provider/requirements', icon: 'mdi:clipboard-text',          label: 'Requirements', short: 'Reqs', badge: 0 },
		{ href: '/provider/profile',      icon: 'mdi:account-circle',          label: 'Profile',      short: 'Profile' },
		{ href: '/provider/settings',     icon: 'mdi:cog',                     label: 'Settings',     short: 'Settings' },
		{ href: '/provider/jobs',         icon: 'mdi:history',                 label: 'Active Jobs',  short: 'Jobs' },
		{ href: '/provider/notifications',icon: 'mdi:bell',                    label: 'Notifications',short: 'Alerts', badge: 0 }
	];

	const mobileMainNav = [
		{ href: '/provider/inventory',    icon: 'mdi:package-variant-closed',  label: 'Inventory',    short: 'Stock' },
		{ href: '/provider/messages',     icon: 'mdi:chat',                    label: 'Messages',     short: 'Chat', badge: 0 },
		{ href: '/provider/requirements', icon: 'mdi:clipboard-text',          label: 'Requirements', short: 'Reqs', badge: 0 },
		{ href: '/provider/profile',      icon: 'mdi:account-circle',          label: 'Profile',      short: 'Profile' }
	];

	const moreItems = [
		...sidebarItems.filter(i => !mobileMainNav.find(m => m.href === i.href)),
		{ href: '/provider/login', icon: 'mdi:logout', label: 'Sign Out', danger: true }
	];

	function isActive(href) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<svelte:window bind:scrollY={scrollY} onclick={handleTap} />

<div class="flex min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<!-- DESKTOP SIDEBAR -->
	<aside class={`fixed top-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-orange-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900 md:flex ${isAuthPage ? 'hidden' : ''}`}>
		<div class="border-b border-orange-200 p-6 dark:border-gray-800">
			<a href="/" class="text-2xl font-black"><span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span></a>
			<p class="mt-1 text-xs font-semibold text-orange-600 dark:text-orange-400">Business Portal</p>
		</div>
		<nav class="flex-1 space-y-1 overflow-y-auto p-4">
			{#each sidebarItems as item}
				<a href={item.href} class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(item.href) ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
					<Icon icon={item.icon} class="text-lg" /> <span class="flex-1">{item.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<!-- MOBILE HEADER -->
	<header class={`fixed top-0 right-0 left-0 z-30 flex items-center justify-between border-b border-orange-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden ${isAuthPage ? 'hidden' : ''}`}>
		<a href="/" class="text-xl font-black"><span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span></a>
		<div class="flex items-center gap-3">
			<a href="/provider/profile" class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-500/20">
				{profile?.name?.[0]?.toUpperCase() ?? profile?.founder_name?.[0]?.toUpperCase() ?? 'U'}
			</a>
		</div>
	</header>

	<!-- MAIN CONTENT -->
	<div class={`min-h-screen flex-1 transition-all ${isAuthPage ? 'pt-0 pb-0 md:ml-0' : 'pt-14 pb-24 md:ml-64 md:pt-0 md:pb-0'}`}>
		{#if loadingAuth && !isAuthPage}
			<div class="flex h-[80vh] items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>

	<!-- MOBILE BOTTOM NAV -->
	<div class={`fixed left-0 right-0 z-40 flex justify-center px-2 md:hidden transition-all duration-300 ${navVisible && !isAuthPage ? 'bottom-5 translate-y-0 opacity-100' : '-bottom-24 translate-y-full opacity-0'}`}>
		<nav class="flex items-center gap-0.5 rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-2 py-1.5 shadow-lg shadow-orange-500/30 backdrop-blur-sm">
			{#each mobileMainNav as item}
				<a href={item.href} class={`relative flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all ${isActive(item.href) ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20'}`}>
					<Icon icon={item.icon} class="text-lg leading-none" />
					<span class="text-[9px] font-bold tracking-wide leading-none">{item.short}</span>
				</a>
			{/each}
			<button onclick={() => (showMore = true)} class={`flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all ${showMore ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20'}`}>
				<Icon icon="mdi:dots-horizontal" class="text-lg leading-none" />
				<span class="text-[9px] font-bold tracking-wide leading-none">More</span>
			</button>
		</nav>
	</div>

	<!-- MORE SHEET -->
	{#if showMore}
		<button type="button" aria-label="Close menu" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" onclick={() => (showMore = false)}></button>
		<div class="fixed right-0 bottom-0 left-0 z-50 rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl transition-transform dark:border-gray-800 dark:bg-gray-900">
			<div class="flex justify-center pt-4 pb-2"><div class="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div></div>
			<div class="grid grid-cols-3 gap-3 p-6">
				{#each moreItems as item}
					<a href={item.href} onclick={() => (showMore = false)} class={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95 ${item.danger ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-gray-700 dark:text-gray-300'}`}>
						<Icon icon={item.icon} class="text-3xl" />
						<span class="text-center text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
					</a>
				{/each}
			</div>
			<div class="px-6 pb-8">
				<button onclick={() => (showMore = false)} class="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Close</button>
			</div>
		</div>
	{/if}
</div>
