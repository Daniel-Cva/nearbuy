<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { timeAgo } from '$lib/helpers/id.js';

	let rawThreads = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/conversations`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawThreads = data.conversations || [];
			}
		} catch (err) {
			console.error('Failed to fetch threads:', err);
		} finally {
			loading = false;
		}
	});

	const chats = $derived(
		rawThreads.map(t => {
			return {
				id: t.id,
				userName: t.display_name || 'Customer',
				userImage: t.display_name?.[0] || '?',
				lastMessage: 'Active Conversation',
				timestamp: t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : 'Now',
				unreadCount: 0,
				isOnline: false
			};
		})
	);
</script>

<svelte:head>
	<title>Messages — Business Portal</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100 pb-28">
	<header class="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-6 md:pt-6 md:pb-2">
		<h1 class="font-black text-2xl flex-1 text-gray-900 dark:text-white">Customer Messages</h1>
		<div class="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20">
			{chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
		</div>
	</header>

	<div class="mx-auto max-w-2xl px-0 md:px-6">
		<div class="overflow-hidden rounded-3xl border border-transparent md:border-gray-200 md:bg-white md:shadow-sm md:dark:border-gray-800 md:dark:bg-gray-900">
			<!-- Search -->
			<div class="p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:bg-gray-50/50">
				<div class="relative flex-1">
					<span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">🔍</span>
					<input 
						type="text" 
						placeholder="Search customers..." 
						class="w-full rounded-2xl border-none bg-gray-100 py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
					/>
				</div>
			</div>

			<!-- Chat List -->
			<div class="divide-y divide-gray-100 dark:divide-gray-800/50 bg-white dark:bg-gray-900">
				{#each chats as chat (chat.id)}
					<a 
						href={`/provider/messages/${chat.id}`} 
						class="flex items-center gap-4 px-4 py-5 transition-all hover:bg-orange-50/50 dark:hover:bg-orange-500/5 active:bg-gray-100 dark:active:bg-gray-800 group"
					>
						<div class="relative shrink-0">
							<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 text-xl font-black text-gray-600 shadow-sm dark:from-gray-800 dark:to-gray-700 dark:text-gray-400">
								{chat.userImage}
							</div>
							{#if chat.isOnline}
								<span class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
							{/if}
						</div>

						<div class="flex flex-1 flex-col overflow-hidden">
							<div class="flex items-center justify-between mb-1">
								<h3 class="truncate text-base font-bold text-gray-900 dark:text-white">
									{chat.userName}
								</h3>
								<span class={`whitespace-nowrap text-[10px] font-black uppercase tracking-wider ${chat.unreadCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
									{chat.timestamp}
								</span>
							</div>
							
							<div class="flex items-center justify-between gap-3">
								<p class={`truncate text-sm ${chat.unreadCount > 0 ? 'text-gray-900 font-bold dark:text-gray-200' : 'text-gray-500 font-medium dark:text-gray-400'}`}>
									{chat.lastMessage}
								</p>
								{#if chat.unreadCount > 0}
									<span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white shadow-md shadow-orange-500/20 shrink-0">
										{chat.unreadCount}
									</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}

				{#if chats.length === 0}
					<div class="flex flex-col items-center justify-center py-32 px-4 text-center opacity-40">
						<span class="text-6xl mb-4">💬</span>
						<h3 class="text-lg font-bold">No customer chats</h3>
						<p class="text-sm max-w-[250px]">When users respond to your quotes or message your business, they'll appear here.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
