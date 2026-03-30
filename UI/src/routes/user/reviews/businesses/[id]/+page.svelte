<script>
	import { page } from '$app/stores';
	const busId = $page.params.id;

	// Mock data for the business
	const business = {
		id: busId,
		name: 'Krishna Electronics',
		type: 'Electronics & Accessories',
		rating: 4.8,
		reviewCount: 156
	};

	// Mock data for business reviews
	const reviews = [
		{
			id: 1,
			user: 'Ramesh K.',
			rating: 5,
			date: '1 week ago',
			comment: 'Best electronics shop in the area. The staff is very helpful and they gave me a good discount on my new phone accessories.',
			image: null
		},
		{
			id: 2,
			user: 'Swathi R.',
			rating: 4,
			date: '1 month ago',
			comment: 'Wide selection of products. Prices are reasonable. Minus one star because parking nearby is a bit difficult during peak hours.',
			image: null
		},
		{
			id: 3,
			user: 'Vijay M.',
			rating: 5,
			date: '2 months ago',
			comment: 'Great customer service! I had an issue with a charger I bought and they replaced it immediately without any hassle.',
			image: null
		},
		{
			id: 4,
			user: 'Sneha L.',
			rating: 5,
			date: '3 months ago',
			comment: 'Very reliable seller on NearBuy. Got exactly what I ordered within the same day.',
			image: null
		}
	];
</script>

<svelte:head>
	<title>Reviews for {business.name} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="flex-1 font-bold text-center">Business Reviews</h1>
		<div class="w-12"></div> <!-- spacer to center title -->
	</header>

	<div class="mx-auto max-w-xl space-y-6 px-4 py-6">
		<!-- Summary -->
		<div class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="flex flex-col items-center justify-center space-y-1 pr-4 border-r border-gray-200 dark:border-gray-800">
				<span class="text-3xl font-black text-gray-900 dark:text-white">{business.rating}</span>
				<div class="text-blue-500 text-sm">★★★★★</div>
				<span class="text-xs text-gray-500 dark:text-gray-400">{business.reviewCount} Ratings</span>
			</div>
			<div class="flex-1 pl-2">
				<h2 class="text-lg font-bold">{business.name}</h2>
				<p class="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">{business.type}</p>
			</div>
		</div>

		<!-- Reviews List -->
		<div class="space-y-4">
			{#each reviews as review}
				<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-2">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold">
								{review.user.charAt(0)}
							</div>
							<div>
								<p class="font-bold text-sm">{review.user}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{review.date}</p>
							</div>
						</div>
						<div class="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-bold shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
							<span class="text-blue-500">★</span> {review.rating}
						</div>
					</div>
					
					<p class="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
					
					{#if review.image}
						<div class="flex mt-3 gap-2">
							<img src={review.image} alt="Review attachment" class="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
