<script>
	import { getCurrentBusinessId } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { timeAgo } from '$lib/helpers/id.js';

	let rawAds = $state([]);
	let loading = $state(true);

	const ads = $derived(
		rawAds.map(a => ({
			id: a.id,
			title: a.title,
			type: a.type,
			reach: '5km',
			status: a.status === 'completed' ? 'expired' : a.status,
			date: (a.createdAt || a.created_at)?.slice(0, 10) || '',
			plan: (a.budget || 0) <= 2000 ? 'basic' : (a.budget || 0) <= 5000 ? 'standard' : 'premium',
			description: a.description,
			targeting: a.targeting || [],
			images: a.image_url ? [a.image_url] : a.image ? [a.image] : []
		}))
	);

	async function fetchAds() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me/ads`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawAds = data.ads || [];
			}
		} catch (err) {
			console.error('Failed to fetch ads:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchAds();
	});

	let showCreateForm = $state(false);
	let selectedPlan = $state('');
	let adType = $state('in-app');
	let range = $state(5);
	let headline = $state('');
	let description = $state('');
	let submitted = $state(false);
	let showPayment = $state(false);
	let selectedPaymentMethod = $state('');
	let uploadedImages = $state([]);

	// New states
	let selectedTargetCategories = $state([]);
	let inspectionAd = $state(null);
	let showInspection = $state(false);

	const categories = [
		'Electronics', 'Fashion', 'Food', 'Groceries', 'Beauty', 
		'Sports', 'Home Decor', 'Automotive', 'Gadgets', 'Health'
	];

	const plans = [
		{ id: 'basic', name: 'Basic', price: 299, reach: '2km' },
		{ id: 'standard', name: 'Standard', price: 599, reach: '5km' },
		{ id: 'pro', name: 'Pro', price: 999, reach: '10km' }
	];

	function toggleCategory(cat) {
		if (selectedTargetCategories.includes(cat)) {
			selectedTargetCategories = selectedTargetCategories.filter((c) => c !== cat);
		} else {
			selectedTargetCategories.push(cat);
		}
	}

	function handleSubmit(e) {
		if (e) e.preventDefault();
		if (!selectedPlan) {
			alert('Please select an advertising plan.');
			return;
		}
		showPayment = true;
	}

	function handleFileUpload(e) {
		const files = Array.from(e.target.files);
		files.forEach(file => {
			const reader = new FileReader();
			reader.onload = (ev) => {
				uploadedImages.push(ev.target.result);
			};
			reader.readAsDataURL(file);
		});
	}

	async function handlePayment(e) {
		if (e) e.preventDefault();
		if (!selectedPaymentMethod) {
			alert('Please select a payment method.');
			return;
		}
		
		const budget = plans.find(p => p.id === selectedPlan)?.price || 500;
		
		try {
			const res = await fetch(`${API_BASE_URL}/api/me/ads`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: headline,
					description: description,
					type: adType,
					image: uploadedImages[0] || null,
					budget: budget,
					targeting: selectedTargetCategories,
					status: 'active'
				}),
				credentials: 'include'
			});
			
			if (res.ok) {
				showPayment = false;
				submitted = true;
				fetchAds();
				
				setTimeout(() => {
					submitted = false;
					showCreateForm = false;
					headline = '';
					description = '';
					selectedTargetCategories = [];
					selectedPlan = '';
					selectedPaymentMethod = '';
					uploadedImages = [];
				}, 3000);
			}
		} catch (err) {
			console.error('Failed to create ad:', err);
		}
	}

	async function deleteAd(id) {
		if (confirm('Are you sure you want to delete this advertisement?')) {
			try {
				const res = await fetch(`${API_BASE_URL}/api/me/ads/${id}`, {
					method: 'DELETE',
					credentials: 'include'
				});
				if (res.ok) {
					fetchAds();
				}
			} catch (err) {
				console.error('Failed to delete ad:', err);
			}
		}
	}

	function openInspect(ad) {
		inspectionAd = ad;
		showInspection = true;
	}

	function closeInspect() {
		showInspection = false;
		inspectionAd = null;
	}

	$effect(() => {
		if (showInspection) {
			document.body.classList.add('lock-scroll');
		} else {
			document.body.classList.remove('lock-scroll');
		}

		return () => {
			document.body.classList.remove('lock-scroll');
		};
	});
</script>

<svelte:head>
	<title>Advertisements — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div
		class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:top-0 md:bg-transparent md:border-none md:backdrop-blur-none md:static md:px-0 md:py-0 md:mb-6 md:mt-2"
	>
		<div class="flex items-center gap-4">
			<a
				href="/provider/home"
				class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>← Home</a
			>
			<h1 class="font-bold text-gray-900 dark:text-white">Advertisements</h1>
		</div>
		{#if !showCreateForm}
			<button
				onclick={() => (showCreateForm = true)}
				class="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-400 shadow-md shadow-orange-500/20"
				>+ Create Ad</button
			>
		{/if}
	</div>

	<div class="mx-auto max-w-2xl px-6 py-6 md:py-0 md:px-0">
		{#if showCreateForm}
			{#if submitted}
				<div class="py-20 text-center animate-in fade-in zoom-in duration-500">
					<div
						class="mb-6 flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-orange-100 text-5xl dark:bg-orange-500/10 text-orange-500"
					>
						🚀
					</div>
					<h2 class="text-3xl font-black text-gray-900 dark:text-white">Ad is Live!</h2>
					<p class="mt-2 text-gray-500">Redirecting to your ads list...</p>
				</div>
			{:else if showPayment}
				<div class="animate-in fade-in slide-in-from-right-10 duration-500">
					<div class="mb-6 flex items-center justify-between">
						<div>
							<h2 class="text-xl font-bold text-gray-900 dark:text-white">Secure Payment</h2>
							<p class="text-sm font-medium text-gray-500">Choose your preferred payment method</p>
						</div>
						<div class="text-right">
							<p class="text-[10px] uppercase font-black text-gray-400">Amount to Pay</p>
							<p class="text-3xl font-black text-orange-500">₹{plans.find(p => p.id === selectedPlan)?.price || '0'}</p>
						</div>
					</div>

					<div class="space-y-4">
						<div class="grid grid-cols-1 gap-3">
							<!-- UPI -->
							<button 
								onclick={() => selectedPaymentMethod = 'upi'}
								class={`flex items-center justify-between p-5 rounded-3xl border transition-all ${selectedPaymentMethod === 'upi' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
							>
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">📱</div>
									<div class="text-left">
										<p class="font-bold text-gray-900 dark:text-white">UPI (PhonePe, GPay, Paytm)</p>
										<p class="text-xs text-gray-500">Instant payment with any UPI App</p>
									</div>
								</div>
								{#if selectedPaymentMethod === 'upi'}
									<div class="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">✓</div>
								{/if}
							</button>

							<!-- Net Banking -->
							<button 
								onclick={() => selectedPaymentMethod = 'nb'}
								class={`flex items-center justify-between p-5 rounded-3xl border transition-all ${selectedPaymentMethod === 'nb' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
							>
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">🏦</div>
									<div class="text-left">
										<p class="font-bold text-gray-900 dark:text-white">Net Banking</p>
										<p class="text-xs text-gray-500">All major Indian banks supported</p>
									</div>
								</div>
								{#if selectedPaymentMethod === 'nb'}
									<div class="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">✓</div>
								{/if}
							</button>

							<!-- BillDesk / Cards -->
							<button 
								onclick={() => selectedPaymentMethod = 'billdesk'}
								class={`flex items-center justify-between p-5 rounded-3xl border transition-all ${selectedPaymentMethod === 'billdesk' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
							>
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">💳</div>
									<div class="text-left">
										<p class="font-bold text-gray-900 dark:text-white">BillDesk (Card/Wallet)</p>
										<p class="text-xs text-gray-500">Secure gateway for cards & wallets</p>
									</div>
								</div>
								{#if selectedPaymentMethod === 'billdesk'}
									<div class="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">✓</div>
								{/if}
							</button>

							<!-- Paytm Wallet -->
							<button 
								onclick={() => selectedPaymentMethod = 'paytm'}
								class={`flex items-center justify-between p-5 rounded-3xl border transition-all ${selectedPaymentMethod === 'paytm' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
							>
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">💰</div>
									<div class="text-left">
										<p class="font-bold text-gray-900 dark:text-white">Paytm Wallet</p>
										<p class="text-xs text-gray-500">Pay directly using your Paytm balance</p>
									</div>
								</div>
								{#if selectedPaymentMethod === 'paytm'}
									<div class="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">✓</div>
								{/if}
							</button>
						</div>

						<div class="flex items-center gap-3">
							<button 
								onclick={() => showPayment = false}
								class="flex-1 rounded-2xl border border-gray-200 py-4 font-bold text-gray-600 dark:border-gray-800 dark:text-gray-400"
							>
								Back
							</button>
							<button 
								onclick={handlePayment}
								disabled={!selectedPaymentMethod}
								class={`flex-2 rounded-2xl py-4 font-black text-white shadow-xl transition-all ${!selectedPaymentMethod ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20 active:scale-95'}`}
							>
								Secure Payment & Launch ✓
							</button>
						</div>

						<p class="text-[10px] text-center text-gray-400 uppercase tracking-widest mt-4">
							🔒 SSL SECURE 256-BIT ENCRYPTION
						</p>
					</div>
				</div>
			{:else}
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">Create New Ad</h2>
					<button
						onclick={() => (showCreateForm = false)}
						class="text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button
					>
				</div>
				<form
					onsubmit={handleSubmit}
					class="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
				>
					<!-- Plan Selection -->
					<div>
						<h3 class="mb-3 text-sm font-bold text-gray-900 dark:text-white">1. Choose a Plan</h3>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							{#each plans as plan}
								<button
									type="button"
									onclick={() => (selectedPlan = plan.id)}
									class={`rounded-2xl border p-4 text-center transition-all ${selectedPlan === plan.id ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
								>
									<p class="text-sm font-bold">{plan.name}</p>
									<p class="text-xl font-black text-orange-500">₹{plan.price}</p>
									<p class="text-[10px] uppercase font-bold text-gray-400">Up to {plan.reach}</p>
								</button>
							{/each}
						</div>
					</div>

					<!-- Ad Type -->
					<div>
						<h3 class="mb-3 text-sm font-bold text-gray-900 dark:text-white">2. Ad Type</h3>
						<div class="grid grid-cols-1 gap-3">
							{#each [['in-app', '📱 In-App Banner'], ['push', '🔔 Push Notification'], ['whatsapp', '💬 WhatsApp']] as [val, label]}
								<label
									class={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${adType === val ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
								>
									<input type="radio" value={val} bind:group={adType} class="accent-orange-500" />
									<span class="text-sm font-bold">{label}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Targeting -->
					<div>
						<h3 class="mb-3 text-sm font-bold text-gray-900 dark:text-white">3. Targeting</h3>
						<div class="flex flex-wrap gap-2">
							{#each categories as category}
								<button
									type="button"
									onclick={() => toggleCategory(category)}
									class={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${selectedTargetCategories.includes(category) ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
								>
									{category}
								</button>
							{/each}
						</div>
					</div>

					<!-- Content & Images -->
					<div>
						<h3 class="mb-3 text-sm font-bold text-gray-900 dark:text-white">4. Content & Images</h3>
						<input
							type="text"
							bind:value={headline}
							placeholder="Headline"
							class="mb-3 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
							required
						/>
						<textarea
							bind:value={description}
							placeholder="Description"
							rows="3"
							class="mb-4 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
						></textarea>

						<!-- Image Upload -->
						<div class="space-y-3">
							<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ad Visuals (Poster/Banner)</p>
							<div class="grid grid-cols-2 gap-4">
								{#each uploadedImages as img, i}
									<div class="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
										<img src={img} alt="preview" class="h-full w-full object-cover" />
										<button type="button" onclick={() => uploadedImages.splice(i, 1)} class="absolute top-2 right-2 h-6 w-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">✕</button>
									</div>
								{/each}
								
								{#if uploadedImages.length < 2}
									<label class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-orange-500 hover:bg-orange-50/30 transition-all dark:border-gray-700 dark:bg-gray-800">
										<span class="mb-1 text-2xl">📸</span>
										<p class="text-[10px] font-black text-gray-400 uppercase">Add Photo</p>
										<input type="file" multiple accept="image/*" class="hidden" onchange={handleFileUpload} />
									</label>
								{/if}
							</div>
						</div>
					</div>

					<button
						type="submit"
						class="w-full rounded-2xl bg-orange-500 py-4 font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98]"
						>Launch Advertisement 🚀</button
					>
				</form>
			{/if}
		{:else if ads.length > 0}
			<div class="space-y-4">
				{#each ads as ad}
					<div
						class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-orange-500/30 dark:border-gray-800 dark:bg-gray-900"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-2 flex items-center gap-2">
									<span
										class={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${ad.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}
									>
										{ad.status}
									</span>
									<span class="text-xs font-bold text-gray-400 uppercase tracking-tight"
										>ID: {ad.id}</span
									>
								</div>
								<h3 class="text-lg font-bold text-gray-900 dark:text-white">{ad.title}</h3>
								<div class="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
									<span
										>Type: <span class="capitalize font-bold text-gray-700 dark:text-gray-300"
											>{ad.type}</span
										></span
									>
									<span
										>Plan: <span class="capitalize font-bold text-orange-500"
											>{ad.plan}</span
										></span
									>
									<span
										>Reach: <span class="font-bold text-gray-700 dark:text-gray-300"
											>{ad.reach}</span
										></span
									>
									<span
										>Started: <span class="font-bold text-gray-700 dark:text-gray-300"
											>{ad.date}</span
										></span
									>
								</div>
								{#if ad.targeting && ad.targeting.length > 0}
									<div class="mt-3 flex flex-wrap gap-1">
										{#each ad.targeting as tag}
											<span
												class="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400"
												>{tag}</span
											>
										{/each}
									</div>
								{/if}
							</div>
							<div class="flex flex-col gap-2">
								<button
									onclick={() => openInspect(ad)}
									class="rounded-xl border border-gray-100 bg-gray-50 p-2 text-blue-500 transition-all hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-blue-500/10"
									title="Inspect Ad"
								>
									👁️
								</button>
								<button
									onclick={() => deleteAd(ad.id)}
									class="rounded-xl border border-gray-100 bg-gray-50 p-2 text-red-500 transition-all hover:bg-red-50 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-red-500/10"
									title="Delete Ad"
								>
									🗑️
								</button>
								<a  
									href={`/provider/advertise/${ad.id}/stats`}
									class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-500 transition-all hover:bg-orange-50 hover:text-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-orange-500/10"
									title="View Stats"
								>
									📊
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-800 dark:bg-gray-900/50"
			>
				<div class="mb-6 text-7xl opacity-40">📢</div>
				<h2 class="mb-2 text-2xl font-black text-gray-900 dark:text-white">
					No active advertisements
				</h2>
				<p class="mb-8 max-w-xs text-center font-medium text-gray-500 dark:text-gray-400">
					Reach thousands of nearby customers by starting a local ad campaign.
				</p>
				<button
					onclick={() => (showCreateForm = true)}
					class="rounded-2xl bg-orange-500 px-8 py-4 font-bold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-1 hover:bg-orange-600 active:scale-95"
					>Create Your First Ad 🚀</button
				>
			</div>
		{/if}
	</div>
</div>

<!-- Inspection Overlay -->
{#if showInspection && inspectionAd}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 py-10 backdrop-blur-sm px-6"
	>
		<div
			class="relative w-full max-w-lg my-auto animate-in slide-in-from-bottom duration-300 bg-white dark:bg-gray-950 rounded-[32px] shadow-2xl overflow-hidden"
		>
			<div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
				<h2 class="text-xl font-black text-gray-900 dark:text-white">Ad Inspection</h2>
				<button onclick={closeInspect} class="text-2xl font-bold text-gray-400 hover:text-gray-900">×</button>
			</div>
			
			<div class="p-6 overflow-y-auto max-h-[70vh]">
				<div class="space-y-6">
					<div>
						<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Headline</p>
						<p class="text-lg font-bold text-gray-900 dark:text-white">{inspectionAd.title}</p>
					</div>

					<div>
						<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Description</p>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl italic">"{inspectionAd.description || 'No description provided.'}"</p>
					</div>

					{#if inspectionAd.images && inspectionAd.images.length > 0}
						<div>
							<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">Ad Visuals</p>
							<div class="grid grid-cols-1 gap-4">
								{#each inspectionAd.images as img}
									<div class="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
										<img src={img} alt="Ad poster" class="w-full h-auto object-cover" />
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div class="rounded-2xl border border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 p-4 font-bold">
							<p class="text-[10px] text-gray-400 uppercase tracking-tight">Type</p>
							<p class="text-sm dark:text-white capitalize">{inspectionAd.type}</p>
						</div>
						<div class="rounded-2xl border border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 p-4 font-bold">
							<p class="text-[10px] text-gray-400 uppercase tracking-tight">Plan</p>
							<p class="text-sm dark:text-white capitalize">{inspectionAd.plan}</p>
						</div>
						<div class="rounded-2xl border border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 p-4 font-bold">
							<p class="text-[10px] text-gray-400 uppercase tracking-tight">Reach</p>
							<p class="text-sm dark:text-white">{inspectionAd.reach}</p>
						</div>
					</div>

					<div>
						<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Target Audience</p>
						<div class="flex flex-wrap gap-2">
							{#if inspectionAd.targeting && inspectionAd.targeting.length > 0}
								{#each inspectionAd.targeting as tag}
									<span class="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
										{tag}
									</span>
								{/each}
							{:else}
								<span class="text-xs text-gray-500 italic">Broad targeting (All categories)</span>
							{/if}
						</div>
					</div>

					<div class="rounded-2xl bg-orange-500 p-6 text-white shadow-lg shadow-orange-500/20">
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs font-bold uppercase tracking-widest opacity-80">Campaign Status</p>
							<span class="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase">{inspectionAd.status}</span>
						</div>
						<p class="text-2xl font-black">Performance: Good</p>
						<p class="mt-1 text-sm font-medium opacity-90">Your ad is currently reaching nearby {inspectionAd.reach} customers in {inspectionAd.targeting.join(', ')}.</p>
					</div>
				</div>
			</div>

			<div class="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3">
				<button onclick={closeInspect} class="flex-1 rounded-2xl bg-white border border-gray-200 py-4 font-bold text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white">Close</button>
				<button class="flex-1 rounded-2xl bg-orange-500 py-4 font-bold text-white">Edit Campaign</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body.lock-scroll) {
		overflow: hidden;
	}
</style>
