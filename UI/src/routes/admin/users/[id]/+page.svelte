<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const userId = $derived($page.params.id);
	let loading = $state(true);
	let errorMsg = $state('');
	let userData = $state(null);

	function toUserName(row) {
		const first = String(row?.firstname || row?.first_name || '').trim();
		const last = String(row?.lastname || row?.last_name || '').trim();
		const full = `${first} ${last}`.trim();
		return full || row?.name || 'Unnamed User';
	}

	async function fetchUserDetail() {
		loading = true;
		errorMsg = '';
		try {
			const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch user (${response.status}).`);
			}

			userData = data?.user || data?.data || null;
		} catch (err) {
			console.error('Failed to load user detail:', err);
			errorMsg = err?.message || 'Failed to load user details.';
		} finally {
			loading = false;
		}
	}

	const user = $derived(
		userData
			? {
					id: userData.id || userId,
					name: toUserName(userData),
					email: userData.email || '-',
					phone: userData.mobile || userData.phone || '-',
					location: `${userData.city || '-'}${userData.state ? `, ${userData.state}` : ''}`,
					address: userData.address || 'No Address Found',
					status: String(userData.status || '').toLowerCase() === 'active' ? 'active' : 'suspended',
					joined: String(userData.created_at || userData.createdAt || '').slice(0, 10),
					orders: 0,
					spent: '₹0',
					wishlist: 0,
					rating: 0,
					verified: true,
					image:
						userData.avatar_url ||
						'',
					recentOrders: [],
					reports: []
			  }
			: null
	);

	const statusColors = {
		active: 'bg-green-500/20 text-green-400',
		pending: 'bg-yellow-500/20 text-yellow-400',
		suspended: 'bg-red-500/20 text-red-400',
		deleted: 'bg-gray-500/20 text-gray-400'
	};

	const orderStatusColors = {
		completed: 'bg-green-500/20 text-green-400',
		pending: 'bg-yellow-500/20 text-yellow-400',
		cancelled: 'bg-red-500/20 text-red-400',
		refunded: 'bg-orange-500/20 text-orange-400'
	};

	onMount(() => {
		fetchUserDetail();
	});
</script>

<svelte:head>
	<title>{user ? `${user.name} — User Details` : 'User Not Found'} — NearBuy Admin</title>
</svelte:head>

{#if user}
	<div class="w-full p-4 md:p-8">
		<!-- Breadcrumbs -->
		<div class="mb-6 flex items-center gap-2 text-sm text-gray-400">
			<a href="/admin/users" class="hover:text-orange-400">All Users</a>
			<span>/</span>
			<span class="font-bold text-white">{user.id}</span>
		</div>

		<!-- Header Card -->
		<div class="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
			<div class="p-6">
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-4">
						<div class="h-24 w-24 overflow-hidden rounded-2xl bg-gray-800">
							{#if user.image}
								<img
									src={user.image}
									alt={user.name}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-orange-500/10 text-4xl font-black text-orange-500">
									{user.name.charAt(0).toUpperCase()}
								</div>
							{/if}
						</div>
						<div>
							<p class="text-xs font-mono text-orange-400">{user.id}</p>
							<h1 class="mt-1 text-3xl font-black text-white">{user.name}</h1>
							<p class="mt-1 text-sm text-gray-400">{user.location}</p>
							<div class="mt-2 flex items-center gap-2">
								<span class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusColors[user.status]}`}>
									{user.status}
								</span>
								{#if user.verified}
									<span class="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-400">
										✓ Verified
									</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</p>
				<p class="mt-1 text-2xl font-black text-white">{user.orders}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Total Spent</p>
				<p class="mt-1 text-2xl font-black text-green-400">{user.spent}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Wishlist Items</p>
				<p class="mt-1 text-2xl font-black text-white">{user.wishlist}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Rating</p>
				<p class="mt-1 text-2xl font-black text-yellow-400">
					{user.rating > 0 ? `⭐ ${user.rating}` : 'N/A'}
				</p>
			</div>
		</div>

		<!-- Details Grid -->
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Contact Information -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">Contact Information</h2>
				<div class="space-y-3">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Email</p>
						<p class="mt-0.5 text-sm text-white">{user.email}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</p>
						<p class="mt-0.5 text-sm text-white">{user.phone}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Address</p>
						<p class="mt-0.5 text-sm text-white">{user.address}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Joined</p>
						<p class="mt-0.5 text-sm text-white">{user.joined}</p>
					</div>
				</div>
			</div>

			<!-- Reports Filed -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">
					Reports Filed ({user.reports.length})
				</h2>
				{#if user.reports.length > 0}
					<div class="space-y-3">
						{#each user.reports as report}
							<a
								href={`/admin/report-logs`}
								class="group flex items-center justify-between rounded-lg bg-gray-800 p-3 hover:bg-gray-700 transition-colors"
							>
								<div>
									<p class="text-xs font-mono text-gray-500">{report.id}</p>
									<p class="font-bold text-white group-hover:text-orange-400">{report.type}</p>
									<p class="text-xs text-gray-400">Severity: {report.severity} • {report.status}</p>
								</div>
								<span class="text-orange-400">→</span>
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No reports filed.</p>
				{/if}
			</div>

			<!-- Recent Orders -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2">
				<h2 class="mb-4 text-lg font-bold text-white">
					Recent Orders ({user.recentOrders.length})
				</h2>
				{#if user.recentOrders.length > 0}
					<div class="space-y-3">
						{#each user.recentOrders as order}
							<div class="flex items-center justify-between rounded-lg bg-gray-800 p-4">
								<div class="flex-1">
									<p class="text-xs font-mono text-gray-500">{order.id}</p>
									<p class="mt-0.5 font-bold text-white">{order.item}</p>
									<p class="mt-0.5 text-xs text-gray-400">from {order.provider}</p>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<p class="font-bold text-green-400">{order.amount}</p>
										<p class="text-xs text-gray-400">{order.date}</p>
									</div>
									<span class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold uppercase ${orderStatusColors[order.status]}`}>
										{order.status}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No orders yet.</p>
				{/if}
			</div>
		</div>
	</div>
	{:else if loading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<p class="text-2xl font-bold text-white">Loading User</p>
			<p class="mt-2 text-gray-400">Fetching details for {userId}...</p>
		</div>
	</div>
	{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<p class="text-2xl font-bold text-white">User Not Found</p>
			<p class="mt-2 text-gray-400">{errorMsg || `The user with ID ${userId} does not exist.`}</p>
			<a href="/admin/users" class="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white">
				Back to Users
			</a>
		</div>
	</div>
{/if}
