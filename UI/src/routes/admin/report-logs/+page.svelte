<script>
	const reports = [
		{
			id: 'RPT-0041',
			reporter: 'User #4821',
			reporterImage:
				'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
			target: 'Raj Mobile Works (BIZ-003)',
			targetImage:
				'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=120&q=80',
			reason: 'Fake listing / misleading information',
			detail: 'Advertised iPhone repairs but delivered unrelated parts. Dispute D-229 opened.',
			time: '2026-03-03 09:47',
			severity: 'high',
			status: 'under-review'
		},
		{
			id: 'RPT-0040',
			reporter: 'User #3109',
			reporterImage:
				'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
			target: 'Unknown Business #P-041',
			targetImage:
				'https://images.unsplash.com/photo-1611746869696-d09bce200020?auto=format&fit=crop&w=120&q=80',
			reason: 'Scam / fraud attempt',
			detail: 'Asked for advance payment outside app. Blocked and reported.',
			time: '2026-03-02 14:20',
			severity: 'critical',
			status: 'resolved'
		},
		{
			id: 'RPT-0039',
			reporter: 'Meera Devi (BIZ-002)',
			reporterImage:
				'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
			target: 'User #2018',
			targetImage:
				'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=120&q=80',
			reason: 'Abusive communication',
			detail: 'Sent harassing messages after quote rejection.',
			time: '2026-03-02 11:05',
			severity: 'medium',
			status: 'under-review'
		},
		{
			id: 'RPT-0038',
			reporter: 'User #6610',
			reporterImage:
				'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
			target: 'Anand Bakery (BIZ-006)',
			targetImage:
				'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=120&q=80',
			reason: 'Wrong product delivered',
			detail: 'Ordered veg cake, received non-veg. Refund pending.',
			time: '2026-03-01 17:30',
			severity: 'low',
			status: 'resolved'
		},
		{
			id: 'RPT-0037',
			reporter: 'User #1190',
			reporterImage:
				'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=80',
			target: 'Star Plumbing (BIZ-005)',
			targetImage:
				'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=120&q=80',
			reason: 'No-show / service not rendered',
			detail: 'Confirmed appointment at 10am, business never showed up.',
			time: '2026-03-01 13:15',
			severity: 'medium',
			status: 'dismissed'
		},
		{
			id: 'RPT-0036',
			reporter: 'System',
			reporterImage:
				'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=120&q=80',
			target: 'User #5502',
			targetImage:
				'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=80',
			reason: 'Spam requirement posts',
			detail: 'Posted 47 identical requirements within 2 hours. Auto-flagged.',
			time: '2026-02-28 22:00',
			severity: 'high',
			status: 'resolved'
		},
		{
			id: 'RPT-0035',
			reporter: 'User #7741',
			reporterImage:
				'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&w=120&q=80',
			target: 'NextGen Pharmacy (BIZ-007)',
			targetImage:
				'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=120&q=80',
			reason: 'Price gouging',
			detail: 'Charged 3x MRP on essential medication.',
			time: '2026-02-28 09:42',
			severity: 'high',
			status: 'under-review'
		}
	];

	const severityMap = {
		critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 border-red-200' },
		high: { label: 'High', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
		medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
		low: { label: 'Low', cls: 'bg-green-100 text-green-700 border-green-200' }
	};

	const statusMap = {
		'under-review': { label: 'Under Review', cls: 'bg-blue-100 text-blue-700' },
		resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
		dismissed: { label: 'Dismissed', cls: 'bg-gray-100 text-gray-700' }
	};

	let filterSeverity = $state('all');
	let filterStatus = $state('all');
	let search = $state('');
	let selected = $state(null);

	const filtered = $derived(
		reports.filter(
			(r) =>
				(filterSeverity === 'all' || r.severity === filterSeverity) &&
				(filterStatus === 'all' || r.status === filterStatus) &&
				(search === '' ||
					r.reason.toLowerCase().includes(search.toLowerCase()) ||
					r.target.toLowerCase().includes(search.toLowerCase()) ||
					r.reporter.toLowerCase().includes(search.toLowerCase()))
		)
	);
</script>

<svelte:head>
	<title>Report Log — NearBuy Admin</title>
	<meta
		name="description"
		content="View all user and system reports submitted on the NearBuy platform."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-7xl p-6 md:p-10">
	<!-- Header -->
	<div class="mb-8 flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Trust and Safety Desk</p>
			<h1 class="text-3xl font-black text-gray-900 dark:text-white">Report Log</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">Review incidents with media-rich context before adjudication.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<span
				class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
			>
				{reports.filter((r) => r.severity === 'critical').length} Critical
			</span>
			<span
				class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
			>
				{reports.filter((r) => r.status === 'under-review').length} Under Review
			</span>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex flex-wrap gap-3">
		<input
			type="search"
			bind:value={search}
			placeholder="Search by reporter, target, reason…"
			class="min-w-48 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
		/>
		<select bind:value={filterSeverity} class="filter-select">
			<option value="all">All Severity</option>
			<option value="critical">Critical</option>
			<option value="high">High</option>
			<option value="medium">Medium</option>
			<option value="low">Low</option>
		</select>
		<select bind:value={filterStatus} class="filter-select">
			<option value="all">All Status</option>
			<option value="under-review">Under Review</option>
			<option value="resolved">Resolved</option>
			<option value="dismissed">Dismissed</option>
		</select>
	</div>

	<!-- Report list -->
	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each filtered as report}
			<div
				role="button"
				tabindex="0"
				class={`w-full cursor-pointer rounded-3xl border bg-white p-5 transition-all hover:shadow-lg dark:bg-gray-900 ${selected?.id === report.id ? 'border-orange-500/50' : 'border-gray-100 dark:border-gray-800'}`}
				onclick={() => (selected = selected?.id === report.id ? null : report)}
				onkeydown={(e) =>
					e.key === 'Enter' && (selected = selected?.id === report.id ? null : report)}
			>
				<div class="mb-4 flex items-start justify-between gap-3">
					<div class="flex items-center gap-2">
						<img src={report.reporterImage} alt={report.reporter} class="h-10 w-10 rounded-full object-cover" loading="lazy" />
						<div>
							<p class="text-xs font-black text-gray-800 dark:text-gray-100">{report.reporter}</p>
							<p class="text-[10px] font-bold text-gray-500">{report.time}</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${severityMap[report.severity].cls}`}>{severityMap[report.severity].label}</span>
						<span
							class={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusMap[report.status].cls}`}
						>
							{statusMap[report.status].label}
						</span>
					</div>
				</div>

				<div class="mb-4 flex items-start gap-3">
					<img src={report.targetImage} alt={report.target} class="h-12 w-12 rounded-xl object-cover" loading="lazy" />
					<div class="min-w-0 text-left">
						<p class="font-black text-gray-900 dark:text-white">{report.reason}</p>
						<p class="mt-0.5 text-sm font-bold text-gray-500">Against: {report.target}</p>
						<p class="mt-0.5 font-mono text-[10px] text-gray-400">{report.id}</p>
					</div>
				</div>

				{#if selected?.id === report.id}
					<div class="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
						<p class="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Details</p>
						<p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{report.detail}</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<button
								type="button"
								class="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-all hover:bg-green-100"
								onclick={(e) => e.stopPropagation()}>Mark Resolved</button
							>
							<button
								type="button"
								class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100"
								onclick={(e) => e.stopPropagation()}>Suspend Target</button
							>
							<button
								type="button"
								class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100"
								onclick={(e) => e.stopPropagation()}>Dismiss</button
							>
						</div>
					</div>
				{/if}
			</div>
		{/each}

		{#if filtered.length === 0}
			<div class="py-20 text-center text-gray-500">
				<p class="font-medium">No reports match your filters.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.filter-select {
		border-radius: 0.75rem;
		border: 1px solid #d1d5db;
		background: #ffffff;
		padding: 0.5rem 0.875rem;
		color: #374151;
		font-size: 0.8rem;
		outline: none;
		cursor: pointer;
	}
	.filter-select:focus {
		border-color: #f97316;
	}

	:global(.dark) .filter-select {
		border-color: #374151;
		background: #111827;
		color: #d1d5db;
	}
</style>
