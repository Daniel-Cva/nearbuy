<script>
	import { initializeAuthFromServer } from '$lib/helpers/authInit.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import { clearAdminSession } from '$lib/helpers/adminAuth.js';
	import { getCurrentUserId, getCurrentBusinessId, getCurrentProfile } from '$lib/stores/auth.svelte.js';

	let { children } = $props();
	let loadingAuth = $state(true);
	let showMore = $state(false);
	
	let scrollY = $state(0);
	let lastScrollY = $state(0);
	let navVisible = $state(true);
	let newReqCount = $state(0);
	let profile = $derived(getCurrentProfile());
	let bizId = $derived(getCurrentBusinessId());

	let isHome = $derived(page.url.pathname === '/admin/dashboard');
	let isAuthPage = $derived(
		page.url.pathname.includes('/admin/login') || 
		page.url.pathname.includes('/forgot-password') || 
		page.url.pathname.includes('/reset-password') || 
		page.url.pathname.includes('/verify-otp')
	);

	function isActive(href) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	onMount(async () => {
		try {
			// Skip calling /api/me on the home page as requested by user feedback
			if (isHome) {
				loadingAuth = false;
				return;
			}

			const result = await initializeAuthFromServer();
			
			if (isAuthPage) {
				// If already logged in and on login/register page, go to dashboard
				if (result.success && result.role === 'admin') {
					goto('/admin/dashboard');
				} else {
					loadingAuth = false;
				}
				return;
			}

			if (!result.success || result.role !== 'admin') {
				goto('/admin/login');
			} else {
				loadingAuth = false;
			}
		} catch (err) {
			console.error('Admin layout auth initialization error:', err);
			if (!isAuthPage && !isHome) goto('/admin/login');
			else loadingAuth = false;
		}
	});

	let tapCount = 0;
	let tapTimeout;
	let tempNavTimeout;

	function handleTap() {
		if (isHome) return;
		tapCount++;
		clearTimeout(tapTimeout);
		if (tapCount >= 3) {
			navVisible = true;
			clearTimeout(tempNavTimeout);
			tempNavTimeout = setTimeout(() => {
				navVisible = false;
			}, 5000);
			tapCount = 0;
		} else {
			tapTimeout = setTimeout(() => {
				tapCount = 0;
			}, 500);
		}
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

	const sidebarSections = [
		{
			label: 'Super Admin',
			items: [
				{ href: '/admin/dashboard', icon: 'mdi:view-dashboard', label: 'Dashboard' },
				{ href: '/admin/business-requests', icon: 'mdi:clipboard-text', label: 'Business Request' },
				{ href: '/admin/founders', icon: 'mdi:handshake', label: 'Founders' },
				{ href: '/admin/businesses', icon: 'mdi:store', label: 'Businesses' },
				{ href: '/admin/users', icon: 'mdi:account-group', label: 'Users' },
				{ href: '/admin/logs?scope=users', icon: 'mdi:receipt', label: 'Users Activities' },
				{ href: '/admin/logs?scope=businesses', icon: 'mdi:office-building', label: 'Business Activities' },
				{ href: '/admin/logs?scope=sa', icon: 'mdi:shield-check', label: 'SA Activities' },
				{ href: '/settings', icon: 'mdi:cog', label: 'Settings' },
				{ href: '/admin/report-logs', icon: 'mdi:alert', label: 'Reports' }
			]
		}
	];

	// flat list for mobile nav
	const allItems = sidebarSections.flatMap((s) => s.items);
	const mobileMainNav = [
		{ href: '/admin/dashboard', icon: 'mdi:view-dashboard', label: 'Dashboard' },
		{ href: '/admin/business-requests', icon: 'mdi:clipboard-text', label: 'Request' },
		{ href: '/admin/founders', icon: 'mdi:handshake', label: 'Founders' },
		{ href: '/admin/businesses', icon: 'mdi:store', label: 'Businesses' }
	];
	const moreItems = [
		{ href: '/admin/users', icon: 'mdi:account-group', label: 'Users' },
		{ href: '/admin/logs?scope=users', icon: 'mdi:receipt', label: 'Users Activities' },
		{ href: '/admin/logs?scope=businesses', icon: 'mdi:office-building', label: 'Business Activities' },
		{ href: '/admin/logs?scope=sa', icon: 'mdi:shield-check', label: 'SA Activities' },
		{ href: '/settings', icon: 'mdi:cog', label: 'Settings' },
		{ href: '/admin/report-logs', icon: 'mdi:alert', label: 'Reports' },
		{ href: '/admin/login', icon: 'mdi:logout', label: 'Sign Out', danger: true, action: handleAdminSignOut }
	];


	function handleAdminSignOut() {
		clearAdminSession();
	}

	function handleMoreItemClick(item) {
		if (item?.danger) {
			handleAdminSignOut();
		}
		showMore = false;
	}
</script>

<svelte:window bind:scrollY={scrollY} onclick={handleTap} />

<div class="flex min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<!-- ─── DESKTOP SIDEBAR (md+) ─── -->
	<aside
		class={`fixed top-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-950 md:flex ${isAuthPage ? '-translate-x-full' : ''}`}
	>
		<!-- Logo -->
		<div class="border-b border-gray-100 p-6 dark:border-gray-800">
			<a href="/" class="text-2xl font-black">
				<span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span>
			</a>
			<div
				class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-0.5"
			>
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-orange-600">Admin Shell</p>
			</div>
		</div>

		<!-- Nav sections -->
		<nav class="flex-1 space-y-6 overflow-y-auto px-4 py-6">
			{#each sidebarSections as section}
				<div>
					<p class="mb-2 px-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
						{section.label}
					</p>
					<div class="space-y-1">
						{#each section.items as item}
							<a
								href={item.href}
								class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${isActive(item.href) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'}`}
							>
								<Icon icon={item.icon} class="text-lg" />
								<span>{item.label}</span>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="space-y-1 border-t border-gray-100 p-4 dark:border-gray-800">
			<a
				href="/settings"
				class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-800/50"
				><Icon icon="mdi:cog" class="text-lg" /> Settings</a
			>
			<a
				href="/admin/login"
				onclick={handleAdminSignOut}
				class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10"
				><Icon icon="mdi:logout" class="text-lg" /> Sign Out</a
			>
		</div>
	</aside>

	<!-- ─── MOBILE TOP HEADER ─── -->
	<header
		class="fixed top-0 right-0 left-0 z-30 flex items-center justify-between border-b border-orange-200 bg-white/95 px-4 py-3 backdrop-blur transition-colors dark:border-gray-800 dark:bg-gray-900/95 md:hidden"
	>
		<a href="/" class="text-xl font-black">
			<span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span>
		</a>
		<span
			class="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
			>🛡️ Super Admin</span
		>
	</header>

	<!-- ─── MAIN CONTENT ─── -->
	<div class="min-h-screen flex-1 pt-15 pb-20 md:ml-64 md:pt-0 md:pb-0">
		{#if loadingAuth && !isAuthPage}
			<div class="flex h-[80vh] items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>

	<!-- ─── MOBILE BOTTOM NAV — Floating Pill ─── -->
	<div class={`fixed left-0 right-0 z-40 flex justify-center px-4 md:hidden transition-all duration-300 ease-in-out ${navVisible ? 'bottom-5 translate-y-0 opacity-100' : '-bottom-24 translate-y-full opacity-0'}`}>
		<nav class="flex items-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-3 py-2 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.55)] backdrop-blur-sm">
			{#each mobileMainNav as item}
				<a
					href={item.href}
					class={`flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-300 ${isActive(item.href) ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
				>
					<Icon icon={item.icon} class={`text-[20px] leading-none transition-transform duration-300 ${isActive(item.href) ? 'scale-110' : ''}`} />
					<span class={`text-[10px] font-semibold tracking-wide leading-none ${isActive(item.href) ? 'text-orange-600' : 'text-white/80'}`}>{item.label}</span>
				</a>
			{/each}
			<button
				id="admin-more-btn"
				onclick={() => (showMore = true)}
				class={`flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-300 ${showMore ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
			>
				<Icon icon="mdi:dots-horizontal" class="text-[20px] leading-none" />
				<span class="text-[10px] font-semibold tracking-wide leading-none text-white/80">More</span>
			</button>
		</nav>
	</div>

	<!-- ─── MORE SHEET ─── -->
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
			<div class="grid grid-cols-3 gap-3 px-4 pb-4">
				{#each moreItems as item}
					<a
						href={item.href}
						onclick={() => handleMoreItemClick(item)}
						class={`flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all active:scale-95 ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800'}`}
					>
						<Icon icon={item.icon} class="text-[28px] drop-shadow-sm transition-transform hover:scale-110" />
						<span class="text-center text-xs leading-tight font-semibold">{item.label}</span>
					</a>
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
