<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { toDisplayUrl } from '$lib/helpers/upload.js';

	let threads = $state([]);
	let loading = $state(true);
	let error = $state(null);

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				threads = data.conversations || [];
			} else {
				error = "Failed to load chats";
			}
		} catch (err) {
			console.error('Failed to fetch threads:', err);
			error = "Connection error";
		} finally {
			loading = false;
		}
	});

	function getDisplayName(t) {
		return t.display_name || 'Business';
	}

	function getDisplayAvatar(t) {
		return t.display_name ? t.display_name[0] : '?';
	}
</script>

<svelte:head>
	<title>Messages — Nearbuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100 pb-20">
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 md:px-6">
		<div class="mx-auto flex max-w-2xl items-center justify-between">
			<h1 class="text-2xl font-black text-gray-900 dark:text-white">Messages</h1>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20">
				{threads.length}
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-2xl px-0 md:px-6 md:py-6">
		{#if loading}
			<div class="flex flex-col items-center justify-center py-20 animate-pulse">
				<div class="h-16 w-16 rounded-3xl bg-gray-200 dark:bg-gray-800 mb-4"></div>
				<div class="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full mb-2"></div>
				<div class="h-3 w-48 bg-gray-100 dark:bg-gray-900 rounded-full"></div>
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center py-20 text-center px-4">
				<span class="text-4xl mb-4">⚠️</span>
				<h3 class="text-lg font-bold text-red-500">{error}</h3>
				<button 
					onclick={() => window.location.reload()}
					class="mt-4 rounded-xl bg-gray-200 px-6 py-2 text-sm font-bold dark:bg-gray-800"
				>
					Try Again
				</button>
			</div>
		{:else if threads.length === 0}
			<div class="flex flex-col items-center justify-center py-32 px-4 text-center">
				<div class="h-24 w-24 rounded-[32px] bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-5xl mb-6 shadow-sm">
					💬
				</div>
				<h3 class="text-xl font-bold mb-2">No messages yet</h3>
				<p class="text-sm text-gray-500 max-w-[280px]">Contact businesses about their products or services to start a conversation.</p>
				<a href="/user/home" class="mt-8 rounded-2xl bg-orange-500 px-8 py-3.5 font-black text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
					Explore Products
				</a>
			</div>
		{:else}
			<div class="divide-y divide-gray-100 dark:divide-gray-800 md:rounded-3xl md:overflow-hidden md:border md:border-gray-200 md:bg-white md:dark:border-gray-800 md:dark:bg-gray-900 shadow-sm">
				{#each threads as thread (thread.id)}
					<a 
						href={`/user/messages/${thread.id}`} 
						class="flex items-center gap-4 px-4 py-5 transition-all hover:bg-orange-50/50 dark:hover:bg-orange-500/5 active:bg-gray-100 dark:active:bg-gray-800 group"
					>
						<div class="relative shrink-0">
							<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 text-xl font-black text-gray-600 shadow-sm dark:from-gray-800 dark:to-gray-700 dark:text-gray-400">
								{#if thread.display_avatar}
									<img src={toDisplayUrl(thread.display_avatar)} alt="" class="h-full w-full object-cover rounded-2xl" />
								{:else}
									{getDisplayAvatar(thread)}
								{/if}
							</div>
						</div>

						<div class="flex flex-1 flex-col overflow-hidden">
							<div class="flex items-center justify-between mb-1">
								<h3 class="truncate text-base font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
									{getDisplayName(thread)}
								</h3>
								<span class="whitespace-nowrap text-[10px] font-black uppercase tracking-wider text-gray-400">
									{thread.last_message_at ? new Date(thread.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'}
								</span>
							</div>
							
							<div class="flex items-center justify-between gap-3">
								<p class="truncate text-sm text-gray-500 font-medium dark:text-gray-400">
									{thread.type === 'service' ? 'Service Inquiry' : 'Product Chat'}
								</p>
							</div>
						</div>
						
						<div class="shrink-0 text-gray-300 dark:text-gray-700 transform translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100">
							→
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom aesthetics */
	:global(body) {
		-webkit-tap-highlight-color: transparent;
	}
</style>
