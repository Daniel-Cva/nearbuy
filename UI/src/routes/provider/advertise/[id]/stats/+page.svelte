<script>
	import { page } from '$app/stores';
	const id = $page.params.id;

	// Mock stats data based on ID
	const adStats = {
		id: id,
		title: id === 'AD-101' ? '20% Off on All Mobiles!' : 'Advertisement Campaign',
		status: 'active',
		impressions: 12450,
		clicks: 843,
		ctr: '6.7%',
		spend: 350,
		reach: '5km',
		dailyData: [
			{ day: 'Mon', views: 1200, clicks: 80 },
			{ day: 'Tue', views: 1800, clicks: 120 },
			{ day: 'Wed', views: 1500, clicks: 100 },
			{ day: 'Thu', views: 2200, clicks: 160 },
			{ day: 'Fri', views: 2800, clicks: 210 },
			{ day: 'Sat', views: 3200, clicks: 280 },
			{ day: 'Sun', views: 2400, clicks: 190 }
		]
	};

	let maxViews = Math.max(...adStats.dailyData.map(d => d.views));
</script>

<svelte:head>
	<title>Ad Stats: {adStats.id} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-20">
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-6 md:py-6">
		<div class="flex items-center gap-4">
			<a href="/provider/advertise" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Ads</a>
			<div>
				<h1 class="font-bold text-gray-900 dark:text-white">Campaign Stats</h1>
				<p class="text-xs text-gray-400">{adStats.id}</p>
			</div>
		</div>
		<span class="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase text-green-700 dark:bg-green-500/20 dark:text-green-400">
			{adStats.status}
		</span>
	</div>

	<div class="mx-auto max-w-3xl px-6 py-6 md:px-6 md:py-0">
		<div class="mb-8">
			<h2 class="text-2xl font-black text-gray-900 dark:text-white">{adStats.title}</h2>
			<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Overview of your campaign's performance.</p>
		</div>

		<!-- Super Stats Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 mb-3 text-lg">
					👁️
				</div>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-80">Impressions</p>
				<p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{adStats.impressions.toLocaleString()}</p>
			</div>
			
			<div class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 mb-3 text-lg">
					👆
				</div>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-80">Total Clicks</p>
				<p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{adStats.clicks.toLocaleString()}</p>
			</div>
			
			<div class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 mb-3 text-lg">
					📈
				</div>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-80">Click Rate (CTR)</p>
				<p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{adStats.ctr}</p>
			</div>
			
			<div class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-500/10 mb-3 text-lg">
					💸
				</div>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-80">Amount Spent</p>
				<p class="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{adStats.spend}</p>
			</div>
		</div>

		<!-- Main Chart Area -->
		<div class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
			<div class="mb-8 flex items-end justify-between">
				<div>
					<h3 class="text-lg font-bold text-gray-900 dark:text-white">Weekly Engagement</h3>
					<p class="text-xs text-gray-500">Impressions vs Clicks over the last 7 days</p>
				</div>
				<div class="text-right">
					<p class="text-[10px] font-black uppercase text-gray-400">Peak Day</p>
					<p class="text-sm font-bold text-orange-500">Saturday</p>
				</div>
			</div>

			<!-- Fancy CSS Bar Chart -->
			<div class="relative h-64 w-full flex items-end justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
				{#each adStats.dailyData as data}
					{@const viewHeight = (data.views / maxViews) * 100}
					<div class="group relative flex w-full flex-col items-center justify-end h-full">
						
						<!-- Hover Tooltip -->
						<div class="absolute -top-10 z-20 hidden flex-col items-center group-hover:flex">
							<div class="rounded-lg bg-gray-900 px-3 py-1.5 text-center text-[10px] font-bold text-white shadow-xl dark:bg-gray-800">
								<p class="text-gray-300 mb-0.5">{data.day}</p>
								<p>{data.views} views</p>
								<p class="text-orange-400">{data.clicks} clicks</p>
							</div>
							<div class="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-800"></div>
						</div>

						<!-- Views Bar (Background) -->
						<div 
							class="w-full max-w-[40px] rounded-t-xl bg-orange-100 transition-all duration-500 group-hover:bg-orange-200 dark:bg-orange-500/20 dark:group-hover:bg-orange-500/30 relative flex items-end justify-center"
							style="height: {viewHeight}%"
						>
							<!-- Clicks Bar (Foreground Core) -->
							<div 
								class="w-2/3 rounded-t-md bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-500 group-hover:bg-orange-400"
								style="height: {(data.clicks / data.views) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
			
			<!-- X-Axis Labels -->
			<div class="flex justify-between mt-3 px-1">
				{#each adStats.dailyData as data}
					<div class="w-full text-center text-xs font-bold text-gray-400">{data.day}</div>
				{/each}
			</div>
			
			<!-- Legend -->
			<div class="mt-6 flex justify-center gap-6 border-t border-gray-50 dark:border-gray-800 pt-5">
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded bg-orange-100 dark:bg-orange-500/20"></div>
					<span class="text-xs font-bold text-gray-500">Ad Views</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
					<span class="text-xs font-bold text-gray-500">Ad Clicks</span>
				</div>
			</div>
		</div>
	</div>
</div>
