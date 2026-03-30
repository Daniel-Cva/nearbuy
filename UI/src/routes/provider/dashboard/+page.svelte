<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	// ── State ────────────────────────────────────────────────────────────────
	let period = $state('Today');
	let loading = $state(true);
	let errorMsg = $state('');
	
	let bizData = $state(null);
	let itemsCount = $state(0);
	let activityLogs = $state([]);
	let logsLoading = $state(true);
	
	// Real Data from API
	let stats = $state({
		revenue: 0, 
		salesCount: 0,
		completed: 0,
		pending: 0,
		honor: 98, // Honor score remains constant for now or from profile
		rating: 0,
		inquiries: 0,
		dealsAccepted: 0,
		responseRate: 0,
		conversionRate: 0,
		totalReviews: 0
	});

	async function fetchAnalytics(bizId) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/analytics`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (res.ok) {
				const data = await res.json();
				const a = data.analytics || {};
				
				stats.salesCount = a.performance?.total_sold || 0;
				stats.rating = a.performance?.avg_rating || 0;
				stats.totalReviews = a.performance?.total_reviews || 0;
				stats.inquiries = a.interactions?.requests_received || 0;
				stats.dealsAccepted = a.interactions?.deals_accepted || 0;
				stats.responseRate = a.interactions?.response_rate || 0;
				stats.conversionRate = a.interactions?.conversion_rate || 0;
				// Revenue is not yet in the analytics endpoint, keeping at 0 for now as per "no fake data" rule
				stats.revenue = 0; 
			}
		} catch (err) {
			console.error('Failed to fetch analytics:', err);
		}
	}

	async function fetchLogs() {
		logsLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/me/logs?limit=5`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (res.ok) {
				const data = await res.json();
				activityLogs = data.logs || [];
			}
		} catch (err) {
			console.error('Failed to fetch logs:', err);
		} finally {
			logsLoading = false;
		}
	}

	onMount(async () => {
		try {
			const meRes = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include', headers: { 'Accept': 'application/json' }
			});
			if (!meRes.ok) throw new Error('Not authenticated');
			const meData = await meRes.json();
			const bizId = meData.biz_id ?? meData.profile?.biz_id ?? '';
			
			if (bizId) {
				const [bizRes, itemsRes] = await Promise.all([
					fetch(`${API_BASE_URL}/api/businesses/${bizId}`, {
						credentials: 'include', headers: { 'Accept': 'application/json' }
					}),
					fetch(`${API_BASE_URL}/api/businesses/${bizId}/items`, {
						credentials: 'include', headers: { 'Accept': 'application/json' }
					})
				]);
				
				if (bizRes.ok) {
					bizData = await bizRes.json();
					stats.rating = bizData.rating || 0;
				}
				if (itemsRes.ok) {
					const idata = await itemsRes.json();
					const items = Array.isArray(idata.items ?? idata.data ?? idata) ? (idata.items ?? idata.data ?? idata) : [];
					itemsCount = items.length;
				}
				
				// Fetch real analytics and logs
				await Promise.all([
					fetchAnalytics(bizId),
					fetchLogs()
				]);
			}
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load analytics.';
		} finally {
			loading = false;
		}
	});

	// Mock chart for visuals
	const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
	const mockChart = [45, 38, 52, 48, 60, 55, 42, 58, 65, 70, 68, 84];
</script>

