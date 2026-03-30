<script>
	let wishlistItems = $state([
		{
			id: 1,
			type: 'product',
			name: 'iPhone 15 Case - Midnight Black',
			shop: 'Krishna Electronics',
			shopId: 1,
			price: 299,
			image: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&w=600&q=80',
			addedOn: 'Oct 15, 2026',
			inStock: true
		},
		{
			id: 2,
			type: 'offer',
			name: 'Free AC Service with Deep Cleaning',
			shop: 'Perfect Fixers',
			shopId: 5,
			price: null,
			image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
			addedOn: 'Oct 22, 2026',
			inStock: true
		},
		{
			id: 3,
			type: 'service',
			name: 'General Plumbing Inspection',
			shop: 'Sri Home Services',
			shopId: 4,
			price: 499,
			image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
			addedOn: 'Nov 02, 2026',
			inStock: false
		}
	]);

	function removeItem(id) {
		wishlistItems = wishlistItems.filter((i) => i.id !== id);
	}
</script>

<svelte:head>
	<title>My Wishlist — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/user/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
		<h1 class="font-bold flex-1">My Wishlist</h1>
		<div class="text-xl">❤️</div>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		<div class="mb-6 flex items-end justify-between">
			<p class="text-sm text-gray-500 dark:text-gray-400">Items and offers you've saved for later.</p>
			<span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
				{wishlistItems.length} Items
			</span>
		</div>

		{#if wishlistItems.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each wishlistItems as item}
					<div class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-orange-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500/50">
						<!-- Image Container -->
						<div class="relative h-40 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
							<img src={item.image} alt={item.name} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
							
							<!-- Remove Button -->
							<button 
								onclick={() => removeItem(item.id)}
								class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 hover:bg-red-50 dark:bg-gray-900/90 dark:hover:bg-red-500/10"
								title="Remove from wishlist"
							>
								✕
							</button>

							<!-- Type Badge -->
							<div class="absolute top-2 left-2">
								<span class={`rounded-xl px-2 py-1 text-[10px] font-black tracking-wider text-white shadow-sm uppercase ${item.type === 'offer' ? 'bg-purple-500' : item.type === 'service' ? 'bg-blue-500' : 'bg-orange-500'}`}>
									{item.type}
								</span>
							</div>
						</div>

						<!-- Content -->
						<div class="flex flex-1 flex-col p-4">
							<a 
								href={item.type === 'offer' ? `/user/offers/${item.id}` : `/user/item/${item.id}`} 
								class="mb-1 text-base font-bold leading-tight group-hover:text-orange-500 transition-colors line-clamp-2"
							>
								{item.name}
							</a>
							
							<a href={`/user/reviews/businesses/${item.shopId}`} class="mb-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white line-clamp-1">
								{item.shop}
							</a>
							
							<div class="mt-auto flex items-end justify-between">
								<div>
									{#if item.price}
										<p class="text-lg font-black text-gray-900 dark:text-white">₹{item.price}</p>
									{:else}
										<p class="text-sm font-black text-green-500">Free / Custom</p>
									{/if}
								</div>
								
								<span class={`text-[10px] font-black tracking-wider uppercase ${item.inStock ? 'text-green-500' : 'text-red-500'}`}>
									{item.inStock ? 'Available' : 'Unavailable'}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
				<div class="mb-4 text-6xl opacity-50">💔</div>
				<h2 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
				<p class="mb-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
					You haven't saved any offers, products, or services yet.
				</p>
				<a href="/user/search" class="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-gray-900">
					Explore NearBuy
				</a>
			</div>
		{/if}
	</div>
</div>
