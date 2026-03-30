<script>
	const ads = [
		{
			id: 'AD-001',
			business: 'Krishna Electronics',
			image:
				'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80',
			type: 'In-App Banner',
			range: '5km',
			status: 'active',
			plan: 'Pro',
			expires: '2026-04-01'
		},
		{
			id: 'AD-002',
			business: 'Lakshmi Grocery',
			image:
				'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
			type: 'Push Notification',
			range: '2km',
			status: 'active',
			plan: 'Basic',
			expires: '2026-03-15'
		},
		{
			id: 'AD-003',
			business: 'Meera Tailors',
			image:
				'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
			type: 'WhatsApp',
			range: '3km',
			status: 'paused',
			plan: 'Standard',
			expires: '2026-03-20'
		},
		{
			id: 'AD-004',
			business: 'Raj Mobile Works',
			image:
				'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
			type: 'In-App Banner',
			range: '10km',
			status: 'expired',
			plan: 'Pro',
			expires: '2026-02-28'
		}
	];

	const statusColors = {
		active: 'text-green-700 bg-green-100 border-green-200',
		paused: 'text-amber-700 bg-amber-100 border-amber-200',
		expired: 'text-red-700 bg-red-100 border-red-200'
	};
</script>

<svelte:head>
	<title>Advertisements — NearBuy Admin</title>
	<meta
		name="description"
		content="Monitor and manage active advertisements on the NearBuy platform."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-6xl p-6 md:p-10">
	<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign Control Room</p>
			<h1 class="text-3xl font-black text-gray-900 dark:text-white">Advertisements</h1>
			<p class="mt-1 text-sm font-bold text-gray-500">Monitor active campaigns, edit targeting, and pause weak creatives.</p>
		</div>
		<a href="/admin/subscriptions" class="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-600">Manage Plans</a>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-3xl border border-green-200 bg-green-50 p-5">
			<p class="text-[11px] font-black uppercase tracking-widest text-green-700">Active</p>
			<p class="mt-1 text-3xl font-black text-green-700">{ads.filter((ad) => ad.status === 'active').length}</p>
		</div>
		<div class="rounded-3xl border border-amber-200 bg-amber-50 p-5">
			<p class="text-[11px] font-black uppercase tracking-widest text-amber-700">Paused</p>
			<p class="mt-1 text-3xl font-black text-amber-700">{ads.filter((ad) => ad.status === 'paused').length}</p>
		</div>
		<div class="rounded-3xl border border-red-200 bg-red-50 p-5">
			<p class="text-[11px] font-black uppercase tracking-widest text-red-700">Expired</p>
			<p class="mt-1 text-3xl font-black text-red-700">{ads.filter((ad) => ad.status === 'expired').length}</p>
		</div>
	</div>

	<div class="grid gap-5 md:grid-cols-2">
		{#each ads as ad}
			<div class="overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
				<img src={ad.image} alt={ad.business} class="h-40 w-full object-cover" loading="lazy" />
				<div class="space-y-4 p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h3 class="text-lg font-black text-gray-900 dark:text-white">{ad.business}</h3>
							<p class="text-xs font-bold text-gray-500">{ad.type} • {ad.range} radius • {ad.id}</p>
						</div>
						<span class={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusColors[ad.status]}`}>{ad.status}</span>
					</div>

					<div class="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</p>
						<p class="text-sm font-black text-gray-700 dark:text-gray-200">{ad.plan}</p>
						<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Expires {ad.expires}</p>
					</div>

					<div class="flex items-center gap-2">
						<a
							href={`/admin/advertisements/${ad.id}/edit`}
							class="flex-1 rounded-xl bg-orange-500 py-2.5 text-center text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-400"
							>Edit Campaign</a
						>
						<button class="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-100">Pause</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
