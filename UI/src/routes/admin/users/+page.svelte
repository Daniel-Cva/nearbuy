<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let viewMode = $state('grid'); // 'grid' or 'table'
	let loading = $state(true);
	let errorMsg = $state('');
	let userRows = $state([]);


	function toUserName(row) {
		const first = String(row.firstname || row.first_name || '').trim();
		const last = String(row.lastname || row.last_name || '').trim();
		const full = `${first} ${last}`.trim();
		return full || row.name || 'Unnamed User';
	}

	function toStatus(row) {
		const status = String(row.status || '').toLowerCase();
		if (status === 'inactive' || status === 'suspended' || status === 'banned') return 'suspended';
		if (status === 'pending') return 'pending';
		if (status === 'deleted') return 'deleted';
		return 'active';
	}

	async function fetchUsers() {
		loading = true;
		errorMsg = '';
		try {
			const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch users (${response.status}).`);
			}

			userRows = Array.isArray(data?.users) ? data.users : [];
		} catch (err) {
			console.error('Failed to load users:', err);
			errorMsg = err?.message || 'Failed to load users.';
		} finally {
			loading = false;
		}
	}

	const users = $derived(
		userRows.map((u) => ({
			id: u.id || '-',
			name: toUserName(u),
			email: u.email || '-',
			phone: u.mobile || u.phone || '+91 -',
			location: `${u.city || '-'}${u.state ? `, ${u.state}` : ''}`,
			status: toStatus(u),
			joined: String(u.created_at || u.createdAt || '').slice(0, 10),
			orders: 0, // Mock stats for now
			spent: '₹0',
			wishlist: 0,
			rating: 0,
			verified: true,
			image:
				u.avatar_url ||
				u.avatar ||
				''
		}))
	);

	const filtered = $derived(
		users.filter((u) => {
			const matchesSearch = 
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.phone.includes(searchQuery);
			const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	const stats = $derived({
		total: users.length,
		active: users.filter((u) => u.status === 'active').length,
		pending: users.filter((u) => u.status === 'pending').length,
		suspended: users.filter((u) => u.status === 'suspended').length,
		deleted: users.filter((u) => u.status === 'deleted').length
	});

	const statusColors = {
		active: 'bg-green-500/20 text-green-400',
		pending: 'bg-yellow-500/20 text-yellow-400',
		suspended: 'bg-red-500/20 text-red-400',
		deleted: 'bg-gray-500/20 text-gray-400'
	};

	onMount(() => {
		fetchUsers();
	});
</script>

<svelte:head>
	<title>All Users — NearBuy Admin</title>
	<meta name="description" content="Manage all consumer users on the NearBuy platform." />
</svelte:head>

<div class="w-full p-4 md:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">All Users</h1>
		<p class="mt-0.5 text-sm text-gray-400">Manage consumer accounts and activity</p>
	</div>

	{#if errorMsg}
		<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
			{errorMsg}
		</div>
	{/if}

	{#if loading}
		<div class="mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
			Loading users from API...
		</div>
	{/if}

	<!-- Stats -->
	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Users</p>
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
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Deleted</p>
			<p class="mt-1 text-2xl font-black text-gray-600 dark:text-gray-400">{stats.deleted}</p>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-wrap gap-2">
			{#each [
				{ value: 'all', label: 'All' },
				{ value: 'active', label: 'Active' },
				{ value: 'pending', label: 'Pending' },
				{ value: 'suspended', label: 'Suspended' },
				{ value: 'deleted', label: 'Deleted' }
			] as status}
				<button
					onclick={() => (statusFilter = status.value)}
					class={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${statusFilter === status.value ? 'bg-orange-500 text-white' : 'border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
				>
					{status.label}
				</button>
			{/each}
		</div>
		<div class="flex gap-2">
			<div class="relative flex-1 md:w-64">
				<Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search users..."
					class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none"
				/>
			</div>
			<button
				onclick={() => (viewMode = viewMode === 'grid' ? 'table' : 'grid')}
				class="flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xl font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
				aria-label="Toggle view mode"
			>
				<Icon icon={viewMode === 'grid' ? 'mdi:view-list' : 'mdi:view-grid'} />
			</button>
		</div>
	</div>

	<!-- Grid View -->
	{#if viewMode === 'grid'}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each filtered as user}
				<a
					href={`/admin/users/${user.id}`}
					class="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
				>
					<div class="p-5">
						<div class="mb-4 flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="h-16 w-16 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
									{#if user.image}
										<img
											src={user.image}
											alt={user.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-orange-500/10 text-2xl font-black text-orange-500">
											{user.name.charAt(0).toUpperCase()}
										</div>
									{/if}
								</div>
								<div>
									<p class="text-xs font-mono text-orange-500 dark:text-orange-400">{user.id}</p>
									<h3 class="mt-0.5 text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
										{user.name}
									</h3>
									<p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{user.location}</p>
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${statusColors[user.status]}`}>
									{user.status}
								</span>
								{#if user.verified}
									<span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
										<Icon icon="mdi:check-decagram" />
									</span>
								{/if}
							</div>
						</div>
						<div class="mb-3 space-y-1">
							<p class="text-xs text-gray-500">{user.email}</p>
							<p class="text-xs text-gray-500">{user.phone}</p>
						</div>
						<div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-3">
							<div class="text-center">
								<p class="text-xs text-gray-500">Orders</p>
								<p class="mt-0.5 font-bold text-gray-900 dark:text-white">{user.orders}</p>
							</div>
							<div class="text-center">
								<p class="text-xs text-gray-500">Spent</p>
								<p class="mt-0.5 font-bold text-green-600 dark:text-green-400">{user.spent}</p>
							</div>
							<div class="text-center">
								<p class="text-xs text-gray-500">Rating</p>
								<p class="mt-0.5 font-bold text-yellow-600 dark:text-yellow-400">
									{user.rating > 0 ? user.rating : 'N/A'}
								</p>
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
							<th class="px-5 py-3 text-left">User</th>
							<th class="px-5 py-3 text-left">Contact</th>
							<th class="px-5 py-3 text-left">Location</th>
							<th class="px-5 py-3 text-left">Status</th>
							<th class="px-5 py-3 text-left">Orders</th>
							<th class="px-5 py-3 text-left">Spent</th>
							<th class="px-5 py-3 text-left">Rating</th>
							<th class="px-5 py-3 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filtered as user}
							<tr class="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
								<td class="px-5 py-3">
									<div class="flex items-center gap-3">
										<div class="h-10 w-10 overflow-hidden rounded-lg bg-gray-800">
											{#if user.image}
												<img
													src={user.image}
													alt={user.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<div class="flex h-full w-full items-center justify-center bg-orange-500/10 text-lg font-black text-orange-500">
													{user.name.charAt(0).toUpperCase()}
												</div>
											{/if}
										</div>
										<div>
											<p class="font-mono text-xs text-gray-500">{user.id}</p>
											<p class="font-medium text-white">{user.name}</p>
										</div>
									</div>
								</td>
								<td class="px-5 py-3">
									<p class="text-xs text-gray-400">{user.email}</p>
									<p class="text-xs text-gray-400">{user.phone}</p>
								</td>
								<td class="px-5 py-3 text-gray-300">{user.location}</td>
								<td class="px-5 py-3">
									<div class="flex items-center gap-1.5">
										<span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${statusColors[user.status]}`}>
											{user.status}
										</span>
										{#if user.verified}
											<span class="text-blue-400">
												<Icon icon="mdi:check-decagram" />
											</span>
										{/if}
									</div>
								</td>
								<td class="px-5 py-3 text-gray-300">{user.orders}</td>
								<td class="px-5 py-3 font-bold text-green-400">{user.spent}</td>
								<td class="px-5 py-3 text-yellow-400">{user.rating > 0 ? user.rating : 'N/A'}</td>
								<td class="px-5 py-3">
									<a
										href={`/admin/users/${user.id}`}
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
		<div class="mt-8 text-center text-gray-400">
			<p>No users found matching your criteria.</p>
		</div>
	{/if}
</div>
