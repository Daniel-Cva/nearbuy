<script>
	const queue = [
		{
			id: 'BIZ-001',
			name: 'Krishna Electronics',
			type: 'Product',
			owner: 'Ravi Kumar',
			location: 'Chennai, TN',
			submitted: '2026-03-01',
			priority: 'high',
			docCount: 3,
			status: 'pending'
		},
		{
			id: 'BIZ-002',
			name: 'Meera Tailors',
			type: 'Service',
			owner: 'Meera Devi',
			location: 'Coimbatore, TN',
			submitted: '2026-03-02',
			priority: 'normal',
			docCount: 4,
			status: 'pending'
		},
		{
			id: 'BIZ-003',
			name: 'Raj Mobile Works',
			type: 'Both',
			owner: 'Raj Arjun',
			location: 'Madurai, TN',
			submitted: '2026-03-02',
			priority: 'critical',
			docCount: 5,
			status: 'pending'
		},
		{
			id: 'BIZ-004',
			name: 'Lakshmi Grocery',
			type: 'Product',
			owner: 'Lakshmi S',
			location: 'Salem, TN',
			submitted: '2026-03-03',
			priority: 'normal',
			docCount: 3,
			status: 'under-review'
		},
		{
			id: 'BIZ-005',
			name: 'Star Plumbing',
			type: 'Service',
			owner: 'Murugan P',
			location: 'Trichy, TN',
			submitted: '2026-03-03',
			priority: 'high',
			docCount: 2,
			status: 'under-review'
		}
	];

	let search = $state('');
	let filterType = $state('all');
	let filterPriority = $state('all');
	let sortBy = $state('submitted');

	const typeIcon = {
		Product: '📦',
		Service: '🔧',
		Both: '📦🔧'
	};

	const priorityStyles = {
		critical: 'bg-red-500/10 text-red-600 border-red-500/20',
		high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
		normal: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
	};

	const statusStyles = {
		pending: 'text-orange-600',
		'under-review': 'text-blue-600'
	};

	const filtered = $derived(
		queue
			.filter(
				(item) =>
					(filterType === 'all' || item.type.toLowerCase() === filterType || (filterType === 'both' && item.type === 'Both')) &&
					(filterPriority === 'all' || item.priority === filterPriority) &&
					(search === '' ||
						item.name.toLowerCase().includes(search.toLowerCase()) ||
						item.owner.toLowerCase().includes(search.toLowerCase()) ||
						item.location.toLowerCase().includes(search.toLowerCase()) ||
						item.id.toLowerCase().includes(search.toLowerCase()))
			)
			.sort((a, b) => {
				if (sortBy === 'priority') {
					const priorityWeight = { critical: 3, high: 2, normal: 1 };
					return priorityWeight[b.priority] - priorityWeight[a.priority];
				}
				return new Date(b.submitted) - new Date(a.submitted);
			})
	);
</script>

