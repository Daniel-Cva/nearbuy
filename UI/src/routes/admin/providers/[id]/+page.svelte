<script>
	import { page } from '$app/stores';

	const providerId = $derived($page.params.id);

	const providers = [
		{
			id: 'PRV-001',
			name: 'Ravi Kumar',
			business: 'Krishna Electronics',
			businessId: 'BIZ-001',
			founderId: 'FDR-001',
			email: 'ravi@krishnaelectronics.in',
			phone: '+91 98765 43210',
			location: 'Chennai, TN',
			address: '123 Market Street, Tech City, Chennai, 560001',
			category: 'Electronics',
			plan: 'Pro',
			status: 'active',
			rating: 4.8,
			products: 124,
			orders: 342,
			revenue: '₹12.4L',
			joined: '2026-01-15',
			verified: true,
			gstin: 'GSTIN29AABCT1332L1Z5',
			bankAccount: '****5678',
			documents: ['GSTIN Certificate', 'PAN Card', 'Bank Statement', 'Shop License'],
			image: 'https://images.unsplash.com/photo-1556740734-7f9a2b7a0f4d?w=800&auto=format&fit=crop&q=60',
			staff: [
				{ id: 'STF-001', name: 'Priya S', role: 'Employee', email: 'priya@krishna.in', phone: '+91 98001 11111', jobs: 42, joined: '2025-10-01' },
				{ id: 'STF-002', name: 'Karthik M', role: 'Employee', email: 'karthik@krishna.in', phone: '+91 98002 22222', jobs: 28, joined: '2026-01-15' }
			]
		},
		{
			id: 'PRV-002',
			name: 'Meera Devi',
			business: 'Meera Tailors',
			businessId: 'BIZ-002',
			founderId: 'FDR-002',
			email: 'meera@meeratailors.com',
			phone: '+91 98765 43211',
			location: 'Coimbatore, TN',
			address: '45 Gandhi Road, Coimbatore, 641001',
			category: 'Fashion',
			plan: 'Standard',
			status: 'active',
			rating: 4.6,
			products: 87,
			orders: 218,
			revenue: '₹6.8L',
			joined: '2026-01-22',
			verified: true,
			gstin: 'GSTIN33BBBCT4422L2Z6',
			bankAccount: '****8901',
			documents: ['GSTIN Certificate', 'PAN Card', 'Bank Statement'],
			image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=60',
			staff: []
		},
		{
			id: 'PRV-003',
			name: 'Raj Arjun',
			business: 'Raj Mobile Works',
			businessId: 'BIZ-003',
			founderId: 'FDR-003',
			email: 'raj@rajmobile.in',
			phone: '+91 98765 43212',
			location: 'Madurai, TN',
			address: '78 Anna Nagar, Madurai, 625001',
			category: 'Repair',
			plan: 'Basic',
			status: 'active',
			rating: 4.4,
			products: 45,
			orders: 156,
			revenue: '₹3.2L',
			joined: '2026-02-04',
			verified: true,
			gstin: 'GSTIN33CCCCT3322L3Z7',
			bankAccount: '****2345',
			documents: ['GSTIN Certificate', 'PAN Card'],
			image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop&q=60',
			staff: []
		},
		{
			id: 'PRV-004',
			name: 'Lakshmi S',
			business: 'Lakshmi Grocery',
			businessId: 'BIZ-004',
			founderId: 'FDR-004',
			email: 'lakshmi@lakshmigrocery.in',
			phone: '+91 98765 43213',
			location: 'Salem, TN',
			address: '12 Main Bazaar, Salem, 636001',
			category: 'Retail',
			plan: 'Pro',
			status: 'active',
			rating: 4.7,
			products: 289,
			orders: 512,
			revenue: '₹18.6L',
			joined: '2026-02-10',
			verified: true,
			gstin: 'GSTIN33DDDCT5522L4Z8',
			bankAccount: '****6789',
			documents: ['GSTIN Certificate', 'PAN Card', 'Bank Statement', 'FSSAI License'],
			image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=60',
			staff: [
				{ id: 'STF-003', name: 'Anand K', role: 'Admin', email: 'anand@lakshmi.in', phone: '+91 98003 33333', jobs: 89, joined: '2026-02-12' }
			]
		},
		{
			id: 'PRV-005',
			name: 'Murugan P',
			business: 'Star Plumbing',
			businessId: 'BIZ-005',
			founderId: 'FDR-005',
			email: 'murugan@starplumbing.in',
			phone: '+91 98765 43214',
			location: 'Trichy, TN',
			address: '34 KK Nagar, Trichy, 620001',
			category: 'Services',
			plan: 'Basic',
			status: 'suspended',
			rating: 4.1,
			products: 23,
			orders: 78,
			revenue: '₹1.8L',
			joined: '2026-02-18',
			verified: false,
			gstin: 'GSTIN33EEPENDING',
			bankAccount: '****4567',
			documents: ['PAN Card'],
			image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=60',
			staff: []
		},
		{
			id: 'PRV-006',
			name: 'Anand R',
			business: 'Anand Bakery',
			businessId: 'BIZ-006',
			founderId: 'FDR-006',
			email: 'anand@anandbakery.in',
			phone: '+91 98765 43215',
			location: 'Tirunelveli, TN',
			address: '90 Junction Road, Tirunelveli, 627001',
			category: 'Food',
			plan: 'Standard',
			status: 'active',
			rating: 4.9,
			products: 156,
			orders: 624,
			revenue: '₹9.4L',
			joined: '2026-02-25',
			verified: true,
			gstin: 'GSTIN33FFFCT7722L6Z0',
			bankAccount: '****9012',
			documents: ['GSTIN Certificate', 'PAN Card', 'Bank Statement', 'FSSAI License', 'Health Permit'],
			image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60',
			staff: [
				{ id: 'STF-004', name: 'Deepa R', role: 'Admin', email: 'deepa@anand.in', phone: '+91 98004 44444', jobs: 124, joined: '2026-02-26' },
				{ id: 'STF-005', name: 'Suresh M', role: 'Employee', email: 'suresh@anand.in', phone: '+91 98005 55555', jobs: 67, joined: '2026-03-01' }
			]
		},
		{
			id: 'PRV-007',
			name: 'Priya M',
			business: 'NextGen Pharmacy',
			businessId: 'BIZ-007',
			founderId: 'FDR-007',
			email: 'priya@nextgenpharmacy.in',
			phone: '+91 98765 43216',
			location: 'Vellore, TN',
			address: '56 Hospital Road, Vellore, 632001',
			category: 'Health',
			plan: 'Pro',
			status: 'active',
			rating: 4.8,
			products: 342,
			orders: 891,
			revenue: '₹24.2L',
			joined: '2026-03-01',
			verified: true,
			gstin: 'GSTIN33GGGCT8822L7Z1',
			bankAccount: '****3456',
			documents: ['GSTIN Certificate', 'PAN Card', 'Bank Statement', 'Drug License', 'Pharmacy Registration'],
			image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=60',
			staff: [
				{ id: 'STF-006', name: 'Rajesh K', role: 'Admin', email: 'rajesh@nextgen.in', phone: '+91 98006 66666', jobs: 156, joined: '2026-03-02' }
			]
		},
		{
			id: 'PRV-008',
			name: 'Kumar J',
			business: 'Classic Electricals',
			businessId: 'BIZ-008',
			founderId: 'FDR-008',
			email: 'kumar@classicelectricals.in',
			phone: '+91 98765 77777',
			location: 'Erode, TN',
			address: '22 Market Street, Erode, 638001',
			category: 'Electronics',
			plan: 'Standard',
			status: 'pending',
			rating: 0,
			products: 0,
			orders: 0,
			revenue: '₹0',
			joined: '2026-03-08',
			verified: false,
			gstin: 'PENDING',
			bankAccount: '****7890',
			documents: ['PAN Card', 'Bank Statement'],
			image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60',
			staff: []
		}
	];

	const provider = $derived(providers.find((p) => p.id === providerId));

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
	<title>{provider ? `${provider.name} — Business Details` : 'Business Not Found'} — NearBuy Admin</title>
