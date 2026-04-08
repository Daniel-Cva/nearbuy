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

	async function fetchMessages() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations/${convoId}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				conversation = data.conversation;
				// Parse payload for each message
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
			messagesContainerEl.scrollTo({
				top: messagesContainerEl.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	async function sendMessage() {
		if (newMessage.trim() === '' || sending) return;
		
		const text = newMessage.trim();
		newMessage = '';
		sending = true;

		// Optimistic update
		const myId = auth.biz_id || auth.id;
		if (!myId) {
			alert("Session error: User identity not found. Please log in again.");
			return;
		}

		const tempId = 'temp_' + Date.now();
		messages = [...messages, {
			id: tempId,
			sender_id: myId,
			text: text,
			created_at: new Date().toISOString()
		}];
		await scrollToBottom();

		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations/${convoId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, type: 'text' }),
				credentials: 'include'
			});
			
			sending = false;

			if (res.ok) {
				await fetchMessages();
			} else {
				const errorData = await res.json().catch(() => ({}));
				messages = messages.filter(m => m.id !== tempId);
				alert(`Failed to send: ${errorData.message || res.statusText}`);
			}
		} catch (err) {
			sending = false;
			console.error('Send error:', err);
			messages = messages.filter(m => m.id !== tempId);
			alert("Connection error. Is the server running?");
		}
	}

	function formatTime(isoStr) {
		return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	const businessName = $derived(conversation?.display_name || 'Business');
</script>

<svelte:head>
	<title>Chat — Nearbuy</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
	<!-- Header -->
	<header class="sticky top-0 z-40 flex shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 shadow-sm">
		<a href="/user/messages" class="mr-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
			←
		</a>
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black text-white shadow-lg shadow-orange-500/20">
				{businessName[0]}
			</div>
			<div class="flex flex-col">
				<h1 class="text-base font-bold text-slate-900 dark:text-white leading-tight">{businessName}</h1>
				<span class="text-[10px] font-black uppercase tracking-widest text-green-500">Live Connection</span>
			</div>
		</div>
	</header>

	<!-- Chat Area -->
	<main class="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth" bind:this={messagesContainerEl}>
		{#if loading}
			<div class="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
				Connecting to thread...
			</div>
		{:else if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center px-8 opacity-40">
				<span class="text-5xl mb-4">👋</span>
				<p class="text-sm font-bold">Start the conversation!</p>
				<p class="text-xs">Your messages are private and secure.</p>
			</div>
		{:else}
			{#each messages as msg (msg.id)}
				{@const myId = auth.biz_id || auth.id}
				{@const isMe = msg.sender_id === myId}
				<div class={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
					<div class={`flex max-w-[80%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
						<div 
							class={`rounded-2xl px-4 py-2.5 text-[15px] shadow-xs leading-relaxed ${
								isMe 
									? 'bg-orange-500 text-white rounded-br-none' 
									: 'bg-white text-slate-900 border border-slate-100 dark:bg-slate-900 dark:text-white dark:border-slate-800 rounded-bl-none'
							}`}
						>
							{msg.text}
						</div>
						<span class="mt-1.5 text-[9px] font-black tracking-widest text-slate-400 px-1 uppercase">
							{formatTime(msg.created_at)}
						</span>
					</div>
				</div>
			{/each}
		{/if}
	</main>

	<!-- Input Area -->
	<footer class="shrink-0 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
		<form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex items-end gap-3 mx-auto max-w-2xl">
			<textarea 
				bind:value={newMessage}
				placeholder="Type your message..." 
				class="hide-scrollbar max-h-32 min-h-[48px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-3 px-5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all shadow-inner"
				onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
			></textarea>
			<button 
				type="submit" 
				disabled={newMessage.trim() === '' || sending}
				class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
					newMessage.trim() === '' || sending
					? 'bg-slate-100 text-slate-400 dark:bg-slate-900' 
					: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 active:scale-90 hover:rotate-6'
				}`}
			>
				{#if sending}
					<div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
				{:else}
					<span class="text-xl rotate-45 transform -translate-x-0.5 translate-y-0.5">🚀</span>
				{/if}
			</button>
		</form>
	</footer>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar { display: none; }
	.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
