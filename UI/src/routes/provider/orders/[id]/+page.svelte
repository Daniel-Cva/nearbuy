<script>
	import { page } from '$app/stores';
	const orderId = $page.params.id;

	// Mock data for the specific order
	const orders = [
		{
			id: 'ORD-9821',
			client: 'Priya Mani',
			phone: '+91 98765 43210',
			items: [
				{ name: 'iPhone 15 Case (Pro Max)', price: 750, qty: 1, image: 'https://images.unsplash.com/photo-1621149437156-a2c19db2da39?auto=format&fit=crop&w=400&q=80' },
				{ name: 'Tempered Glass', price: 499, qty: 1, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80' }
			],
			tax: 0,
			status: 'delivered',
			date: '2026-03-08',
			time: '04:30 PM',
			payment: 'UPI',
			address: 'Flat 402, Green Meadows, Tech City'
		},
		{
			id: 'ORD-9815',
			client: 'Rahul Sharma',
			phone: '+91 91234 56789',
			items: [
				{ name: 'USB-C Cable 2m', price: 299, qty: 1, image: 'https://images.unsplash.com/photo-1598502578505-1a052ff135ef?auto=format&fit=crop&w=400&q=80' }
			],
			tax: 0,
			status: 'delivered',
			date: '2026-03-08',
			time: '11:15 AM',
			payment: 'Cash',
			address: '123 Market Street, City Center'
		}
	];

	const order = orders.find(o => o.id === orderId) || {
		id: orderId,
		client: 'Unknown Client',
		items: [],
		amount: '₹0',
		status: 'unknown',
		date: '-',
		payment: '-'
	};

	const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.qty), 0) || 0;
	const total = subtotal + (order.tax || 0);

	function getStatusColor(status) {
		switch (status) {
			case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
			case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
			default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>Order {orderId} — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex items-center gap-4 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2">
		<a href="/provider/orders" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="font-bold text-gray-900 dark:text-white">Order Details</h1>
	</div>

	<div class="mx-auto max-w-2xl px-6 space-y-6">
		<!-- Header Card -->
		<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="flex items-start justify-between mb-6">
				<div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs font-black uppercase tracking-tighter text-gray-400 font-mono">#{order.id}</span>
						<span class={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
							{order.status}
						</span>
					</div>
					<h2 class="text-2xl font-black text-gray-900 dark:text-white">{order.client}</h2>
					<p class="text-sm font-medium text-gray-500 mt-1">{order.phone}</p>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-2xl">
					📦
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4 border-t border-gray-50 dark:border-gray-800/50 pt-6">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Order Date</p>
					<p class="text-sm font-bold text-gray-900 dark:text-white">{order.date} · {order.time}</p>
				</div>
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment Method</p>
					<p class="text-sm font-bold text-gray-900 dark:text-white">{order.payment}</p>
				</div>
			</div>
		</div>

		<!-- Items Card -->
		<div class="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-b border-gray-100 dark:border-gray-800">
				<h3 class="text-[10px] font-black uppercase tracking-widest text-gray-500">Order Items</h3>
			</div>
			<div class="divide-y divide-gray-50 dark:divide-gray-800/50">
				{#each order.items as item}
					<div class="p-6 flex items-center gap-4">
						<div class="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
							<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
						</div>
						<div class="flex-1">
							<h4 class="font-bold text-gray-900 dark:text-white leading-tight">{item.name}</h4>
							<p class="text-xs text-gray-500 mt-1">Qty: {item.qty} · ₹{item.price} each</p>
						</div>
						<p class="font-black text-gray-900 dark:text-white">₹{item.price * item.qty}</p>
					</div>
				{/each}
			</div>
			<div class="bg-gray-50 dark:bg-gray-800/50 p-6 space-y-3">
				<div class="flex justify-between text-sm">
					<span class="text-gray-500 font-medium">Subtotal</span>
					<span class="font-bold text-gray-900 dark:text-white">₹{subtotal}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-gray-500 font-medium">Tax / GST (0%)</span>
					<span class="font-bold text-gray-900 dark:text-white">₹0</span>
				</div>
				<div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
					<span class="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Total Amount</span>
					<span class="text-xl font-black text-orange-600 dark:text-orange-400">₹{total}</span>
				</div>
			</div>
		</div>

		<!-- Delivery Card -->
		<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Delivery Details</h3>
			<div class="flex items-start gap-3">
				<span class="text-xl">📍</span>
				<div>
					<p class="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{order.address}</p>
					<p class="text-xs text-gray-500 mt-1">Delivery completed by Bike Express</p>
				</div>
			</div>
		</div>

		{#if order.status === 'delivered'}
			<div class="flex gap-4">
				<button disabled class="flex-1 rounded-2xl bg-gray-100 py-4 text-sm font-bold text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 border border-gray-200 dark:border-gray-700">
					Re-order Items (Disabled for Business) 🚫
				</button>
			</div>
		{/if}
	</div>
</div>