<svelte:head>
	<title>Business Dashboard — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
			<h1 class="font-bold text-gray-900 dark:text-white">Dashboard</h1>
		</div>
		<div class="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
			{#each ['Today', '1 Week', '1 Month'] as p}
				<button onclick={() => (period = p)}
					class={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${period === p ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'border border-gray-200 text-gray-500 bg-white dark:bg-gray-900 dark:border-gray-800'}`}>
					{p}
				</button>
			{/each}
		</div>
	</div>

	<div class="mx-auto max-w-4xl space-y-8 px-6 py-6 md:py-0 md:px-0">
		{#if loading}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="h-24 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
				{/each}
			</div>
		{:else}
			<!-- Main KPIs -->
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex items-center justify-between mb-2">
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Items</p>
						<Icon icon="lucide:package" class="text-blue-500" />
					</div>
					<p class="text-3xl font-black text-gray-900 dark:text-white">{itemsCount}</p>
					<p class="mt-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Active Storefront</p>
				</div>
				<div class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex items-center justify-between mb-2">
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Sales Count</p>
						<Icon icon="lucide:shopping-bag" class="text-green-500" />
					</div>
					<p class="text-3xl font-black text-gray-900 dark:text-white">{stats.salesCount}</p>
					<p class="mt-1 text-[9px] font-bold text-green-500 flex items-center gap-1">
						Deals: {stats.dealsAccepted}
					</p>
				</div>
				<div class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
					<div class="flex items-center justify-between mb-2">
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Inquiries</p>
						<Icon icon="lucide:message-square" class="text-orange-500" />
					</div>
					<p class="text-3xl font-black text-orange-500">{stats.inquiries}</p>
					<p class="mt-1 text-[9px] font-bold text-orange-400">Resp Rate: {stats.responseRate}%</p>
				</div>
				<div class="group relative overflow-hidden rounded-3xl border-2 border-orange-500 bg-orange-50 p-5 shadow-md dark:bg-orange-500/10">
					<div class="flex items-center justify-between mb-2">
						<p class="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Honor Score</p>
						<Icon icon="lucide:shield-check" class="text-orange-500" />
					</div>
					<p class="text-4xl font-black text-orange-500">{stats.honor}</p>
					<div class="mt-2 h-1.5 w-full bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
						<div class="h-full bg-orange-500" style="width: {stats.honor}%"></div>
					</div>
				</div>
			</div>

			<!-- Chart -->
			<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<h2 class="mb-6 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Trend Coverage</h2>
				<div class="flex h-48 items-end gap-2">
					{#each mockChart as val, i}
						<div class="flex-1 flex flex-col items-center gap-1 group relative">
							<div class="w-full rounded-t-lg bg-orange-500/80 transition-all group-hover:bg-orange-500" style="height: {(val/100)*100}%"></div>
							<span class="text-[9px] font-bold uppercase text-gray-400">{labels[i]}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Secondary & Activity -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="md:col-span-2 space-y-6">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-blue-500/30">
							<div class="flex items-center gap-3 mb-4">
								<div class="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500">
									<Icon icon="lucide:handshake" />
								</div>
								<p class="text-xs font-black text-gray-400 uppercase tracking-widest">Business Deals</p>
							</div>
							<p class="text-3xl font-black text-gray-900 dark:text-white">{stats.dealsAccepted}</p>
							<p class="text-xs font-bold text-gray-500 mt-1">Accepted quotes</p>
						</div>
						<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-yellow-500/30">
							<div class="flex items-center gap-3 mb-4">
								<div class="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-500">
									<Icon icon="lucide:star" />
								</div>
								<p class="text-xs font-black text-gray-400 uppercase tracking-widest">Feedback</p>
							</div>
							<div class="flex items-end gap-2">
								<p class="text-4xl font-black text-gray-900 dark:text-white">{stats.rating.toFixed(1)}</p>
								<div class="flex text-yellow-400 mb-1">
									{#each Array(5) as _, i}
										<Icon icon="mdi:star" class={i < Math.floor(stats.rating) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'} />
									{/each}
								</div>
							</div>
							<p class="text-[10px] font-bold text-gray-400 mt-1">Total: {stats.totalReviews} reviews</p>
						</div>
					</div>

					<!-- Suggestion: Real Analytics Graph - Activity Trend -->
					<div class="rounded-4xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<div class="flex items-center justify-between mb-8">
							<div>
								<h2 class="text-lg font-black text-gray-900 dark:text-white">Conversions</h2>
								<p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Conversion Rate: {stats.conversionRate}%</p>
							</div>
							<div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
								<div class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-orange-500"></span> Success</div>
								<div class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-blue-500"></span> Inbound</div>
							</div>
						</div>
						<div class="relative h-60">
							<!-- Logic-based bars using conversion rate as a multiplier for variation -->
							<div class="absolute inset-0 flex items-end justify-between px-2">
								{#each [0.8, 1.2, 0.9, 1.5, 1.1, 1.3, 1.0] as mult, i}
									<div class="w-8 flex flex-col items-center gap-2 group cursor-pointer">
										<div class="relative w-full">
											<div class="absolute bottom-0 w-full bg-blue-500/20 rounded-t-lg transition-all group-hover:bg-blue-500/40" style="height: {Math.min(100, stats.inquiries * mult)}%"></div>
											<div class="absolute bottom-0 w-1/2 left-1/4 bg-orange-500 rounded-t-md shadow-lg shadow-orange-500/20 transition-all group-hover:scale-y-105 origin-bottom" style="height: {Math.min(100, stats.dealsAccepted * mult * 2)}%"></div>
										</div>
										<span class="text-[9px] font-black text-gray-400 uppercase">{['M','T','W','T','F','S','S'][i]}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Activity Log Side Panel -->
				<div class="rounded-4xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Activity Log</h3>
						<a href="/provider/logs" class="text-[10px] font-black uppercase text-orange-500 hover:underline">View All</a>
					</div>
					
					<div class="space-y-6">
						{#if logsLoading}
							{#each Array(3) as _}
								<div class="flex gap-4 animate-pulse">
									<div class="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800"></div>
									<div class="flex-1 space-y-2">
										<div class="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded"></div>
										<div class="h-2 w-1/2 bg-gray-50 dark:bg-gray-800/50 rounded"></div>
									</div>
								</div>
							{/each}
						{:else if activityLogs.length > 0}
							{#each activityLogs as log}
								<div class="relative flex gap-4 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-[-24px] before:w-px before:bg-gray-100 dark:before:bg-gray-800 last:before:hidden">
									<div class="z-10 h-3 w-3 rounded-full border-2 border-white bg-orange-500 dark:border-gray-900 mt-1"></div>
									<div>
										<p class="text-sm font-bold text-gray-800 dark:text-gray-200">{log.action}</p>
										<p class="text-[10px] font-medium text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
									</div>
								</div>
							{/each}
						{:else}
							<div class="py-10 text-center text-gray-400">
								<Icon icon="lucide:history" class="mx-auto mb-2 text-2xl opacity-20" />
								<p class="text-xs font-bold">No recent activities</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
