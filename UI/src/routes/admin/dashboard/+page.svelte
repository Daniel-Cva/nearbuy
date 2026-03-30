<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { initializeAuthFromServer } from '$lib/helpers/authInit.js';

	// ── State ────────────────────────────────────────────────────────────────
	let loading = $state(true);
	let stats = $state([
		{ label: 'Total Businesses', value: '0', icon: 'mdi:store', change: '+0', changeColor: 'text-green-600' },
		{ label: 'Active Users', value: '0', icon: 'mdi:account-group', change: '+0', changeColor: 'text-green-600' },
		{ label: 'Pending Verifications', value: '0', icon: 'mdi:timer-sand', change: '0 urgent', changeColor: 'text-red-500' },
		{ label: 'Total Orders', value: '0', icon: 'mdi:package-variant-closed', change: '+0', changeColor: 'text-orange-600' }
	]);

	let recentActivity = $state([
		{ text: 'System initialized. Waiting for real-time data...', time: 'Just now', icon: 'mdi:lightning-bolt' }
	]);

	// ── Load ─────────────────────────────────────────────────────────────────
	onMount(async () => {
		// As requested: in home page dont call api/me
		// This dashboard now acts as a static jump-pad to admin modules
		loading = false;
	});
</script>

<svelte:head>
	<title>Admin Dashboard — NearBuy Platform Authority</title>
	<meta name="description" content="NearBuy Platform Authority dashboard with analytics and activity monitoring." />
</svelte:head>

<div class="mx-auto w-full max-w-6xl p-6 md:p-10 space-y-10">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">System Live • Admin Session Active</p>
			</div>
			<h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Platform Command</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">
				Monitoring activities for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
			</p>
		</div>
		<div class="flex items-center gap-3">
			<button class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm hover:border-orange-500 transition-all">Download Report</button>
			<a
				href="/admin/business-requests"
				class="rounded-2xl bg-orange-500 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-400 shadow-lg shadow-orange-500/20 active:scale-95"
			>Review Requests</a>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as s}
			<div class="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-500/30 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
				<div class="absolute -right-4 -top-4 text-6xl opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12 select-none pointer-events-none">
					<Icon icon={s.icon} />
				</div>
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-2xl text-orange-500">
					<Icon icon={s.icon} />
				</div>
				<div class="space-y-1">
					<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
					<div class="flex items-baseline gap-2">
						<h3 class="text-3xl font-black text-gray-900 dark:text-white">{s.value}</h3>
						<span class={`text-[10px] font-bold ${s.changeColor}`}>{s.change}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main Activity Section -->
		<div class="lg:col-span-2 space-y-6">
			<div class="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
					<button class="text-xs font-bold text-orange-500 hover:underline">View All Logs</button>
				</div>
				<div class="space-y-2">
					{#each recentActivity as item}
						<div class="group flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-orange-50/50 dark:hover:bg-orange-500/5">
							<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-xl text-orange-500 transition-transform group-hover:scale-110">
								<Icon icon={item.icon} />
							</span>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-bold text-gray-800 dark:text-gray-200">{item.text}</p>
								<p class="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.time}</p>
							</div>
						</div>
					{:else}
						<div class="py-12 text-center text-gray-400">No recent activity logs.</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Quick Actions / System Health -->
		<div class="space-y-6">
			<div class="rounded-[32px] bg-linear-to-br from-orange-500 to-orange-600 p-8 shadow-[0_20px_40px_-12px_rgba(249,115,22,0.3)]">
				<h3 class="text-lg font-black text-white mb-2">Platform Health</h3>
				<p class="text-sm text-white/80 font-medium mb-6">All systems operational. Security protocols active.</p>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-white/90">API Latency</span>
						<span class="text-xs font-black text-white">24ms</span>
					</div>
					<div class="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
						<div class="h-full w-[95%] bg-white rounded-full"></div>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-white/90">Database Load</span>
						<span class="text-xs font-black text-white">4%</span>
					</div>
					<div class="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
						<div class="h-full w-[4%] bg-white rounded-full"></div>
					</div>
				</div>
				
				<button class="w-full mt-8 bg-black/10 hover:bg-black/20 text-white rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all">Review System Status</button>
			</div>

			<div class="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h2 class="text-lg font-black text-gray-900 dark:text-white mb-4">Quick Links</h2>
				<div class="grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-400">
					<a href="/admin/users" class="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 text-center hover:bg-orange-500 hover:text-white transition-all">
						<Icon icon="mdi:account-group" class="text-3xl" />
						<span class="text-[10px] font-black uppercase">Users</span>
					</a>
					<a href="/admin/businesses" class="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 text-center hover:bg-orange-500 hover:text-white transition-all">
						<Icon icon="mdi:store" class="text-3xl" />
						<span class="text-[10px] font-black uppercase">Biz</span>
					</a>
					<a href="/admin/advertisements" class="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 text-center hover:bg-orange-500 hover:text-white transition-all">
						<Icon icon="mdi:bullhorn" class="text-3xl" />
						<span class="text-[10px] font-black uppercase">Ads</span>
					</a>
					<a href="/admin/logs/sa" class="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 text-center hover:bg-orange-500 hover:text-white transition-all">
						<Icon icon="mdi:history" class="text-3xl" />
						<span class="text-[10px] font-black uppercase">Logs</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
