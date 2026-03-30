<script>
	import { page } from '$app/stores';

	const staffId = $derived($page.params.id);

	const staffMembers = [
		{
			id: 'STF-001',
			name: 'Priya S',
			role: 'Employee',
			employeeId: 'NB-STF-001',
			email: 'priya@krishna.in',
			phone: '+91 98001 11111',
			jobs: 42,
			joined: '2025-10-01',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			provider: 'Ravi Kumar',
			providerId: 'PRV-001',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=priya',
			permissions: ['View Products', 'Edit Products', 'View Orders', 'Process Orders'],
			recentActivity: [
				{ action: 'Processed order ORD-8821', date: '2026-03-09 11:45' },
				{ action: 'Updated product stock - iPhone 15 Case', date: '2026-03-09 10:30' },
				{ action: 'Added new product - USB-C Cable', date: '2026-03-08 16:20' }
			]
		},
		{
			id: 'STF-002',
			name: 'Karthik M',
			role: 'Employee',
			employeeId: 'NB-STF-002',
			email: 'karthik@krishna.in',
			phone: '+91 98002 22222',
			jobs: 28,
			joined: '2026-01-15',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			provider: 'Ravi Kumar',
			providerId: 'PRV-001',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=karthik',
			permissions: ['View Products', 'View Orders'],
			recentActivity: [
				{ action: 'Viewed inventory report', date: '2026-03-09 09:15' }
			]
		},
		{
			id: 'STF-003',
			name: 'Anand K',
			role: 'Admin',
			employeeId: 'NB-STF-003',
			email: 'anand@lakshmi.in',
			phone: '+91 98003 33333',
			jobs: 89,
			joined: '2026-02-12',
			business: 'Lakshmi Grocery',
			businessId: 'BIZ-004',
			provider: 'Lakshmi S',
			providerId: 'PRV-004',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=anand',
			permissions: ['Full Access', 'Manage Staff', 'View Analytics', 'Edit Products', 'Process Orders', 'Manage Subscriptions'],
			recentActivity: [
				{ action: 'Added new staff member', date: '2026-03-09 08:30' },
				{ action: 'Updated business hours', date: '2026-03-08 14:15' }
			]
		},
		{
			id: 'STF-004',
			name: 'Deepa R',
			role: 'Admin',
			employeeId: 'NB-STF-004',
			email: 'deepa@anand.in',
			phone: '+91 98004 44444',
			jobs: 124,
			joined: '2026-02-26',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			provider: 'Anand R',
			providerId: 'PRV-006',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=deepa',
			permissions: ['Full Access', 'Manage Staff', 'View Analytics', 'Edit Products', 'Process Orders'],
			recentActivity: [
				{ action: 'Processed 15 orders today', date: '2026-03-09 12:00' }
			]
		},
		{
			id: 'STF-005',
			name: 'Suresh M',
			role: 'Employee',
			employeeId: 'NB-STF-005',
			email: 'suresh@anand.in',
			phone: '+91 98005 55555',
			jobs: 67,
			joined: '2026-03-01',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			provider: 'Anand R',
			providerId: 'PRV-006',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=suresh',
			permissions: ['View Products', 'Edit Products', 'View Orders', 'Process Orders'],
			recentActivity: [
				{ action: 'Updated product prices', date: '2026-03-09 10:45' }
			]
		},
		{
			id: 'STF-006',
			name: 'Rajesh K',
			role: 'Admin',
			employeeId: 'NB-STF-006',
			email: 'rajesh@nextgen.in',
			phone: '+91 98006 66666',
			jobs: 156,
			joined: '2026-03-02',
			business: 'NextGen Pharmacy',
			businessId: 'BIZ-007',
			provider: 'Priya M',
			providerId: 'PRV-007',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=rajesh',
			permissions: ['Full Access', 'Manage Staff', 'View Analytics', 'Edit Products', 'Process Orders', 'Manage Inventory'],
			recentActivity: [
				{ action: 'Generated monthly sales report', date: '2026-03-09 09:00' }
			]
		},
		{
			id: 'STF-007',
			name: 'Meena L',
			role: 'Employee',
			employeeId: 'NB-STF-007',
			email: 'meena@meera.in',
			phone: '+91 98007 77777',
			jobs: 15,
			joined: '2026-02-01',
			business: 'Meera Tailors',
			businessId: 'BIZ-002',
			provider: 'Meera Devi',
			providerId: 'PRV-002',
			status: 'inactive',
			image: 'https://i.pravatar.cc/300?u=meena',
			permissions: ['View Products', 'View Orders'],
			recentActivity: []
		},
		{
			id: 'STF-008',
			name: 'Vinod T',
			role: 'Employee',
			employeeId: 'NB-STF-008',
			email: 'vinod@raj.in',
			phone: '+91 98008 88888',
			jobs: 34,
			joined: '2026-02-10',
			business: 'Raj Mobile Works',
			businessId: 'BIZ-003',
			provider: 'Raj Arjun',
			providerId: 'PRV-003',
			status: 'active',
			image: 'https://i.pravatar.cc/300?u=vinod',
			permissions: ['View Products', 'Edit Products', 'Process Orders'],
			recentActivity: [
				{ action: 'Completed order ORD-8792', date: '2026-03-08 17:30' }
			]
		}
	];

	const staff = $derived(staffMembers.find((s) => s.id === staffId));

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
	<title>{staff ? `${staff.name} — Staff Details` : 'Staff Not Found'} — NearBuy Admin</title>
