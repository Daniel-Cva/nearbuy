<script>
	let showModal = $state(false);
	let editPlan = $state(null); // null = create, object = edit

	const plans = $state([
		{
			id: 'PLAN-001',
			name: 'Basic',
			image:
				'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
			price: 299,
			duration: 30,
			reach: '2km',
			adTypes: ['In-App Banner'],
			businesses: 18,
			color: 'gray'
		},
		{
			id: 'PLAN-002',
			name: 'Standard',
			image:
				'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80',
			price: 599,
			duration: 30,
			reach: '5km',
			adTypes: ['In-App Banner', 'Push Notification'],
			businesses: 32,
			color: 'orange'
		},
		{
			id: 'PLAN-003',
			name: 'Pro',
			image:
				'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
			price: 999,
			duration: 30,
			reach: '10km',
			adTypes: ['In-App Banner', 'Push Notification', 'WhatsApp'],
			businesses: 14,
			color: 'purple'
		}
	]);

	// Form state
	let form = $state({
		name: '',
		price: '',
		duration: 30,
		reach: '',
		adBanner: false,
		adPush: false,
		adWhatsapp: false,
		adSMS: false
	});

	function openCreate() {
		editPlan = null;
		form = {
			name: '',
			price: '',
			duration: 30,
			reach: '',
			adBanner: true,
			adPush: false,
			adWhatsapp: false,
			adSMS: false
		};
		showModal = true;
	}

	function openEdit(plan) {
		editPlan = plan;
		form = {
			name: plan.name,
			price: String(plan.price),
			duration: plan.duration,
			reach: plan.reach,
			adBanner: plan.adTypes.includes('In-App Banner'),
			adPush: plan.adTypes.includes('Push Notification'),
			adWhatsapp: plan.adTypes.includes('WhatsApp'),
			adSMS: plan.adTypes.includes('SMS')
		};
		showModal = true;
	}

	function savePlan() {
		const adTypes = [
			form.adBanner && 'In-App Banner',
			form.adPush && 'Push Notification',
			form.adWhatsapp && 'WhatsApp',
			form.adSMS && 'SMS'
		].filter(Boolean);

		if (editPlan) {
			const idx = plans.findIndex((p) => p.id === editPlan.id);
			if (idx !== -1) {
				plans[idx] = {
					...plans[idx],
					name: form.name,
					price: Number(form.price),
					duration: Number(form.duration),
					reach: form.reach,
					adTypes
				};
			}
		} else {
			const newId = `PLAN-${String(plans.length + 1).padStart(3, '0')}`;
			plans.push({
				id: newId,
				name: form.name,
				image:
					'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
				price: Number(form.price),
				duration: Number(form.duration),
				reach: form.reach,
				adTypes,
				businesses: 0,
				color: 'blue'
			});
		}
		showModal = false;
	}

	function deletePlan(id) {
		const idx = plans.findIndex((p) => p.id === id);
		if (idx !== -1) plans.splice(idx, 1);
	}

	const planColors = {
		gray: {
			border: 'border-gray-700/50 hover:border-gray-500 shadow-gray-500/5 hover:shadow-gray-500/10',
			badge: 'bg-gray-500/10 text-gray-300 border border-gray-500/20',
			accent: 'text-gray-200',
			bg: 'bg-gradient-to-br from-gray-900 to-gray-800'
		},
		orange: {
			border: 'border-orange-500/30 hover:border-orange-500/60 shadow-orange-500/10 hover:shadow-orange-500/20',
			badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
			accent: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300',
			bg: 'bg-gradient-to-br from-gray-900 to-orange-950/20'
		},
		purple: {
			border: 'border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10 hover:shadow-purple-500/20',
			badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
			accent: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300',
			bg: 'bg-gradient-to-br from-gray-900 to-purple-950/20'
		},
		blue: {
			border: 'border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10 hover:shadow-blue-500/20',
			badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
			accent: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300',
			bg: 'bg-gradient-to-br from-gray-900 to-blue-950/20'
		}
	};

	const totalRevenue = $derived(plans.reduce((sum, p) => sum + p.price * p.businesses, 0));
	const totalSubscribers = $derived(plans.reduce((sum, p) => sum + p.businesses, 0));
</script>

