<script>
	import { page } from '$app/stores';
	const id = $page.params.id;

	// Mock data for customer based on Chat ID
	const customers = {
		1: { name: 'Priya M', image: 'P', isOnline: true },
		2: { name: 'Arun K', image: 'A', isOnline: false },
		3: { name: 'Santhosh', image: 'S', isOnline: true }
	};
	
	const customer = customers[id] || { name: 'Unknown Customer', image: '?', isOnline: false };

	let messages = $state([
		{ id: 1, text: 'Hi, I saw your product. Is it available?', sender: 'customer', time: '10:30 AM' },
		{ id: 2, text: `Hello! Yes, we have stock.`, sender: 'provider', time: '10:35 AM' },
		{ id: 3, text: 'Great, can I pick it up today?', sender: 'customer', time: '10:38 AM' },
		{ id: 4, text: 'Yes, it is ready for pickup!', sender: 'provider', time: '10:42 AM' }
	]);

	let newMessage = $state('');
	let messagesContainerEl = $state(null);
	let showReportModal = $state(false);

	$effect(() => {
		if (messagesContainerEl) {
			messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
		}
	});

	function sendMessage() {
		if (newMessage.trim() === '') return;
		
		messages = [...messages, {
			id: Date.now(),
			text: newMessage.trim(),
			sender: 'provider',
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		}];
		
		newMessage = '';

		setTimeout(() => {
			if (messagesContainerEl) {
				messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
			}
		}, 10);
	}
</script>

<svelte:head>
	<title>Chat with {customer.name} — Business Portal</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
	<!-- Header -->
	<header class="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 shadow-sm">
		<div class="flex items-center gap-3">
			<a href="/provider/messages" class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
				←
			</a>
			<div class="flex items-center gap-3">
				<div class="relative shrink-0">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200 text-sm font-black text-gray-600 shadow-sm dark:from-gray-800 dark:to-gray-700 dark:text-gray-400">
						{customer.image}
					</div>
					{#if customer.isOnline}
						<span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
					{/if}
				</div>
				<div class="flex flex-col">
					<h1 class="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{customer.name}</h1>
					<span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{customer.isOnline ? 'Online' : 'Offline'}</span>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-1">
			<button 
				onclick={() => { showReportModal = true; }}
				class="flex h-10 px-3 items-center justify-center text-xs font-black uppercase tracking-wider text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
				title="Report Customer"
			>
				Report
			</button>
			<button 
				class="flex h-10 w-10 items-center justify-center text-xl text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-900 rounded-full"
				title="Call Customer"
			>
				📞
			</button>
		</div>
	</header>

	<!-- Report Modal (Sheet) -->
	{#if showReportModal}
		<button 
			type="button" 
			class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm transition-opacity" 
			onclick={() => (showReportModal = false)}
			aria-label="Close report modal"
		></button>
		<div class="fixed inset-x-0 bottom-0 z-70 mx-auto max-w-xl rounded-t-[32px] bg-white p-6 shadow-2xl transition-transform dark:bg-gray-900">
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-xl font-black text-gray-900 dark:text-white">Report {customer.name}</h2>
				<button onclick={() => (showReportModal = false)} class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">✕</button>
			</div>
			
			<p class="mb-6 text-sm font-medium text-gray-500 dark:text-gray-400">
				Notify **Super Admin** about suspicious or abusive behavior from this customer. 
			</p>
			
			<div class="space-y-4">
				<div>
					<label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400" for="p-report-type">Reason</label>
					<select id="p-report-type" class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 dark:border-gray-800 dark:bg-gray-800 dark:text-white">
						<option value="spam">Spamming / Multiple requirements</option>
						<option value="fake">Fake requirement / No intent</option>
						<option value="abuse">Abusive language</option>
						<option value="other">Other</option>
					</select>
				</div>
				
				<textarea rows="4" placeholder="Detail any specific messages or behavior..." class="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:ring-red-500 focus:border-red-500"></textarea>
				
				<button 
					class="w-full rounded-2xl bg-red-600 py-4 font-black text-white shadow-lg shadow-red-600/20 active:scale-95 transition-all"
					onclick={() => {
						alert('Report successfully sent to Super Admin for verification.');
						showReportModal = false;
					}}
				>
					Send Report to Super Admin
				</button>
			</div>
		</div>
	{/if}

	<!-- Chat Area -->
	<main class="flex-1 overflow-y-auto px-4 py-6 space-y-4" bind:this={messagesContainerEl}>
		{#each messages as message (message.id)}
			<div class={`flex w-full ${message.sender === 'provider' ? 'justify-end' : 'justify-start'}`}>
				<div class={`flex max-w-[80%] flex-col ${message.sender === 'provider' ? 'items-end' : 'items-start'}`}>
					<div 
						class={`rounded-2xl px-4 py-2.5 text-[15px] shadow-sm leading-relaxed ${
							message.sender === 'provider' 
								? 'bg-orange-500 text-white rounded-br-xs' 
								: 'bg-white text-gray-900 border border-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-800 rounded-bl-xs'
						}`}
					>
						{message.text}
					</div>
					<span class="mt-1.5 text-[10px] font-black tracking-widest text-gray-400 px-1 uppercase">
						{message.time} {message.sender === 'provider' ? '• Sent' : ''}
					</span>
				</div>
			</div>
		{/each}
	</main>

	<!-- Footer -->
	<footer class="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 pb-safe">
		<form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex items-end gap-2 mx-auto max-w-2xl">
			<button type="button" class="flex h-12 w-12 shrink-0 items-center justify-center text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors">📎</button>
			<textarea 
				bind:value={newMessage}
				placeholder="Type a message to customer..." 
				class="hide-scrollbar max-h-32 min-h-[48px] w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 py-3 px-5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900"
				onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
			></textarea>
			<button 
				type="submit" 
				disabled={newMessage.trim() === ''}
				class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${
					newMessage.trim() === '' 
					? 'bg-gray-100 text-gray-400 dark:bg-gray-900' 
					: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-90'
				}`}
			>
				{#if newMessage.trim() === ''}
					<span class="text-xl">🎤</span>
				{:else}
					<span class="text-lg">➤</span>
				{/if}
			</button>
		</form>
	</footer>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar { display: none; }
	.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
