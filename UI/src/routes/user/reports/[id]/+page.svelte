<script>
	import { page } from '$app/stores';
	const id = $page.params.id;

	// Mock data matching the list
	let report = $state(null);
	
	if (id === 'UREP-502') {
		report = { 
			id: 'UREP-502', 
			subject: 'Inaccurate Product Price', 
			target: 'Krishna Electronics', 
			status: 'Under Review', 
			action: 'Pending Verification', 
			date: '2026-03-09',
			details: 'The price listed on the app was ₹750, but the shop asked for ₹850.'
		};
	} else if (id === 'UREP-488') {
		report = { 
			id: 'UREP-488', 
			subject: 'Unauthorized Business', 
			target: 'Fake Mobiles Ltd', 
			status: 'Resolved', 
			action: 'Business Removed', 
			date: '2026-03-01',
			details: 'This business does not exist at the specified location.'
		};
	} else {
		report = { 
			id: id, 
			subject: 'Issue Report', 
			target: 'Selected Business', 
			status: 'Under Review', 
			action: 'Pending Assignment', 
			date: '2026-03-12',
			details: 'A detail statement regarding this report.'
		};
	}
</script>

<svelte:head>
	<title>Report {report.id} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-6 md:py-6">
		<a href="/user/reports" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back to Reports</a>
		<h1 class="flex-1 font-bold text-center pr-8">Report Details</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 md:px-0">
		<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
			<!-- Visual accent block based on status -->
			<div class={`absolute top-0 left-0 w-full h-2 ${report.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

			<!-- Status header -->
			<div class="flex flex-col items-center justify-center pt-4 pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
				<div class={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner ${
					report.status === 'Resolved' ? 'bg-green-100 dark:bg-green-500/20 text-green-500' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-500'
				}`}>
					{report.status === 'Resolved' ? '✅' : '⏳'}
				</div>
				<h2 class="text-xl font-black text-gray-900 dark:text-white">{report.status}</h2>
				<p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Report ID: {report.id}</p>
			</div>

			<!-- Core Info -->
			<div class="space-y-5">
				<div>
					<p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Subject</p>
					<p class="font-bold text-gray-900 dark:text-white">{report.subject}</p>
				</div>
				
				<div class="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					<div>
						<p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Reported Business</p>
						<p class="text-sm font-bold text-orange-600 dark:text-orange-400">{report.target}</p>
					</div>
					<div class="text-right">
						<p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Submitted On</p>
						<p class="text-sm font-bold text-gray-700 dark:text-gray-300">{report.date}</p>
					</div>
				</div>

				<div>
					<p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Detailed Issue</p>
					<div class="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-800 italic">
						"{report.details}"
					</div>
				</div>

				<div class="pt-4 mt-2">
					<p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Action Attempted</p>
					<div class="flex items-center gap-3">
						<span class={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs shadow-sm ${
							report.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
						}`}>
							{report.status === 'Resolved' ? '✓' : '⚙️'}
						</span>
						<p class="font-bold text-gray-900 dark:text-white">{report.action}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Support Notice -->
		<div class="mt-6 flex gap-4 p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-3xl">
			<div class="text-2xl pt-1">🛡️</div>
			<div>
				<h3 class="font-bold text-orange-800 dark:text-orange-300 mb-1">NearBuy Trust & Safety</h3>
				<p class="text-xs text-orange-600/80 dark:text-orange-400/80 leading-relaxed font-medium">We take reports extremely seriously. Our moderation team reviews every ticket to ensure local businesses maintain high quality standards.</p>
			</div>
		</div>
	</div>
</div>
