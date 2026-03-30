<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	const bizId = page.params.id;

	let loading = $state(true);
	let business = $state({
		id: bizId,
		name: 'Loading...',
		description: '',
		founder: '',
		email: '',
		phone: '',
		address: '',
		lat: 13.0827,
		lng: 80.2707,
		rating: 0,
		reviewsCount: 0,
		image: 'https://images.unsplash.com/photo-1556740734-7f9a2b7a0f4d?w=800&auto=format&fit=crop&q=60'
	});

	let items = $state([]);
	let reviews = $state([]);
	let isFavorite = $state(false);
	let currentUserRole = $state('user');

	onMount(async () => {
		try {
			// Fetch all necessary data from the backend
			const [bizRes, itemRes, revRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/businesses/${bizId}`, { credentials: 'include' }),
				fetch(`${API_BASE_URL}/api/items?business_id=${bizId}`, { credentials: 'include' }),
				fetch(`${API_BASE_URL}/api/businesses/${bizId}/reviews`, { credentials: 'include' })
			]);

			if (bizRes.ok) {
				const data = await bizRes.json();
				const b = data.business || data;
				business = {
					...business,
					name: b.name,
					description: b.description,
					founder: b.founder_name || b.founder?.name || 'Owner',
					email: b.email,
					phone: b.phone,
					address: `${b.city || ''}, ${b.state || ''}`,
					lat: b.lat || 13.0827,
					lng: b.lng || 80.2707,
					rating: b.rating || 0,
					image: b.image_url || b.image || business.image
				};
			}

			if (itemRes.ok) {
				const data = await itemRes.json();
				items = (data.items || []).map(i => ({
					id: i.id,
					name: i.name,
					category: i.category,
					price: `₹${(i.price || 0).toLocaleString()}`,
					stock: i.stock,
					image: i.image_url || i.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
				}));
			}

			if (revRes.ok) {
				const data = await revRes.json();
				reviews = (data.reviews || []).map(r => ({
					id: r.id,
					user: r.userName || r.user_name || 'User',
					rating: r.rating,
					comment: r.comment,
					date: new Date(r.createdAt || r.created_at).toLocaleDateString()
				}));
				business.reviewsCount = reviews.length;
			}
		} catch (err) {
			console.error('Failed to load business details:', err);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{business.name} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-32 dark:bg-gray-950">
	<!-- Hero Section -->
	<div class="relative h-64 w-full overflow-hidden md:h-80">
		<img src={business.image} alt={business.name} class="h-full w-full object-cover" />
		<div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
		
		<div class="absolute top-6 left-6 right-6 flex items-center justify-between">
			<a href="/user/home" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
				←
			</a>
			<button 
				onclick={() => isFavorite = !isFavorite}
				class={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
			>
				{isFavorite ? '❤️' : '🤍'}
			</button>
		</div>

		<div class="absolute bottom-8 left-8 right-8">
			<div class="flex items-end justify-between">
				<div>
					<div class="mb-2 flex items-center gap-2">
						<span class="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-lg shadow-orange-500/30">Verified</span>
						<span class="flex items-center gap-1 text-sm font-bold text-yellow-400">⭐ {business.rating}</span>
					</div>
					<h1 class="text-4xl font-black text-white">{business.name}</h1>
					<p class="mt-2 text-sm font-medium text-gray-300">{business.address}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="mx-auto max-w-4xl px-6 py-12">
		<div class="grid gap-12 md:grid-cols-3">
			<!-- Main Info -->
			<div class="md:col-span-2 space-y-12">
				<section>
					<h2 class="mb-4 text-2xl font-black text-gray-900 dark:text-white">About</h2>
					<p class="leading-relaxed text-gray-600 dark:text-gray-400">
						{business.description}
					</p>
				</section>

				<section>
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-2xl font-black text-gray-900 dark:text-white">Products</h2>
						<button class="text-sm font-bold text-orange-500">View All →</button>
					</div>
					<div class="grid gap-6 sm:grid-cols-2">
						{#each items as item}
							<a href={`/user/item/${item.id}`} class="group rounded-3xl border border-gray-100 bg-white p-4 transition-all hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
								<div class="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800 mb-4">
									<img src={item.image} alt={item.name} class="h-full w-full object-cover transition-transform group-hover:scale-110" />
								</div>
								<p class="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">{item.category}</p>
								<h3 class="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
								<p class="mt-2 text-lg font-black">{item.price}</p>
							</a>
						{/each}
					</div>
				</section>

				<section>
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-2xl font-black text-gray-900 dark:text-white">Reviews</h2>
						<a href={`/user/reviews/businesses/${bizId}`} class="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors">See All ({business.reviewsCount}) →</a>
					</div>
					<div class="space-y-4">
						{#each reviews as review}
							<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
								<div class="mb-2 flex items-center justify-between">
									<span class="font-bold text-gray-900 dark:text-white">{review.user}</span>
									<span class="text-xs text-gray-500">{review.date}</span>
								</div>
								<div class="mb-3 flex gap-0.5 text-xs text-yellow-500">
									{#each Array(5) as _, i}
										<span>{i < review.rating ? '⭐' : '☆'}</span>
									{/each}
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">"{review.comment}"</p>
							</div>
						{/each}
						<a href={`/user/review/${bizId}`} class="block w-full rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-bold text-gray-400 hover:border-orange-500/30 hover:text-orange-500 dark:border-gray-800 text-center">
							Write a review
						</a>
					</div>
				</section>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<div class="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50 dark:bg-gray-900 dark:shadow-none">
					<h3 class="mb-6 text-xl font-bold">Details</h3>
					<div class="space-y-6">
						<div class="flex items-start gap-4">
							<span class="text-xl">📍</span>
							<div>
								<p class="text-[10px] font-bold text-gray-400 uppercase">Location</p>
								<p class="text-sm font-bold leading-snug">{business.address}</p>
							</div>
						</div>
						<div class="flex items-start gap-4">
							<span class="text-xl">👤</span>
							<div>
								<p class="text-[10px] font-bold text-gray-400 uppercase">Founder</p>
								<p class="text-sm font-bold leading-snug">{business.founder}</p>
							</div>
						</div>
						<div class="flex items-start gap-4">
							<span class="text-xl">📞</span>
							<div>
								<p class="text-[10px] font-bold text-gray-400 uppercase">Contact</p>
								<p class="text-sm font-bold leading-snug">{business.phone}</p>
							</div>
						</div>
					</div>

					<!-- Find Us Map -->
					<div class="mt-6">
						<p class="text-[10px] font-bold text-gray-400 uppercase mb-2">Find Us</p>
						{#await import('$lib/components/NearBuyMap.svelte') then { default: NearBuyMap }}
							<NearBuyMap
								center={[business.lng, business.lat]}
								zoom={15}
								height="180px"
								markers={[{ id: 'biz', lat: business.lat, lng: business.lng, label: '🏪', popup: `<b>${business.name}</b><br/><span style="color:#888;font-size:11px">${business.address}</span>` }]}
								showControls={false}
								interactive={true}
							/>
						{/await}
					</div>
					
					{#if currentUserRole === 'user'}
						<a href={`/user/messages/${bizId}`} class="mt-8 block w-full rounded-2xl bg-orange-500 py-4 font-black text-white shadow-xl shadow-orange-500/30 active:scale-95 text-center transition-all hover:bg-orange-600">
							Message Business
						</a>
					{:else if currentUserRole === 'founder'}
						<a href={`/provider/messages/founder_${bizId}`} class="mt-8 block w-full rounded-2xl bg-purple-500 py-4 font-black text-white shadow-xl shadow-purple-500/30 active:scale-95 text-center transition-all hover:bg-purple-600">
							Message Founder 👑
						</a>
					{:else}
						<button disabled class="mt-8 block w-full rounded-2xl border border-gray-200 bg-gray-100 py-4 font-black text-gray-500 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800 dark:text-gray-600 transition-all">
							B2B Messaging Restricted 🚫
						</button>
					{/if}

					<div class="mt-3 text-right">
						<select bind:value={currentUserRole} class="appearance-none bg-transparent text-[9px] font-black uppercase tracking-widest text-gray-400 focus:outline-none cursor-pointer hover:text-orange-500 transition-colors">
							<option value="user">Test as User</option>
							<option value="business_employee">Test as Employee</option>
							<option value="founder">Test as Founder</option>
						</select>
					</div>
				</div>

				<div class="rounded-3xl border border-orange-100 bg-orange-50/30 p-6 dark:border-orange-500/10 dark:bg-orange-500/5">
					<div class="flex items-center gap-3 mb-3">
						<span class="text-2xl">⚡</span>
						<h4 class="font-bold">Fast Delivery</h4>
					</div>
					<p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
						This business typically ships orders within 2 hours for local customers.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
