<script>
	const providers = [
		{
			id: 1,
			name: 'Raj Arjun',
			biz: 'Raj Mobile Works',
			distance: '1.2km',
			rating: 4.7,
			jobs: 128,
			type: 'service',
			status: 'interested'
		},
		{
			id: 2,
			name: 'Karthik S',
			biz: 'QuickFix Centre',
			distance: '2.1km',
			rating: 4.4,
			jobs: 84,
			type: 'service',
			status: 'interested'
		},
		{
			id: 3,
			name: 'Suresh P',
			biz: 'Tech Repair Hub',
			distance: '3.5km',
			rating: 4.2,
			jobs: 56,
			type: 'service',
			status: 'interested'
		}
	];

	let selected = $state(null);
	let accepted = $state(false);

	function accept(id) {
		selected = id;
		accepted = true;
	}
</script>

<svelte:head>
	<title>Business Matches — NearBuy</title>
	<meta
		name="description"
		content="Review businesses who responded to your requirement and select the best match."
	/>
</svelte:head>

<div>
	<header class="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
		<a href="/user/post-requirement" class="text-gray-400 hover:text-white">← Back</a>
		<h1 class="font-bold">Nearby Businesses Found</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		{#if !accepted}
			<div class="mb-5">
				<div
					class="mb-4 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4"
				>
					<span class="text-2xl">✅</span>
					<div>
						<p class="font-semibold text-green-400">{providers.length} businesses responded!</p>
						<p class="text-sm text-gray-400">
							Compare profiles and select the best one for your requirement.
						</p>
					</div>
				</div>
				<div class="mb-4 text-sm text-gray-400">
					Requirement: <span class="text-white">Need a plumber for pipe leak</span>
				</div>
			</div>

			<div class="space-y-4">
				{#each providers as p}
					<div class="rounded-2xl border border-gray-800 bg-gray-900 p-5">
						<div class="mb-3 flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-700 text-lg font-bold"
							>
								{p.name[0]}
							</div>
							<div class="flex-1">
								<h3 class="font-semibold">{p.name}</h3>
								<p class="text-sm text-gray-400">{p.biz}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-yellow-400">⭐ {p.rating}</p>
								<p class="text-xs text-gray-400">{p.jobs} jobs</p>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-400">📍 {p.distance}</span>
							<button
								id={`accept-${p.id}`}
								onclick={() => accept(p.id)}
								class="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-400"
								>Accept Business</button
							>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-12 text-center">
				<div class="mb-4 text-5xl">🤝</div>
				<h2 class="mb-2 text-xl font-bold">Business Accepted!</h2>
				<p class="mb-2 text-gray-400">
					Contact details have been shared between you and the business.
				</p>
				<p class="mb-6 text-sm text-gray-400">Coordinate pick-up time and location via chat.</p>
				<a
					href={`/user/messages/${selected}`}
					class="mb-3 block w-full rounded-2xl bg-orange-500 py-3 text-center font-bold text-white transition-all hover:bg-orange-400"
					>💬 Open Chat</a
				>
				<a
					href="/user/order-status"
					class="block w-full rounded-2xl border border-gray-700 py-3 text-center font-semibold text-gray-400 transition-all hover:border-orange-500 hover:text-white"
					>📦 Track Order</a
				>
			</div>
		{/if}
	</div>
</div>