</svelte:head>

{#if staff}
	<div class="w-full p-4 md:p-8">
		<!-- Breadcrumbs -->
		<div class="mb-6 flex items-center gap-2 text-sm text-gray-400">
			<a href="/admin/staff" class="hover:text-orange-400">All Staff</a>
			<span>/</span>
			<span class="font-bold text-white">{staff.id}</span>
		</div>

		<!-- Header Card -->
		<div class="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
			<div class="p-6">
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-4">
						<div class="h-24 w-24 overflow-hidden rounded-2xl bg-gray-800">
							<img
								src={staff.image}
								alt={staff.name}
								class="h-full w-full object-cover"
							/>
						</div>
						<div>
							<div class="flex items-center gap-2">
								<p class="text-xs font-mono text-orange-400">{staff.id}</p>
								<span class="text-xs text-gray-500">•</span>
								<p class="text-xs font-mono text-orange-400">{staff.employeeId}</p>
							</div>
							<h1 class="mt-1 text-3xl font-black text-white">{staff.name}</h1>
							<p class="mt-1 text-sm text-gray-400">at {staff.business}</p>
							<div class="mt-2 flex items-center gap-2">
								<span class={`rounded-full px-2 py-1 text-xs font-bold ${roleColors[staff.role]}`}>
									{staff.role}
								</span>
								<span class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusColors[staff.status]}`}>
									{staff.status}
								</span>
							</div>
						</div>
					</div>
					<div class="flex gap-2">
						<a
							href={`/admin/businesses/${staff.businessId}`}
							class="rounded-xl bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-400 hover:bg-blue-500/30"
						>
							View Business
						</a>
						<a
							href={`/admin/providers/${staff.providerId}`}
							class="rounded-xl bg-purple-500/20 px-4 py-2 text-sm font-bold text-purple-400 hover:bg-purple-500/30"
						>
							View Business Owner
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Jobs Completed</p>
				<p class="mt-1 text-2xl font-black text-white">{staff.jobs}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Joined Date</p>
				<p class="mt-1 text-lg font-bold text-white">{staff.joined}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Permissions</p>
				<p class="mt-1 text-2xl font-black text-blue-400">{staff.permissions.length}</p>
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
						<p class="mt-0.5 text-sm text-white">{staff.email}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</p>
						<p class="mt-0.5 text-sm text-white">{staff.phone}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Business</p>
						<a
							href={`/admin/businesses/${staff.businessId}`}
							class="mt-0.5 block text-sm text-blue-400 hover:text-blue-300"
						>
							{staff.business}
						</a>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Business Owner</p>
						<a
							href={`/admin/providers/${staff.providerId}`}
							class="mt-0.5 block text-sm text-purple-400 hover:text-purple-300"
						>
							{staff.provider}
						</a>
					</div>
				</div>
			</div>

			<!-- Permissions -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">Permissions</h2>
				<div class="flex flex-wrap gap-2">
					{#each staff.permissions as permission}
						<span class="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400">
							{permission}
						</span>
					{/each}
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2">
				<h2 class="mb-4 text-lg font-bold text-white">
					Recent Activity ({staff.recentActivity.length})
				</h2>
				{#if staff.recentActivity.length > 0}
					<div class="space-y-3">
						{#each staff.recentActivity as activity}
							<div class="flex items-center justify-between rounded-lg bg-gray-800 p-4">
								<p class="text-sm text-white">{activity.action}</p>
								<p class="text-xs text-gray-400">{activity.date}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No recent activity.</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<p class="text-2xl font-bold text-white">Staff Member Not Found</p>
			<p class="mt-2 text-gray-400">The staff member with ID {staffId} does not exist.</p>
			<a href="/admin/staff" class="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white">
				Back to Staff
			</a>
		</div>
	</div>
{/if}