<svelte:head>
	<title>Subscriptions — NearBuy Admin</title>
	<meta
		name="description"
		content="Manage NearBuy advertisement subscription plans for businesses."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-6xl p-4 md:p-8">
	<!-- Header -->
	<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
			<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Create and manage advertisement subscription tiers</p>
		</div>
		<button
			id="btn-new-plan"
			onclick={openCreate}
			class="self-start rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/40 active:scale-95"
			>+ Create Plan</button
		>
	</div>

	<!-- Stats bar -->
	<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Plans</p>
			<p class="mt-2 text-3xl font-black text-gray-900 dark:text-white">{plans.length}</p>
		</div>
		<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Subscribers</p>
			<p class="mt-2 text-3xl font-black text-gray-900 dark:text-white">{totalSubscribers}</p>
		</div>
		<div class="col-span-2 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 p-5 shadow-sm sm:col-span-1">
			<p class="text-xs font-medium text-orange-600 dark:text-orange-400">Est. Monthly Revenue</p>
			<p class="mt-2 text-3xl font-black text-orange-600 dark:text-orange-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
		</div>
	</div>

	<!-- Plan cards -->
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each plans as plan}
			{@const c = planColors[plan.color] ?? planColors.gray}
			<div class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-500/50">
				<img src={plan.image} alt={plan.name} class="h-28 w-full object-cover" loading="lazy" />
				<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-wide">{plan.name}</h2>
						<p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{plan.id}</p>
					</div>
					<span class="rounded-full px-3 py-1 text-xs font-bold tracking-wide bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20"
						>{plan.businesses} biz</span
					>
				</div>

				<div class="mb-1 text-4xl font-black tracking-tight text-orange-600 dark:text-orange-400">
					₹{plan.price.toLocaleString('en-IN')}
					<span class="text-sm font-medium text-gray-500 dark:text-gray-500">/{plan.duration}d</span>
				</div>
				<div class="mb-5 text-sm font-medium text-gray-600 dark:text-gray-400">Coverage radius: {plan.reach}</div>

				<div class="flex-1 space-y-2.5">
					{#each plan.adTypes as t}
						<div class="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>
							{t}
						</div>
					{/each}
				</div>

				<div class="mt-8 flex gap-3">
					<a
						href={`/admin/subscriptions/${plan.id}/edit`}
						class="flex-1 text-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all duration-300 hover:border-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:scale-95"
						>Edit</a
					>
					<button
						onclick={() => deletePlan(plan.id)}
						class="rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 transition-all duration-300 hover:border-red-500 dark:hover:border-red-500/50 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 active:scale-95"
						>Delete</button
					>
				</div>
				</div>
			</div>
		{/each}

		<!-- Add placeholder -->
		<button
			onclick={openCreate}
			class="group flex min-h-62.5 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 transition-all duration-300 hover:border-orange-400 dark:hover:border-orange-500/40 hover:bg-orange-50 dark:hover:bg-orange-500/5 hover:text-orange-500 dark:hover:text-orange-400 hover:shadow-lg active:scale-95"
		>
			<div class="flex h-14 w-14 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 transition-all duration-300 group-hover:border-orange-300 dark:group-hover:border-orange-500/30 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20">
				<span class="text-3xl font-light">+</span>
			</div>
			<span class="text-sm font-bold tracking-wide">Create New Plan</span>
		</button>
	</div>
</div>

<!-- ─── CREATE / EDIT MODAL ─── -->
{#if showModal}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm border-none w-full h-full cursor-default"
		onclick={() => (showModal = false)}
		aria-label="Close modal"
	></button>

	<!-- Panel -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal header -->
			<div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-5">
				<div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white">{editPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
					<p class="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
						{editPlan ? `Editing ${editPlan.id}` : 'Add a new subscription tier'}
					</p>
				</div>
				<button
					id="btn-close-modal"
					onclick={() => (showModal = false)}
					class="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 dark:text-gray-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
					>✕</button
				>
			</div>

			<!-- Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					savePlan();
				}}
				class="space-y-4 p-6"
			>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400" for="plan-name"
							>Plan Name</label
						>
						<input
							id="plan-name"
							type="text"
							bind:value={form.name}
							placeholder="e.g. Premium"
							class="input-field"
							required
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400" for="plan-price"
							>Price (₹/month)</label
						>
						<input
							id="plan-price"
							type="number"
							bind:value={form.price}
							placeholder="999"
							min="1"
							class="input-field"
							required
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400" for="plan-duration"
							>Duration (days)</label
						>
						<input
							id="plan-duration"
							type="number"
							bind:value={form.duration}
							placeholder="30"
							min="1"
							class="input-field"
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400" for="plan-reach"
							>Coverage Radius</label
						>
						<input
							id="plan-reach"
							type="text"
							bind:value={form.reach}
							placeholder="e.g. 10km"
							class="input-field"
							required
						/>
					</div>
				</div>

				<div>
					<p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Ad Channels Included</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [{ key: 'adBanner', label: 'In-App Banner' }, { key: 'adPush', label: 'Push Notification' }, { key: 'adWhatsapp', label: 'WhatsApp' }, { key: 'adSMS', label: 'SMS' }] as ch}
							<label
								class={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${form[ch.key] ? 'border-orange-500/40 bg-orange-50 dark:bg-orange-500/5 text-gray-900 dark:text-white' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'}`}
							>
								<input type="checkbox" bind:checked={form[ch.key]} class="accent-orange-500" />
								<span class="text-sm">{ch.label}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:scale-95"
						>Cancel</button
					>
					<button
						id="btn-save-plan"
						type="submit"
						class="flex-1 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/40 active:scale-95"
						>{editPlan ? 'Save Changes' : 'Create Plan'}</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.input-field {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid rgb(209 213 219);
		background: white;
		padding: 0.65rem 0.875rem;
		color: rgb(17 24 39);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.2s;
	}
	:global(.dark) .input-field {
		border-color: rgb(55 65 81);
		background: rgba(31, 41, 55, 0.8);
		color: white;
	}
	.input-field:focus {
		border-color: #f97316;
	}
	.input-field::placeholder {
		color: rgb(156 163 175);
	}
	:global(.dark) .input-field::placeholder {
		color: rgb(75 85 99);
	}
</style>
