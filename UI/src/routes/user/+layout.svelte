<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { getCurrentProfile, isAuthenticated } from '$lib/stores/auth.svelte.js';

	let { children } = $props();
	let showMore = $state(false);
	
	let scrollY = $state(0);
	let lastScrollY = $state(0);
	let navVisible = $state(true);
	let loadingAuth = $state(true);

	let isHome = $derived(page.url.pathname === '/user/home');
	let isAuthPage = $derived(
		page.url.pathname.includes('/user/login') || 
		page.url.pathname.includes('/user/register') || 
		page.url.pathname.includes('/forgot-password') || 
		page.url.pathname.includes('/reset-password') || 
		page.url.pathname.includes('/verify-otp')
	);

	let tapCount = 0;
	let tapTimeout;
	let tempNavTimeout;

	function handleTap() {
		if (isHome) return;
		tapCount++;
		clearInterval(tapTimeout);
		if (tapCount >= 3) {
			navVisible = true;
			clearTimeout(tempNavTimeout);
			tempNavTimeout = setTimeout(() => { navVisible = false; }, 5000);
			tapCount = 0;
		} else {
			tapTimeout = setTimeout(() => { tapCount = 0; }, 500);
		}
	}

	onMount(async () => {
		// Only verify auth by calling /api/me on protected pages (NOT on auth pages & home)
		if (isAuthPage) {
			loadingAuth = false;
			return;
		}

		// Check if the auth store already has a user (set from login/register response)
		if (isAuthenticated()) {
			loadingAuth = false;
			return;
		}

		// Auth store is empty (page refresh / direct link) – verify cookie via /api/me
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				const p = data.profile ?? data;
				if (p?.id) {
					setAuthFromResponse({ profile: p, userid: p.id }, 'user');
					loadingAuth = false;
					return;
				}
			}
		} catch (_) {}

		// Cookie invalid / expired → redirect to login
		goto('/user/login');
	});

	function handleLogout() {
		fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' }).finally(() => {
			goto('/');
		});
	}

	$effect(() => {
		if (isHome) {
			if (scrollY > lastScrollY && scrollY > 50) navVisible = false;
			else if (scrollY < lastScrollY) navVisible = true;
			lastScrollY = scrollY;
		} else {
			navVisible = false;
		}
	});

	// ── Required pages only ──────────────────────────────────────────────────
	const mainNav = [
		{ href: '/user/home',             icon: 'mdi:home',            label: 'Home' },
		{ href: '/user/search',           icon: 'mdi:magnify',         label: 'Search' },
		{ href: '/user/post-requirement', icon: 'mdi:clipboard-text',  label: 'Post' },
		{ href: '/user/messages',         icon: 'mdi:chat-processing', label: 'Messages' },
		{ href: '/user/quotes',           icon: 'mdi:file-document-outline', label: 'Quotes' }
	];

	const moreItems = [
		{ href: '/user/profile',   icon: 'mdi:account',        label: 'My Profile' },
		{ href: '/user/history',   icon: 'mdi:history',        label: 'History' },
		{ href: '/user/reviews',   icon: 'mdi:star-outline',   label: 'My Reviews' },
		{ href: '/user/reports',   icon: 'mdi:shield-check',   label: 'My Reports' },
		{ href: '/settings',       icon: 'mdi:cog',            label: 'Settings' },
		{ icon: 'mdi:logout', label: 'Sign Out', danger: true, action: handleLogout }
	];

	const desktopNav = [...mainNav, ...moreItems.slice(0, 2)];

	function isActive(href) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<svelte:window bind:scrollY={scrollY} onclick={handleTap} />

