<script>
	import { getCurrentBusinessId } from '$lib/stores/auth.svelte.js';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let search = $state('');
	let filterStatus = $state('all');
	let rawOrders = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const bizId = getCurrentBusinessId();
			const res = await fetch(`${API_BASE_URL}/api/orders?business_id=${bizId}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawOrders = data.orders || [];
			}
		} catch (err) {
			console.error('Failed to fetch orders:', err);
		} finally {
			loading = false;
		}
	});

	const orders = $derived(
		rawOrders.map(o => {
			const d = new Date(o.createdAt || o.created_at);
			return {
				id: o.id || 'N/A',
				client: o.user_name || o.user?.name || 'Customer',
				items: (o.items || []).map(i => `${i.name}${i.qty > 1 ? ` (×${i.qty})` : ''}`),
				amount: `₹${(o.total || 0).toLocaleString('en-IN')}`,
				status: o.status || 'unknown',
				date: d.toISOString().slice(0, 10),
				time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
				payment: o.payment_method || o.paymentMethod || 'COD'
			};
		})
	);

	const filteredOrders = $derived(
		orders.filter(order => {
			const matchesSearch = order.client.toLowerCase().includes(search.toLowerCase()) || 
								 order.id.toLowerCase().includes(search.toLowerCase());
			const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
			return matchesSearch && matchesStatus;
		})
	);

	function getStatusColor(status) {
		switch (status?.toLowerCase()) {
			case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
			case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
			case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
			case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
			case 'processing': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
			case 'shipped': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400';
			default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>Order History — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Home</a>
			<h1 class="font-bold text-gray-900 dark:text-white text-xl">Order History</h1>
		</div>
	</div>

	<div class="mx-auto max-w-2xl px-6">
		<!-- Search and Filter -->
		<div class="mb-8 space-y-4">
			<div class="relative group">
				<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500">🔍</span>
				<input 
					type="text" 
					bind:value={search}
					placeholder="Search Client or Order ID..."
					class="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-6 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/5 dark:border-gray-800 dark:bg-gray-900 shadow-sm"
				/>
			</div>
			
			<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
				{#each ['all', 'delivered', 'cancelled', 'pending'] as status}
					<button 
						onclick={() => filterStatus = status}
						class={`whitespace-nowrap rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 active:scale-95' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500 dark:bg-gray-900 dark:border-gray-800'}`}
					>
						{status}
					</button>
				{/each}
			</div>
		</div>

		<!-- Orders List -->
		<div class="space-y-4">
			{#each filteredOrders as order}
				<div class="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-orange-500/50 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
					<div class="mb-4 flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="text-[10px] font-black uppercase tracking-tighter text-gray-400">#{order.id}</span>
								<span class={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
									{order.status}
								</span>
							</div>
							<h3 class="text-lg font-black text-gray-900 dark:text-white">{order.client}</h3>
						</div>
						<div class="text-right">
							<p class="text-xl font-black text-orange-600 dark:text-orange-400">{order.amount}</p>
							<p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.payment}</p>
						</div>
					</div>

					<div class="space-y-2 mb-4">
						{#each order.items as item}
							<div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
								<span class="text-xs">📦</span>
								{item}
							</div>
						{/each}
					</div>

					<div class="flex items-center justify-between border-t border-gray-50 dark:border-gray-800/50 pt-4">
						<div class="flex items-center gap-4">
							<div class="flex flex-col">
								<span class="text-[9px] font-black text-gray-400 uppercase">Date</span>
								<span class="text-xs font-bold">{order.date}</span>
							</div>
							<div class="flex flex-col">
								<span class="text-[9px] font-black text-gray-400 uppercase">Time</span>
								<span class="text-xs font-bold">{order.time}</span>
							</div>
						</div>
						<a 
							href="/provider/orders/{order.id}"
							class="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
						>
							View Details
						</a>
					</div>
				</div>
			{/each}

			{#if filteredOrders.length === 0}
				<div class="py-20 text-center animate-in fade-in zoom-in duration-500">
					<div class="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl dark:bg-gray-800">
						🏜️
					</div>
					<h3 class="text-lg font-bold text-gray-900 dark:text-white">No orders found</h3>
					<p class="text-sm text-gray-500">Try adjusting your search or filters</p>
				</div>
			{/if}
		</div>
	</div>
</div>