</svelte:head>

{#if provider}
	<div class="w-full p-4 md:p-8">
		<!-- Breadcrumbs -->
		<div class="mb-6 flex items-center gap-2 text-sm text-gray-400">
			<a href="/admin/providers" class="hover:text-orange-400">All Businesses</a>
			<span>/</span>
			<span class="font-bold text-white">{provider.id}</span>
		</div>

		<!-- Header Card -->
		<div class="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
			<div class="relative h-48 overflow-hidden bg-linear-to-r from-orange-400 to-orange-600">
				<img
					src={provider.image}
					alt={provider.business}
					class="h-full w-full object-cover opacity-40 mix-blend-overlay"
				/>
				<div class="absolute top-4 right-4 flex gap-2">
					<span class={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusColors[provider.status]}`}>
						{provider.status}
					</span>
					{#if provider.verified}
						<span class="rounded-full bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400">
							✓ Verified
						</span>
					{/if}
				</div>
			</div>
			<div class="p-6">
				<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-xs font-mono text-orange-400">{provider.id}</p>
						<h1 class="mt-1 text-3xl font-black text-white">{provider.business}</h1>
						<p class="mt-1 text-lg text-gray-400">by {provider.name}</p>
						<div class="mt-2 flex items-center gap-2">
							<span class={`rounded-full px-2 py-1 text-xs font-bold ${planColors[provider.plan]}`}>
								{provider.plan} Plan
							</span>
							<span class="text-xs text-gray-500">•</span>
							<span class="text-xs text-gray-400">{provider.category}</span>
							<span class="text-xs text-gray-500">•</span>
							<span class="text-xs text-gray-400">{provider.location}</span>
						</div>
					</div>
					<div class="flex gap-2">
						<a
							href={`/admin/businesses/${provider.businessId}`}
							class="rounded-xl bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-400 hover:bg-blue-500/30"
						>
							View Business Profile
						</a>
						<a
							href={`/admin/founders/${provider.founderId}`}
							class="rounded-xl bg-purple-500/20 px-4 py-2 text-sm font-bold text-purple-400 hover:bg-purple-500/30"
						>
							View Founder Profile
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Products</p>
				<p class="mt-1 text-2xl font-black text-white">{provider.products}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Orders</p>
				<p class="mt-1 text-2xl font-black text-white">{provider.orders}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue</p>
				<p class="mt-1 text-2xl font-black text-green-400">{provider.revenue}</p>
			</div>
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-400">Rating</p>
				<p class="mt-1 text-2xl font-black text-yellow-400">
					{provider.rating > 0 ? `⭐ ${provider.rating}` : 'N/A'}
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
						<p class="mt-0.5 text-sm text-white">{provider.email}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</p>
						<p class="mt-0.5 text-sm text-white">{provider.phone}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Address</p>
						<p class="mt-0.5 text-sm text-white">{provider.address}</p>
					</div>
				</div>
			</div>

			<!-- Business Details -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">Business Details</h2>
				<div class="space-y-3">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Business ID</p>
						<p class="mt-0.5 font-mono text-sm text-orange-400">{provider.businessId}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">GSTIN</p>
						<p class="mt-0.5 font-mono text-sm text-white">{provider.gstin}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Bank Account</p>
						<p class="mt-0.5 font-mono text-sm text-white">{provider.bankAccount}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-gray-500">Joined</p>
						<p class="mt-0.5 text-sm text-white">{provider.joined}</p>
					</div>
				</div>
			</div>

			<!-- Documents -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">Submitted Documents</h2>
				<div class="space-y-2">
					{#each provider.documents as doc}
						<div class="flex items-center gap-2 rounded-lg bg-gray-800 p-3">
							<span class="text-lg">📄</span>
							<span class="text-sm text-white">{doc}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Staff Members -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-lg font-bold text-white">
					Staff Members ({provider.staff.length})
				</h2>
				{#if provider.staff.length > 0}
					<div class="space-y-3">
						{#each provider.staff as staff}
							<a
								href={`/admin/staff/${staff.id}`}
								class="group flex items-center justify-between rounded-lg bg-gray-800 p-3 hover:bg-gray-700 transition-colors"
							>
								<div>
									<p class="font-bold text-white group-hover:text-orange-400">{staff.name}</p>
									<p class="text-xs text-gray-400">{staff.role} • {staff.email}</p>
								</div>
								<span class="text-orange-400">→</span>
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No staff members added yet.</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<p class="text-2xl font-bold text-white">Business Not Found</p>
			<p class="mt-2 text-gray-400">The business with ID {providerId} does not exist.</p>
			<a href="/admin/providers" class="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white">
				Back to Businesses
			</a>
		</div>
	</div>
{/if}
