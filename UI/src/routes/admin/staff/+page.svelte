<script>
	let searchQuery = $state('');
	let roleFilter = $state('all');
	let businessFilter = $state('all');
	let viewMode = $state('grid'); // 'grid' or 'table'

	const staff = [
		{
			id: 'STF-001',
			name: 'Priya S',
			role: 'Employee',
			email: 'priya@krishna.in',
			phone: '+91 98001 11111',
			jobs: 42,
			joined: '2025-10-01',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			provider: 'Ravi Kumar',
			providerId: 'PRV-001',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=priya'
		},
		{
			id: 'STF-002',
			name: 'Karthik M',
			role: 'Employee',
			email: 'karthik@krishna.in',
			phone: '+91 98002 22222',
			jobs: 28,
			joined: '2026-01-15',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			provider: 'Ravi Kumar',
			providerId: 'PRV-001',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=karthik'
		},
		{
			id: 'STF-003',
			name: 'Anand K',
			role: 'Admin',
			email: 'anand@lakshmi.in',
			phone: '+91 98003 33333',
			jobs: 89,
			joined: '2026-02-12',
			business: 'Lakshmi Grocery',
			businessId: 'BIZ-004',
			provider: 'Lakshmi S',
			providerId: 'PRV-004',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=anand'
		},
		{
			id: 'STF-004',
			name: 'Deepa R',
			role: 'Admin',
			email: 'deepa@anand.in',
			phone: '+91 98004 44444',
			jobs: 124,
			joined: '2026-02-26',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			provider: 'Anand R',
			providerId: 'PRV-006',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=deepa'
		},
		{
			id: 'STF-005',
			name: 'Suresh M',
			role: 'Employee',
			email: 'suresh@anand.in',
			phone: '+91 98005 55555',
			jobs: 67,
			joined: '2026-03-01',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			provider: 'Anand R',
			providerId: 'PRV-006',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=suresh'
		},
		{
			id: 'STF-006',
			name: 'Rajesh K',
			role: 'Admin',
			email: 'rajesh@nextgen.in',
			phone: '+91 98006 66666',
			jobs: 156,
			joined: '2026-03-02',
			business: 'NextGen Pharmacy',
			businessId: 'BIZ-007',
			provider: 'Priya M',
			providerId: 'PRV-007',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=rajesh'
		},
		{
			id: 'STF-007',
			name: 'Meena L',
			role: 'Employee',
			email: 'meena@meera.in',
			phone: '+91 98007 77777',
			jobs: 15,
			joined: '2026-02-01',
			business: 'Meera Tailors',
			businessId: 'BIZ-002',
			provider: 'Meera Devi',
			providerId: 'PRV-002',
			status: 'inactive',
			image: 'https://i.pravatar.cc/150?u=meena'
		},
		{
			id: 'STF-008',
			name: 'Vinod T',
			role: 'Employee',
			email: 'vinod@raj.in',
			phone: '+91 98008 88888',
			jobs: 34,
			joined: '2026-02-10',
			business: 'Raj Mobile Works',
			businessId: 'BIZ-003',
			provider: 'Raj Arjun',
			providerId: 'PRV-003',
			status: 'active',
			image: 'https://i.pravatar.cc/150?u=vinod'
		}
	];

	const businesses = $derived([
		...new Set(staff.map((s) => s.business))
	].sort());

	const filtered = $derived(
		staff.filter((s) => {
			const matchesSearch = 
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.business.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === 'all' || s.role === roleFilter;
			const matchesBusiness = businessFilter === 'all' || s.business === businessFilter;
			return matchesSearch && matchesRole && matchesBusiness;
		})
	);

	const stats = $derived({
		total: staff.length,
		active: staff.filter((s) => s.status === 'active').length,
		inactive: staff.filter((s) => s.status === 'inactive').length,
		admins: staff.filter((s) => s.role === 'Admin').length,
		employees: staff.filter((s) => s.role === 'Employee').length
	});

	const statusColors = {
		active: 'bg-green-500/20 text-green-400',
		inactive: 'bg-gray-500/20 text-gray-400'
	};

	const roleColors = {
		Admin: 'bg-blue-500/20 text-blue-400',
		Employee: 'bg-gray-500/20 text-gray-400'
	};
</script>

<svelte:head>
	<title>All Staff Members — NearBuy Admin</title>
	<meta name="description" content="Manage all staff members across all businesses on the NearBuy platform." />
</svelte:head>

