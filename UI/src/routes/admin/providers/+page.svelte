<script>
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let planFilter = $state('all');
	let viewMode = $state('grid'); // 'grid' or 'table'

	const providers = [
		{
			id: 'PRV-001',
			name: 'Ravi Kumar',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			email: 'ravi@krishnaelectronics.in',
			phone: '+91 98765 43210',
			location: 'Chennai, TN',
			category: 'Electronics',
			plan: 'Pro',
			status: 'active',
			rating: 4.8,
			products: 124,
			orders: 342,
			revenue: '₹12.4L',
			joined: '2026-01-15',
			verified: true,
			image: 'https://images.unsplash.com/photo-1556740734-7f9a2b7a0f4d?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-002',
			name: 'Meera Devi',
			business: 'Meera Tailors',
			businessId: 'BIZ-002',
			email: 'meera@meeratailors.com',
			phone: '+91 98765 43211',
			location: 'Coimbatore, TN',
			category: 'Fashion',
			plan: 'Standard',
			status: 'active',
			rating: 4.6,
			products: 87,
			orders: 218,
			revenue: '₹6.8L',
			joined: '2026-01-22',
			verified: true,
			image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-003',
			name: 'Raj Arjun',
			business: 'Raj Mobile Works',
			businessId: 'BIZ-003',
			email: 'raj@rajmobile.in',
			phone: '+91 98765 43212',
			location: 'Madurai, TN',
			category: 'Repair',
			plan: 'Basic',
			status: 'active',
			rating: 4.4,
			products: 45,
			orders: 156,
			revenue: '₹3.2L',
			joined: '2026-02-04',
			verified: true,
			image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-004',
			name: 'Lakshmi S',
			business: 'Lakshmi Grocery',
			businessId: 'BIZ-004',
			email: 'lakshmi@lakshmigrocery.in',
			phone: '+91 98765 43213',
			location: 'Salem, TN',
			category: 'Retail',
			plan: 'Pro',
			status: 'active',
			rating: 4.7,
			products: 289,
			orders: 512,
			revenue: '₹18.6L',
			joined: '2026-02-10',
			verified: true,
			image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-005',
			name: 'Murugan P',
			business: 'Star Plumbing',
			businessId: 'BIZ-005',
			email: 'murugan@starplumbing.in',
			phone: '+91 98765 43214',
			location: 'Trichy, TN',
			category: 'Services',
			plan: 'Basic',
			status: 'suspended',
			rating: 4.1,
			products: 23,
			orders: 78,
			revenue: '₹1.8L',
			joined: '2026-02-18',
			verified: false,
			image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-006',
			name: 'Anand R',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			email: 'anand@anandbakery.in',
			phone: '+91 98765 43215',
			location: 'Tirunelveli, TN',
			category: 'Food',
			plan: 'Standard',
			status: 'active',
			rating: 4.9,
			products: 156,
			orders: 624,
			revenue: '₹9.4L',
			joined: '2026-02-25',
			verified: true,
			image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-007',
			name: 'Priya M',
			business: 'NextGen Pharmacy',
			businessId: 'BIZ-007',
			email: 'priya@nextgenpharmacy.in',
			phone: '+91 98765 43216',
			location: 'Vellore, TN',
			category: 'Health',
			plan: 'Pro',
			status: 'active',
			rating: 4.8,
			products: 342,
			orders: 891,
			revenue: '₹24.2L',
			joined: '2026-03-01',
			verified: true,
			image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&auto=format&fit=crop&q=60'
		},
		{
			id: 'PRV-008',
			name: 'Kumar J',
			business: 'Classic Electricals',
			businessId: 'BIZ-008',
			email: 'kumar@classicelectricals.in',
			phone: '+91 98765 77777',
			location: 'Erode, TN',
			category: 'Electronics',
			plan: 'Standard',
			status: 'pending',
			rating: 0,
			products: 0,
			orders: 0,
			revenue: '₹0',
			joined: '2026-03-08',
			verified: false,
			image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=60'
		}
	];

	const filtered = $derived(
		providers.filter((p) => {
			const matchesSearch = 
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
			const matchesPlan = planFilter === 'all' || p.plan === planFilter;
			return matchesSearch && matchesStatus && matchesPlan;
		})
	);

	const stats = $derived({
		total: providers.length,
		active: providers.filter((p) => p.status === 'active').length,
		pending: providers.filter((p) => p.status === 'pending').length,
		suspended: providers.filter((p) => p.status === 'suspended').length
	});

	const statusColors = {
		active: 'bg-green-500/20 text-green-400',
		pending: 'bg-yellow-500/20 text-yellow-400',
		suspended: 'bg-red-500/20 text-red-400'
	};

	const planColors = {
		Basic: 'bg-gray-500/20 text-gray-400',
		Standard: 'bg-blue-500/20 text-blue-400',
		Pro: 'bg-purple-500/20 text-purple-400'
	};
</script>

<svelte:head>
	<title>All Businesses — NearBuy Admin</title>
	<meta name="description" content="Manage all businesses on the NearBuy platform." />
</svelte:head>