{#if isAuthPage}
	{@render children()}
{:else}
<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<!-- ─── DESKTOP TOP HEADER (md+) ─── -->
	<header
		class="sticky top-0 z-30 hidden items-center justify-between border-b border-orange-200 bg-white/95 px-8 py-4 backdrop-blur transition-colors dark:border-gray-800 dark:bg-gray-950/95 md:flex"
	>
		<a href="/user/home" class="text-2xl font-black">
			<span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span>
		</a>
		<nav class="flex items-center gap-1">
			{#each desktopNav as item}
				<a
					href={item.href}
					class={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${isActive(item.href) ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}
				>
					<Icon icon={item.icon} class="text-lg" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<a
			href="/user/profile"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-transform hover:scale-105"
		>
			<Icon icon="mdi:account" class="text-xl" />
		</a>
	</header>

	<!-- ─── MAIN CONTENT ─── -->
	<div class="pb-28 md:pb-0">
		{#if loadingAuth && !isAuthPage}
			<div class="flex h-[80vh] items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>

	<!-- ─── MOBILE BOTTOM NAV ─── -->
	<div class={`fixed left-0 right-0 z-40 flex justify-center px-4 md:hidden transition-all duration-300 ease-in-out ${navVisible ? 'bottom-5 translate-y-0 opacity-100' : '-bottom-24 translate-y-full opacity-0'}`}>
		<nav class="flex items-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-3 py-2 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.55)] backdrop-blur-sm">
			{#each mainNav as item}
				<a
					href={item.href}
					class={`relative flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-300 ${isActive(item.href) ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
				>
					<Icon icon={item.icon} class={`text-[20px] leading-none transition-transform duration-300 ${isActive(item.href) ? 'scale-110' : ''}`} />
					<span class={`text-[10px] font-semibold tracking-wide leading-none ${isActive(item.href) ? 'text-orange-600' : 'text-white/80'}`}>{item.label}</span>
				</a>
			{/each}

			<!-- More Button -->
			<button
				id="mobile-more-btn"
				onclick={() => (showMore = true)}
				class={`flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-300 ${showMore ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
			>
				<Icon icon="mdi:dots-horizontal" class="text-[20px] leading-none" />
				<span class="text-[10px] font-semibold tracking-wide leading-none text-white/80">More</span>
			</button>
		</nav>
	</div>

	<!-- ─── MORE BOTTOM SHEET ─── -->
	{#if showMore}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-50 w-full border-none bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
			onclick={() => (showMore = false)}
			aria-label="Close menu"
		></button>

		<!-- Sheet Panel -->
		<div
			class="fixed right-0 bottom-0 left-0 z-50 rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl transition-transform dark:border-gray-800 dark:bg-gray-900 md:hidden"
		>
			<div class="flex justify-center pt-4 pb-2">
				<div class="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
			</div>

			<div class="px-5 pb-2 pt-2">
				<p class="mb-3 text-xs font-bold tracking-wider text-orange-500 uppercase">More Options</p>
			</div>

			<!-- Grid Icons -->
			<div class="grid grid-cols-3 gap-3 px-4 pb-4">
				{#each moreItems as item}
					{#if item.action}
						<button
							onclick={() => { item.action(); showMore = false; }}
							class={`flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all active:scale-95 ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800'}`}
						>
							<Icon icon={item.icon} class="text-[28px] drop-shadow-sm transition-transform hover:scale-110" />
							<span class="text-center text-xs leading-tight font-semibold">{item.label}</span>
						</button>
					{:else}
						<a
							href={item.href}
							onclick={() => (showMore = false)}
							class={`flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all active:scale-95 ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800'}`}
						>
							<Icon icon={item.icon} class="text-[28px] drop-shadow-sm transition-transform hover:scale-110" />
							<span class="text-center text-xs leading-tight font-semibold">{item.label}</span>
						</a>
					{/if}
				{/each}
			</div>

			<div class="px-5 pt-2 pb-8">
				<button
					onclick={() => (showMore = false)}
					class="w-full rounded-2xl border border-gray-300 bg-gray-50 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>Close Menu</button
				>
			</div>
		</div>
	{/if}
</div>
{/if}