<div class="w-full p-4 md:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">All Staff Members</h1>
		<p class="mt-0.5 text-sm text-gray-400">Manage staff accounts across all businesses</p>
	</div>

	<!-- Stats -->
	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Total Staff</p>
			<p class="mt-1 text-2xl font-black text-white">{stats.total}</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Active</p>
			<p class="mt-1 text-2xl font-black text-green-400">{stats.active}</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Inactive</p>
			<p class="mt-1 text-2xl font-black text-gray-400">{stats.inactive}</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Admins</p>
			<p class="mt-1 text-2xl font-black text-blue-400">{stats.admins}</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Employees</p>
			<p class="mt-1 text-2xl font-black text-white">{stats.employees}</p>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 flex flex-col gap-4">
		<div class="flex flex-wrap gap-2">
			<div class="flex gap-2">
				{#each [
					{ value: 'all', label: 'All Roles' },
					{ value: 'Admin', label: 'Admin' },
					{ value: 'Employee', label: 'Employee' }
				] as role}
					<button
						onclick={() => (roleFilter = role.value)}
						class={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${roleFilter === role.value ? 'bg-orange-500 text-white' : 'border border-gray-700 bg-gray-900 text-gray-400 hover:text-white'}`}
					>
						{role.label}
					</button>
				{/each}
			</div>
			<select
				bind:value={businessFilter}
				class="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm font-bold text-gray-600 dark:text-gray-400 focus:border-orange-500 focus:outline-none"
			>
				<option value="all">All Businesses</option>
				{#each businesses as business}
					<option value={business}>{business}</option>
				{/each}
			</select>
		</div>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search staff..."
				class="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none md:w-64"
			/>
			<button
				onclick={() => (viewMode = viewMode === 'grid' ? 'table' : 'grid')}
				class="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
			>
				{viewMode === 'grid' ? '📋' : '🔲'}
			</button>
		</div>
	</div>

	<!-- Grid View -->
	{#if viewMode === 'grid'}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each filtered as member}
				<a
					href={`/admin/staff/${member.id}`}
					class="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
				>
					<div class="p-5">
						<div class="mb-4 flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="h-16 w-16 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
									<img
										src={member.image}
										alt={member.name}
										class="h-full w-full object-cover"
									/>
								</div>
								<div>
									<p class="text-xs font-mono text-orange-500 dark:text-orange-400">{member.id}</p>
									<h3 class="mt-0.5 text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
										{member.name}
									</h3>
									<p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{member.business}</p>
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${roleColors[member.role]}`}>
									{member.role}
								</span>
								<span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${statusColors[member.status]}`}>
									{member.status}
								</span>
							</div>
						</div>
						<div class="mb-3 space-y-1">
							<p class="text-xs text-gray-500">{member.email}</p>
							<p class="text-xs text-gray-500">{member.phone}</p>
						</div>
					<div class="flex items-center justify-around border-t border-gray-200 dark:border-gray-800 pt-3">
						<div class="text-center">
							<p class="text-xs text-gray-500">Jobs Done</p>
							<p class="mt-0.5 font-bold text-gray-900 dark:text-white">{member.jobs}</p>
						</div>
						<div class="text-center">
							<p class="text-xs text-gray-500">Joined</p>
							<p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{member.joined}</p>
						</div>
						<div class="text-center">
							<p class="text-xs text-gray-500">Business</p>
							<p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{member.business}</p>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- Table View -->
		<div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-800 text-gray-400">
							<th class="px-5 py-3 text-left">Staff Member</th>
							<th class="px-5 py-3 text-left">Role</th>
							<th class="px-5 py-3 text-left">Business</th>
							<th class="px-5 py-3 text-left">Business Owner</th>
							<th class="px-5 py-3 text-left">Contact</th>
							<th class="px-5 py-3 text-left">Jobs Done</th>
							<th class="px-5 py-3 text-left">Status</th>
							<th class="px-5 py-3 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filtered as member}
							<tr class="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
								<td class="px-5 py-3">
									<div class="flex items-center gap-3">
										<div class="h-10 w-10 overflow-hidden rounded-lg bg-gray-800">
											<img
												src={member.image}
												alt={member.name}
												class="h-full w-full object-cover"
											/>
										</div>
										<div>
											<p class="font-mono text-xs text-gray-500">{member.id}</p>
											<p class="font-medium text-white">{member.name}</p>
										</div>
									</div>
								</td>
								<td class="px-5 py-3">
									<span class={`rounded-full px-2 py-1 text-xs font-bold ${roleColors[member.role]}`}>
										{member.role}
									</span>
								</td>
								<td class="px-5 py-3">
									<a
										href={`/admin/businesses/${member.businessId}`}
										class="text-white hover:text-orange-400"
									>
										{member.business}
									</a>
								</td>
								<td class="px-5 py-3">
									<a
										href={`/admin/providers/${member.providerId}`}
										class="text-gray-400 hover:text-orange-400"
									>
										{member.provider}
									</a>
								</td>
								<td class="px-5 py-3">
									<p class="text-xs text-gray-400">{member.email}</p>
									<p class="text-xs text-gray-400">{member.phone}</p>
								</td>
								<td class="px-5 py-3 text-gray-300">{member.jobs}</td>
								<td class="px-5 py-3">
									<span class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusColors[member.status]}`}>
										{member.status}
									</span>
								</td>
								<td class="px-5 py-3">
									<a
										href={`/admin/staff/${member.id}`}
										class="rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/30"
									>
										View
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if filtered.length === 0}
		<div class="mt-8 text-center">
			<p class="text-gray-400">No staff members found matching your criteria.</p>
		</div>
	{/if}
</div>
