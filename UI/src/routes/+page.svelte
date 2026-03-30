<script>
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>NearBuy — Hyper-Local Commerce</title>
	<meta
		name="description"
		content="NearBuy connects you to nearby businesses. Shop local, post requirements, and discover services in your neighborhood."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-950 text-white">
	<!-- Hero -->
	<header class="flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
		<div
			class="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-400"
		>
			<span class="h-2 w-2 animate-pulse rounded-full bg-orange-400"></span>
			Hyper-Local · Reverse E-Commerce · Founder Networking
		</div>
		<h1 class="mb-4 text-5xl font-black tracking-tight md:text-7xl">
			<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
		</h1>
		<p class="mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
			Empowering local businesses to connect with nearby buyers. Post your needs, discover nearby
			products, and collaborate with founders — all in real time.
		</p>
		<div class="flex flex-wrap justify-center gap-4">
			<a
				href="/user/login"
				class="rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white transition-all hover:bg-orange-400"
			>
				I'm a Buyer
			</a>
			<a
				href="/provider/login"
				class="rounded-xl border border-gray-700 px-8 py-3 font-semibold text-white transition-all hover:border-orange-500"
			>
				I'm a Business
			</a>
		</div>
	</header>

	<!-- Features -->
	<section class="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-20 md:grid-cols-3">
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
			<div class="mb-3 text-3xl">📍</div>
			<h2 class="mb-2 text-lg font-bold">Hyper-Local Discovery</h2>
			<p class="text-sm text-gray-400">
				Find products and services from shops within your neighborhood — not from warehouses 500km
				away.
			</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
			<div class="mb-3 text-3xl">🔄</div>
			<h2 class="mb-2 text-lg font-bold">Reverse E-Commerce</h2>
			<p class="text-sm text-gray-400">
				You post what you need. Local businesses compete to serve you — no spam, pure control.
			</p>
		</div>
		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
			<div class="mb-3 text-3xl">🤝</div>
			<h2 class="mb-2 text-lg font-bold">Founder Collab</h2>
			<p class="text-sm text-gray-400">
				Business founders share live locations during commutes to network and collaborate in real
				time.
			</p>
		</div>
	</section>

	<!-- Footer links -->
	<footer class="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
		<div class="mb-2 flex flex-wrap justify-center gap-4">
			<a href="/user/login" class="transition-colors hover:text-orange-400">Login</a>
			<a href="/user/login" class="transition-colors hover:text-orange-400">User Login</a>
			<a href="/provider/login" class="transition-colors hover:text-blue-400">Business Login</a>
			<a href="/admin/login" class="transition-colors hover:text-red-400">Super Admin</a>
		</div>
		<p>© 2026 NearBuy. Revitalizing local commerce.</p>
	</footer>
</div>
