<script>
	import { page } from '$app/stores';
	const reqId = $page.params.id;

	const quotes = [
		{
			id: 1,
			requirement: 'Looking for iPhone 15 Pro Max',
			provider: 'Krishna Electronics',
			providerName: 'Ravi Kumar',
			price: 89999,
			note: 'Sealed box with 1 year warranty. Free screen protector. Can deliver within 2 hours.',
			availability: 'In stock, available now',
			rating: 4.8,
			jobs: 128,
			time: '30 min ago',
			status: 'pending'
		},
		{
			id: 2,
			requirement: 'Looking for iPhone 15 Pro Max',
			provider: 'Raj Mobiles',
			providerName: 'Raj Arjun',
			price: 87500,
			note: 'Genuine Apple product. Limited stock. Can negotiate slightly.',
			availability: '2 units in stock',
			rating: 4.7,
			jobs: 84,
			time: '1h ago',
			status: 'pending'
		}
	];

	let accepted = $state(null);

	function acceptQuote(id) {
		accepted = id;
	}
</script>

<svelte:head>
	<title>Quotes for REQ-{reqId} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white pb-28">
	<header class="flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10">
		<a href="/user/quotes" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="font-bold">Quotes & Interest</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-6">
		<p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
			Requirement ID: <span class="font-bold text-gray-900 dark:text-white">REQ-{reqId}</span>
		</p>

		{#if accepted === null}
			<div class="space-y-4">
				{#each quotes as quote}
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-orange-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500/50">
						<!-- Provider Header -->
						<div class="flex items-center gap-4 border-b border-gray-100 p-4 dark:border-gray-800">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 font-bold text-white shadow-sm">
								{quote.providerName[0]}
							</div>
							<div class="flex-1">
								<h3 class="font-bold">{quote.provider}</h3>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">{quote.providerName}</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-yellow-500">⭐ {quote.rating}</p>
								<p class="text-xs font-semibold text-gray-400">{quote.jobs} jobs</p>
							</div>
						</div>

						<!-- Quote Details -->
						<div class="p-5">
							<div class="mb-3 flex items-start justify-between">
								<div>
									<p class="text-3xl font-black text-orange-600 dark:text-orange-400">₹{quote.price.toLocaleString()}</p>
									<p class="mt-0.5 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
										<span class="w-2 h-2 rounded-full bg-green-500"></span>
										{quote.availability}
									</p>
								</div>
								<span class="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{quote.time}</span>
							</div>
							<p class="mb-5 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">{quote.note}</p>
							
							<button
								id={`accept-quote-${quote.id}`}
								onclick={() => acceptQuote(quote.id)}
								class="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 font-bold text-white shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] transition-all hover:bg-orange-400 hover:-translate-y-0.5 active:translate-y-0"
							>✅ Accept This Quote</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{@const acceptedQuote = quotes.find(q => q.id === accepted)}
			<div class="py-10 text-center bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-800 p-6 shadow-sm">
				<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-500/20 shadow-inner">🎉</div>
				<h2 class="mb-2 text-2xl font-black text-green-600 dark:text-green-500">Quote Accepted!</h2>
				<p class="mb-6 font-medium text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
					Contact info has been immediately shared. Coordinate with the provider to complete your order.
				</p>

				<!-- Provider Contact Card -->
				<div class="mb-6 text-left bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
					<div class="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-xl">👤</div>
						<div>
							<div class="flex items-center gap-2">
								<h3 class="font-bold text-gray-900 dark:text-white">{acceptedQuote?.providerName}</h3>
								<span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">Quoted Employee</span>
							</div>
							<div class="flex items-center gap-2 mt-0.5">
								<p class="text-sm font-medium text-orange-600 dark:text-orange-400">{acceptedQuote?.provider}</p>
								<span class="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md">Business</span>
							</div>
						</div>
					</div>
					
					<div class="space-y-3 mb-5">
						<div class="flex items-center justify-between pl-1 pr-2">
							<div class="flex items-center gap-3">
								<span class="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">📞</span>
								<p class="font-bold text-gray-700 dark:text-gray-300">+91 98765 43210</p>
							</div>
							<span class="text-[10px] font-semibold text-gray-400 max-[350px]:hidden">Business</span>
						</div>
						<div class="flex items-center justify-between pl-1 pr-2">
							<div class="flex items-center gap-3">
								<span class="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">✉️</span>
								<p class="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[180px]">contact@{acceptedQuote?.provider.toLowerCase().replace(/\s+/g, '')}.com</p>
							</div>
							<span class="text-[10px] font-semibold text-gray-400 max-[350px]:hidden">Business</span>
						</div>
					</div>

					<a href={`/user/business/${acceptedQuote?.id}`} class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
						🏬 View Business Profile
					</a>
				</div>

				<div class="flex gap-3">
					<a
						href={`/user/messages/${accepted}`}
						class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-orange-400 hover:-translate-y-0.5"
					>💬 Message</a>
					<a
						href="/user/order-status"
						class="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:border-gray-600"
					>📦 Order Status</a>
				</div>
			</div>
		{/if}
	</div>
</div>