<div class="w-full p-4 md:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">All Businesses</h1>
		<p class="mt-0.5 text-sm text-gray-400">Manage businesses and their accounts</p>
	</div>

	<!-- Stats -->
	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Businesses</p>
			<p class="mt-1 text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
		</div>
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active</p>
			<p class="mt-1 text-2xl font-black text-green-600 dark:text-green-400">{stats.active}</p>
		</div>
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending</p>
			<p class="mt-1 text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
		</div>
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suspended</p>
			<p class="mt-1 text-2xl font-black text-red-600 dark:text-red-400">{stats.suspended}</p>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-wrap gap-2">
			<div class="flex gap-2">
				{#each [
					{ value: 'all', label: 'All' },
					{ value: 'active', label: 'Active' },
					{ value: 'pending', label: 'Pending' },
					{ value: 'suspended', label: 'Suspended' }
				] as status}
					<button
						onclick={() => (statusFilter = status.value)}
						class={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${statusFilter === status.value ? 'bg-orange-500 text-white' : 'border border-gray-700 bg-gray-900 text-gray-400 hover:text-white'}`}
					>
						{status.label}
					</button>
				{/each}
			</div>
			<div class="flex gap-2">
				{#each [
					{ value: 'all', label: 'All Plans' },
					{ value: 'Basic', label: 'Basic' },
					{ value: 'Standard', label: 'Standard' },
					{ value: 'Pro', label: 'Pro' }
				] as plan}
					<button
						onclick={() => (planFilter = plan.value)}
						class={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${planFilter === plan.value ? 'bg-purple-500 text-white' : 'border border-gray-700 bg-gray-900 text-gray-400 hover:text-white'}`}
					>
						{plan.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search businesses..."
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
			{#each filtered as provider}
				<a
					href={`/admin/providers/${provider.id}`}
					class="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
				>
					<div class="relative h-32 overflow-hidden bg-gray-100 dark:bg-gray-800">
						<img
							src={provider.image}
							alt={provider.business}
							class="h-full w-full object-cover"
						/>
						<div class="absolute top-3 right-3 flex gap-2">
							<span class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusColors[provider.status]}`}>
								{provider.status}
							</span>
							{#if provider.verified}
								<span class="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-400">
									✓ Verified
								</span>
							{/if}
						</div>
					</div>
					<div class="p-5">
						<div class="mb-3">
						<p class="text-xs font-mono text-orange-500 dark:text-orange-400">{provider.id}</p>
						<h3 class="mt-1 text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
							{provider.business}
						</h3>
						<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">by {provider.name}</p>
						</div>
						<div class="mb-3 flex items-center gap-2">
							<span class={`rounded-full px-2 py-1 text-xs font-bold ${planColors[provider.plan]}`}>
								{provider.plan}
							</span>
						<span class="text-xs text-gray-400 dark:text-gray-500">•</span>
						<span class="text-xs text-gray-600 dark:text-gray-400">{provider.category}</span>
						<span class="text-xs text-gray-400 dark:text-gray-500">•</span>
						<span class="text-xs text-gray-600 dark:text-gray-400">{provider.location}</span>
					</div>
					<div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-3">
							<div class="text-center">
							<p class="text-xs text-gray-500 dark:text-gray-500">Products</p>
							<p class="mt-0.5 font-bold text-gray-900 dark:text-white">{provider.products}</p>
						</div>
						<div class="text-center">
							<p class="text-xs text-gray-500 dark:text-gray-500">Orders</p>
							<p class="mt-0.5 font-bold text-gray-900 dark:text-white">{provider.orders}</p>
						</div>
						<div class="text-center">
							<p class="text-xs text-gray-500 dark:text-gray-500">Revenue</p>
							<p class="mt-0.5 font-bold text-green-600 dark:text-green-400">{provider.revenue}</p>
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
						<tr class="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
							<th class="px-5 py-3 text-left">Business Owner</th>
							<th class="px-5 py-3 text-left">Business</th>
							<th class="px-5 py-3 text-left">Category</th>
							<th class="px-5 py-3 text-left">Plan</th>
							<th class="px-5 py-3 text-left">Status</th>
							<th class="px-5 py-3 text-left">Products</th>
							<th class="px-5 py-3 text-left">Orders</th>
							<th class="px-5 py-3 text-left">Revenue</th>
							<th class="px-5 py-3 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filtered as provider}
							<tr class="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
								<td class="px-5 py-3">
									<div>
										<p class="font-mono text-xs text-gray-500">{provider.id}</p>
										<p class="font-medium text-white">{provider.name}</p>
										<p class="text-xs text-gray-400">{provider.email}</p>
									</div>
								</td>
								<td class="px-5 py-3">
									<p class="font-medium text-white">{provider.business}</p>
									<p class="text-xs text-gray-400">{provider.location}</p>
								</td>
								<td class="px-5 py-3 text-gray-300">{provider.category}</td>
								<td class="px-5 py-3">
									<span class={`rounded-full px-2 py-1 text-xs font-bold ${planColors[provider.plan]}`}>
										{provider.plan}
									</span>
								</td>
								<td class="px-5 py-3">
									<span class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusColors[provider.status]}`}>
										{provider.status}
									</span>
								</td>
								<td class="px-5 py-3 text-gray-300">{provider.products}</td>
								<td class="px-5 py-3 text-gray-300">{provider.orders}</td>
								<td class="px-5 py-3 font-bold text-green-400">{provider.revenue}</td>
								<td class="px-5 py-3">
									<a
										href={`/admin/providers/${provider.id}`}
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
			<p class="text-gray-400">No businesses found matching your criteria.</p>
		</div>
	{/if}
</div>
