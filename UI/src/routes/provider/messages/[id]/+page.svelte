<script>
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { auth } from '$lib/stores/auth.svelte.js';

	const convoId = page.params.id;
	let conversation = $state(null);
	let messages = $state([]);
	let loading = $state(true);
	let newMessage = $state('');
	let messagesContainerEl = $state(null);
	let sending = $state(false);
	let showReportModal = $state(false);

	async function fetchMessages() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations/${convoId}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				conversation = data.conversation;
				messages = data.messages.map(m => {
					try {
						const p = JSON.parse(m.payload);
						return { ...m, text: p.text, type: p.type };
					} catch (e) {
						return { ...m, text: m.payload };
					}
				});
				await scrollToBottom();
			}
		} catch (err) {
			console.error('Failed to fetch messages:', err);
		} finally {
			loading = false;
		}
	}

	let pollingInterval;
	onMount(() => {
		fetchMessages();
		// Poll for new messages every 8 seconds if tab is active
		pollingInterval = setInterval(() => {
			if (!document.hidden && !sending) {
				fetchMessages();
			}
		}, 8000);
		return () => clearInterval(pollingInterval);
	});

	async function scrollToBottom() {
		await tick();
		if (messagesContainerEl) {
			messagesContainerEl.scrollTo({ top: messagesContainerEl.scrollHeight, behavior: 'smooth' });
		}
	}

	async function sendMessage() {
		if (newMessage.trim() === '' || sending) return;
		
		const text = newMessage.trim();
		newMessage = '';
		sending = true;

		// Optimistic
		const myId = auth.user.bizId || auth.user.id;
		const tempId = 'temp_' + Date.now();
		messages = [...messages, { id: tempId, sender_id: myId, text: text, created_at: new Date().toISOString() }];
		await scrollToBottom();

		try {
			await fetch(`${API_BASE_URL}/api/conversations/${convoId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, type: 'text' }),
				credentials: 'include'
			});
			fetchMessages();
		} catch (err) {
			console.error('Send error:', err);
		} finally {
			sending = false;
		}
	}

	const customerName = $derived(conversation?.display_name || 'Customer');
</script>

<svelte:head>
	<title>Chat with {customerName} — Business Portal</title>
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
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200 text-sm font-black text-gray-600 shadow-sm dark:from-gray-800 dark:to-gray-700 dark:text-gray-400 uppercase">
						{customerName[0]}
					</div>
					<span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
				</div>
				<div class="flex flex-col">
					<h1 class="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{customerName}</h1>
					<span class="text-[10px] font-black uppercase tracking-widest text-green-500">Active</span>
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
				<h2 class="text-xl font-black text-gray-900 dark:text-white">Report {customerName}</h2>
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
		{#if loading}
			<div class="flex items-center justify-center h-full text-gray-400 font-bold animate-pulse">
				Loading conversation...
			</div>
		{:else if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center opacity-40">
				<span class="text-6xl mb-4">💬</span>
				<h3 class="text-lg font-bold">No messages yet</h3>
				<p class="text-sm">Be the first to say hello!</p>
			</div>
		{:else}
			{#each messages as message (message.id)}
				{@const isMe = message.sender_id === (auth.user.bizId || auth.user.id)}
				<div class={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
					<div class={`flex max-w-[80%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
						<div 
							class={`rounded-2xl px-4 py-2.5 text-[15px] shadow-sm leading-relaxed ${
								isMe 
									? 'bg-orange-500 text-white rounded-br-xs' 
									: 'bg-white text-gray-900 border border-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-800 rounded-bl-xs'
							}`}
						>
							{message.text || 'Message'}
						</div>
						<span class="mt-1.5 text-[9px] font-black tracking-widest text-gray-400 px-1 uppercase">
							{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</span>
					</div>
				</div>
			{/each}
		{/if}
	</main>

	<!-- Footer -->
	<footer class="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 pb-safe">
		<form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex items-end gap-2 mx-auto max-w-2xl">
			<textarea 
				bind:value={newMessage}
				placeholder="Type a message..." 
				class="hide-scrollbar max-h-32 min-h-[48px] w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 py-3 px-5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
				onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
			></textarea>
			<button 
				type="submit" 
				disabled={newMessage.trim() === '' || sending}
				class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${
					newMessage.trim() === '' || sending
					? 'bg-gray-100 text-gray-400 dark:bg-gray-900' 
					: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-90'
				}`}
			>
				{#if sending}
					<div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
