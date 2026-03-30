<script>
	let activeTab = $state('sales');

	const salesLogs = [
		{ id: 'LOG-1024', item: 'iPhone 15 Case', price: '₹750', method: 'UPI', time: '10:45 AM', date: 'Today' },
		{ id: 'LOG-1023', item: 'Samsung S24 Ultra Tempered', price: '₹450', method: 'Cash', time: '09:30 AM', date: 'Today' },
		{ id: 'LOG-1020', item: 'USB-C Cable 2m', price: '₹299', method: 'UPI', time: '05:15 PM', date: 'Yesterday' }
	];

	const staffLogs = [
		{ name: 'Arjun Das', action: 'Clocked In', time: '09:00 AM', date: 'Today' },
		{ name: 'Sita Ram', action: 'Added Inventory (15 items)', time: '10:15 AM', date: 'Today' },
		{ name: 'Arjun Das', action: 'Reported User REQ-002', time: '11:20 AM', date: 'Today' },
		{ name: 'Kiran K', action: 'Clocked Out', time: '08:00 PM', date: 'Yesterday' }
	];

	const collabLogs = [
		{ from: 'You', to: 'Meera Tailors', action: 'Requested Collaboration', time: '11:00 AM', date: 'Today' },
		{ from: 'Raj Mobiles', to: 'You', action: 'Replied to Message', time: '04:30 PM', date: 'Yesterday' },
		{ from: 'You', to: 'Pizza Hut', action: 'Shared Business Card', time: '02:15 PM', date: '2 days ago' }
	];
</script>

<svelte:head>
	<title>Business Logs — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
			<h1 class="font-bold text-gray-900 dark:text-white">Business Logs</h1>
		</div>
	</div>

	<div class="mx-auto max-w-2xl px-6 py-6 md:py-0 md:px-0">
		<!-- Tabs -->
		<div class="flex gap-2 p-1 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-2xl mb-8">
			{#each ['sales', 'staffs', 'collab'] as tab}
				<button 
					onclick={() => activeTab = tab}
					class={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
				>
					{tab}
				</button>
			{/each}
		</div>

		{#if activeTab === 'sales'}
			<div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
				{#each salesLogs as log}
					<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
						<div>
							<p class="text-xs font-bold text-gray-400 uppercase tracking-tight">#{log.id} · {log.date}</p>
							<h3 class="font-bold text-gray-900 dark:text-white">{log.item}</h3>
							<p class="text-xs text-gray-500">{log.time} · Via {log.method}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-black text-orange-500">{log.price}</p>
							<span class="text-[10px] font-bold text-green-500 uppercase">Success</span>
						</div>
					</div>
				{/each}
			</div>
		{:else if activeTab === 'staffs'}
			<div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
				{#each staffLogs as log}
					<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
						<div class="h-10 w-10 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-full flex items-center justify-center font-bold">
							{log.name[0]}
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-gray-900 dark:text-white text-sm">{log.name}</h3>
							<p class="text-xs text-gray-500">{log.action}</p>
						</div>
						<div class="text-right">
							<p class="text-[10px] font-bold text-gray-400 uppercase">{log.date}</p>
							<p class="text-[10px] font-medium text-gray-500">{log.time}</p>
						</div>
					</div>
				{/each}
			</div>
		{:else if activeTab === 'collab'}
			<div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
				{#each collabLogs as log}
					<div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
						<div class="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-2 mb-2">
							<p class="text-[10px] font-black uppercase text-orange-500 tracking-widest">{log.date} · {log.time}</p>
							<span class="text-[10px] font-bold text-gray-400">CONNECT LOG</span>
						</div>
						<div class="flex items-center justify-between gap-4">
							<div class="text-center flex-1">
								<p class="text-[10px] font-bold text-gray-400 uppercase mb-1">From</p>
								<p class="text-sm font-bold truncate">{log.from}</p>
							</div>
							<div class="text-gray-300">⚡</div>
							<div class="text-center flex-1">
								<p class="text-[10px] font-bold text-gray-400 uppercase mb-1">To</p>
								<p class="text-sm font-bold truncate">{log.to}</p>
							</div>
						</div>
						<p class="mt-3 text-xs text-center font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
							{log.action}
						</p>
					</div>
				{/each}
			</div>
		{/if}

		{#if (activeTab === 'sales' && salesLogs.length === 0) || (activeTab === 'staffs' && staffLogs.length === 0) || (activeTab === 'collab' && collabLogs.length === 0)}
			<div class="py-20 text-center opacity-40">
				<p class="text-4xl mb-4">📜</p>
				<p class="text-sm font-bold">No logs found for this section.</p>
			</div>
		{/if}
	</div>
</div>