<svelte:head>
	<title>Inspect Business Queue - NearBuy Admin</title>
	<meta
		name="description"
		content="Review and inspect submitted business onboarding profiles before final adjudication."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-7xl p-6 md:p-10">
	<div class="mb-10 flex flex-wrap items-start justify-between gap-6">
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span class="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Super Admin Verification Desk</p>
			</div>
			<h1 class="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Inspect Business</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">Prioritize risky applications and open a detailed inspection view.</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2">
				<p class="text-[10px] font-black uppercase tracking-widest text-red-600">Critical</p>
				<p class="text-xl font-black text-red-600">{queue.filter((item) => item.priority === 'critical').length}</p>
			</div>
			<div class="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2">
				<p class="text-[10px] font-black uppercase tracking-widest text-orange-600">Pending</p>
				<p class="text-xl font-black text-orange-600">{queue.filter((item) => item.status === 'pending').length}</p>
			</div>
		</div>
	</div>

	<div class="mb-8 space-y-4 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<div class="flex flex-wrap gap-4">
			<div class="group relative min-w-[280px] flex-1">
				<span class="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500">🔍</span>
				<input
					type="search"
					bind:value={search}
					placeholder="Search by business, owner, location or ID..."
					class="w-full rounded-2xl border border-gray-100 bg-gray-50 px-12 py-3.5 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-white"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<select bind:value={filterType} class="filter-select">
					<option value="all">Any Type</option>
					<option value="product">Product</option>
					<option value="service">Service</option>
					<option value="both">Both</option>
				</select>
				<select bind:value={filterPriority} class="filter-select">
					<option value="all">Any Priority</option>
					<option value="critical">Critical</option>
					<option value="high">High</option>
					<option value="normal">Normal</option>
				</select>
				<select bind:value={sortBy} class="filter-select bg-orange-500/5 border-orange-500/30! text-orange-600!">
					<option value="submitted">Newest Submitted</option>
					<option value="priority">Priority First</option>
				</select>
			</div>
		</div>
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">{filtered.length} application(s) in current queue view</p>
	</div>

	<div class="grid grid-cols-1 gap-4 md:hidden">
		{#each filtered as item}
			<div class="group rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-500/30 dark:border-gray-800 dark:bg-gray-900">
				<div class="mb-4 flex items-start gap-4">
					<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl">
						{typeIcon[item.type]}
					</div>
					<div class="min-w-0 flex-1">
						<h2 class="truncate text-lg font-black text-gray-900 dark:text-white">{item.name}</h2>
						<p class="text-xs font-bold text-gray-500">{item.owner} • {item.location}</p>
						<p class="mt-1 text-[10px] font-black uppercase tracking-widest text-orange-500">{item.id}</p>
					</div>
				</div>

				<div class="mb-5 flex flex-wrap items-center gap-2">
					<span class={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${priorityStyles[item.priority]}`}>{item.priority}</span>
					<span class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-800 dark:text-gray-300">{item.type}</span>
					<span class={`text-[10px] font-black uppercase tracking-widest ${statusStyles[item.status]}`}>{item.status}</span>
				</div>

				<div class="mb-5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
					<span>{item.docCount} Docs</span>
					<span>{item.submitted}</span>
				</div>

				<a
					href={`/admin/inspect-business/${item.id}`}
					class="flex w-full items-center justify-center rounded-2xl bg-orange-500 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400"
				>
					Open Inspection
				</a>
			</div>
		{/each}
	</div>

	<div class="hidden overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 md:block">
		<table class="w-full border-collapse">
			<thead>
				<tr class="border-b border-gray-50 bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:bg-gray-950/50">
					<th class="px-8 py-5 text-left">Business</th>
					<th class="px-6 py-5 text-left">Owner</th>
					<th class="px-6 py-5 text-left">Type</th>
					<th class="px-6 py-5 text-left">Priority</th>
					<th class="px-6 py-5 text-left">Docs</th>
					<th class="px-6 py-5 text-left">Submitted</th>
					<th class="px-8 py-5 text-right">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
				{#each filtered as item}
					<tr class="group transition-colors hover:bg-orange-50/40 dark:hover:bg-orange-500/5">
						<td class="px-8 py-4">
							<div class="flex items-center gap-4">
								<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl transition-transform group-hover:scale-110">{typeIcon[item.type]}</div>
								<div class="min-w-0">
									<p class="truncate font-black text-gray-900 dark:text-white">{item.name}</p>
									<p class="text-[10px] font-black uppercase tracking-tighter text-orange-500">{item.id} • {item.location}</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300">{item.owner}</td>
						<td class="px-6 py-4 text-sm font-bold text-gray-500">{item.type}</td>
						<td class="px-6 py-4"><span class={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${priorityStyles[item.priority]}`}>{item.priority}</span></td>
						<td class="px-6 py-4 text-sm font-bold text-gray-500">{item.docCount}</td>
						<td class="px-6 py-4 text-sm font-bold text-gray-500">{item.submitted}</td>
						<td class="px-8 py-4 text-right">
							<a
								href={`/admin/inspect-business/${item.id}`}
								class="inline-flex rounded-xl bg-gray-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-600 shadow-sm transition-all hover:bg-orange-500 hover:text-white dark:bg-gray-800 dark:text-gray-300"
							>
								Inspect
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if filtered.length === 0}
			<div class="py-24 text-center">
				<div class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-5xl dark:bg-gray-800">✅</div>
				<h3 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Inspection Queue Clear</h3>
				<p class="font-bold text-gray-500">No business applications match your current filters.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.filter-select {
		appearance: none;
		border-radius: 1rem;
		border: 1px solid #f3f4f6;
		background-color: transparent;
		padding: 0.625rem 1.25rem;
		padding-right: 2.5rem;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		outline: none;
		cursor: pointer;
		transition: all 0.2s;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1rem;
	}

	:global(.dark) .filter-select {
		border-color: #1f2937;
		color: #9ca3af;
	}

	.filter-select:hover {
		border-color: #f97316;
		color: #f97316;
	}

	.filter-select:focus {
		border-color: #f97316;
		box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
	}
</style>
