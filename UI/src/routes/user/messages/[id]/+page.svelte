<script>
	import { page } from '$app/stores';
	const id = $page.params.id;

	// Mock provider details based on Chat ID
	const providers = {
		1: { name: 'Krishna Electronics', image: 'K', isOnline: true },
		2: { name: 'Raj Mobiles', image: 'R', isOnline: false },
		3: { name: 'Sri Home Services', image: 'S', isOnline: true },
		4: { name: 'Meera Textiles', image: 'M', isOnline: false }
	};
	
	const provider = providers[id] || { name: 'Unknown Provider', image: '?', isOnline: false };

	let messages = $state([
		{ id: 1, text: 'Hi, I saw your product. Is it available?', sender: 'user', time: '10:30 AM' },
		{ id: 2, text: `Hello! Yes, we have stock.`, sender: 'provider', time: '10:35 AM' },
		{ id: 3, text: 'Great, can I pick it up today?', sender: 'user', time: '10:38 AM' },
		{ id: 4, text: 'Yes, it is ready for pickup!', sender: 'provider', time: '10:42 AM' }
	]);

	let newMessage = $state('');
	let messagesContainerEl = $state(null);
	let showReportModal = $state(false);

	$effect(() => {
		// Scroll to bottom when component mounts
		if (messagesContainerEl) {
			messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
		}
	});

	function sendMessage() {
		if (newMessage.trim() === '') return;
		
		messages = [...messages, {
			id: Date.now(),
			text: newMessage.trim(),
			sender: 'user',
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		}];
		
		newMessage = '';

		// Scroll to bottom after state updates
		setTimeout(() => {
			if (messagesContainerEl) {
				messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
			}
		}, 10);
	}
</script>

<svelte:head>
	<title>Chat with {provider.name} — NearBuy</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
	<!-- Header -->
	<header class="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 shadow-sm">
		<div class="flex items-center gap-3">
			<a href="/user/messages" class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
				←
			</a>
			<div class="flex items-center gap-3">
				<div class="relative shrink-0">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-100 to-orange-200 text-sm font-black text-orange-600 shadow-sm dark:from-orange-500/20 dark:to-orange-500/40 dark:text-orange-400">
						{provider.image}
					</div>
					{#if provider.isOnline}
						<span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
					{/if}
				</div>
				<div class="flex flex-col">
					<h1 class="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{provider.name}</h1>
					<span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{provider.isOnline ? 'Online' : 'Offline'}</span>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-1">
			<button 
				onclick={() => {
					// Report functionality
					showReportModal = true;
				}}
				class="flex h-10 px-3 items-center justify-center text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
				title="Report Abuse"
			>
				Report
			</button>
			<button class="flex h-10 w-10 items-center justify-center text-xl text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-900 rounded-full">
				📞
			</button>
		</div>
	</header>

	<!-- Report Modal (Sheet) -->
	{#if showReportModal}
		<!-- Backdrop -->
		<button 
			type="button" 
			class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm transition-opacity" 
			onclick={() => (showReportModal = false)}
			aria-label="Close report modal"
		></button>
		
		<!-- Sheet -->
		<div class="fixed inset-x-0 bottom-0 z-70 mx-auto max-w-xl rounded-t-[32px] bg-white p-6 shadow-2xl transition-transform dark:bg-gray-900 animate-slide-up">
			<div class="mb-6 flex justify-center">
				<div class="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-800"></div>
			</div>
			
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-xl font-black text-gray-900 dark:text-white">Report {provider.name}</h2>
				<button 
					onclick={() => (showReportModal = false)}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500"
				>✕</button>
			</div>
			
			<p class="mb-6 text-sm font-medium text-gray-500 dark:text-gray-400">
				This report will be sent to the **Super Admin** for review. Please provide details about the abuse.
			</p>
			
			<div class="space-y-4">
				<div>
					<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="report-type">Reason</label>
					<select 
						id="report-type" 
						class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 focus:border-orange-500 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
					>
						<option value="spam">Spam / Persistent messaging</option>
						<option value="abuse">Abusive language</option>
						<option value="fake">Fake identity / Scammer</option>
						<option value="price">Unfair pricing / Requesting advance</option>
						<option value="other">Other</option>
					</select>
				</div>
				
				<div>
					<label class="mb-1.5 block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400" for="report-desc">Description</label>
					<textarea 
						id="report-desc" 
						rows="4" 
						placeholder="Please Describe the issue..." 
						class="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-orange-500 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
					></textarea>
				</div>
				
				<div class="rounded-xl bg-red-50 dark:bg-red-500/5 p-4 text-[11px] font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/10">
					⚠️ False reporting might result in your account suspension. Only report if you truly feel this is an abuse.
				</div>
				
				<button 
					class="w-full rounded-2xl bg-red-600 py-4 font-black text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
					onclick={() => {
						alert('Report sent to Super Admin successfully.');
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
		<div class="text-center mb-6">
			<span class="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400 shadow-sm">
				Today
			</span>
		</div>
		
		{#each messages as message (message.id)}
			<div class={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
				<div class={`flex max-w-[80%] flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
					<div 
						class={`rounded-2xl px-4 py-2 text-[15px] shadow-sm leading-relaxed ${
							message.sender === 'user' 
								? 'bg-orange-500 text-white rounded-br-sm' 
								: 'bg-white text-gray-900 border border-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-800 rounded-bl-sm'
						}`}
					>
						{message.text}
					</div>
					<span class="mt-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 px-1 uppercase tracking-wider">
						{message.time} {message.sender === 'user' ? '• Read' : ''}
					</span>
				</div>
			</div>
		{/each}
	</main>

	<!-- Message Input -->
	<footer class="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 pb-safe">
		<form 
			onsubmit={(e) => { e.preventDefault(); sendMessage(); }} 
			class="flex items-end gap-2 mx-auto max-w-2xl"
		>
			<button type="button" class="flex h-12 w-12 shrink-0 items-center justify-center text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
				📎
			</button>
			<textarea 
				bind:value={newMessage}
				placeholder="Type a message..." 
				class="hide-scrollbar max-h-32 min-h-[48px] w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 py-3 px-5 text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
				onkeydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						sendMessage();
					}
				}}
			></textarea>
			<button 
				type="submit" 
				disabled={newMessage.trim() === ''}
				class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl transition-all ${
					newMessage.trim() === '' 
					? 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-500' 
					: 'bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600 hover:-translate-y-0.5'
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
	/* Hide scrollbar for textarea */
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.pb-safe {
		padding-bottom: max(1rem, env(safe-area-inset-bottom));
	}
</style>
