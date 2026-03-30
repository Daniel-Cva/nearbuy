<script>
	import { page } from '$app/stores';
	const reportId = $page.params.id;

	// Mock report data
	const reports = {
		'REP-701': {
			id: 'REP-701',
			subject: 'Abusive Language in Requirement',
			target: 'REQ-002 (Priya M)',
			status: 'Resolved',
			action: 'User Warned',
			date: '2026-03-08',
			details: 'Requirement contained inappropriate terms for product request. The user used offensive language when asking about product availability and price negotiations.',
			timeline: [
				{ date: '2026-03-08 09:00 AM', event: 'Report Submitted by Krishna Electronics' },
				{ date: '2026-03-08 11:30 AM', event: 'Moderator Review Started' },
				{ date: '2026-03-08 12:45 PM', event: 'Violation Confirmed: Policy 4.2 (Harassment)' },
				{ date: '2026-03-08 01:00 PM', event: 'Warning Issued to User Priya M' },
				{ date: '2026-03-08 01:00 PM', event: 'Report Status Updated to Resolved' }
			]
		},
		'REP-705': {
			id: 'REP-705',
			subject: 'Spam Requirement',
			target: 'REQ-099 (Unknown)',
			status: 'Under Review',
			action: 'Pending',
			date: '2026-03-09',
			details: 'Repeated same request 5 times in 10 minutes. This behavior is cluttering the requirements feed and preventing genuine requests from being seen.',
			timeline: [
				{ date: '2026-03-09 10:15 AM', event: 'Report Submitted by Krishna Electronics' },
				{ date: '2026-03-09 10:30 AM', event: 'Automated Spam Detection Triggered' },
				{ date: '2026-03-09 11:00 AM', event: 'Queued for Human Verification' }
			]
		}
	};

	const report = reports[reportId] || reports['REP-701'];
</script>

<svelte:head>
	<title>Report Details — {report.id}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 shadow-sm">
		<a href="/provider/reports" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Reports</a>
		<h1 class="flex-1 font-bold text-gray-900 dark:text-white">Report #{report.id}</h1>
	</header>

	<div class="mx-auto max-w-2xl px-4 py-6 space-y-6">
		<!-- Main Info -->
		<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="mb-6 flex items-start justify-between">
				<div>
					<span class={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${
						report.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
						report.status === 'Under Review' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
						'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
					}`}>
						{report.status}
					</span>
					<h2 class="mt-3 text-2xl font-black text-gray-900 dark:text-white">{report.subject}</h2>
					<p class="mt-1 font-bold text-gray-500 dark:text-gray-400">Target: <span class="text-orange-500">{report.target}</span></p>
				</div>
				<div class="text-right">
					<p class="text-[10px] font-black uppercase text-gray-400">Reported On</p>
					<p class="font-bold text-gray-900 dark:text-white">{report.date}</p>
				</div>
			</div>

			<div class="rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
				<p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Detailed Reason</p>
				<p class="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300 italic">
					"{report.details}"
				</p>
			</div>

			<div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-6 dark:border-gray-800">
				<div>
					<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Final Action Taken</p>
					<p class="text-lg font-black text-gray-900 dark:text-white">{report.action}</p>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl shadow-inner dark:bg-orange-500/10">
					🛡️
				</div>
			</div>
		</div>

		<!-- Timeline -->
		<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h3 class="mb-5 font-black uppercase tracking-widest text-gray-900 dark:text-white text-sm">Case Timeline</h3>
			<div class="space-y-6">
				{#each report.timeline as event, i}
					<div class="relative flex gap-4">
						{#if i !== report.timeline.length - 1}
							<div class="absolute left-[7px] top-6 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>
						{/if}
						<div class={`relative z-10 h-4 w-4 rounded-full border-2 ${i === 0 ? 'bg-orange-500 border-white' : 'bg-gray-200 border-white dark:border-gray-900 dark:bg-gray-700'}`}></div>
						<div>
							<p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{event.date}</p>
							<p class="mt-0.5 text-sm font-bold text-gray-800 dark:text-gray-200">{event.event}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-center dark:border-blue-500/10 dark:bg-blue-500/5">
			<p class="text-xs font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
				This report is read-only. If you have further evidence, please contact support with the Case ID.
			</p>
		</div>
	</div>
</div>
