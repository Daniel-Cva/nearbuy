<script>
	// Mock list of active chats
	let chats = $state([
		{
			id: 1,
			providerName: 'Krishna Electronics',
			providerImage: 'K',
			lastMessage: 'Your iPhone 15 case is ready for pickup!',
			timestamp: '10:42 AM',
			unreadCount: 2,
			isOnline: true
		},
		{
			id: 2,
			providerName: 'Raj Mobiles',
			providerImage: 'R',
			lastMessage: 'Yes, we can repair the broken screen by tomorrow.',
			timestamp: 'Yesterday',
			unreadCount: 0,
			isOnline: false
		},
		{
			id: 3,
			providerName: 'Sri Home Services',
			providerImage: 'S',
			lastMessage: 'The plumber will arrive at 4 PM.',
			timestamp: 'Mon',
			unreadCount: 1,
			isOnline: true
		},
		{
			id: 4,
			providerName: 'Meera Textiles',
			providerImage: 'M',
			lastMessage: 'Thanks for ordering the Cotton Saree.',
			timestamp: 'Oct 15',
			unreadCount: 0,
			isOnline: false
		}
	]);
</script>

<svelte:head>
	<title>Messages — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100 pb-28">
	<header class="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/user/home" class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
			←
		</a>
		<h1 class="font-black text-xl flex-1">Messages</h1>
		<div class="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500 font-bold">
			{chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
		</div>
	</header>

	<div class="mx-auto max-w-2xl">
		<!-- Search and Filter -->
		<div class="p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
			<div class="flex gap-2">
				<div class="relative flex-1">
					<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
					<input 
						type="text" 
						placeholder="Search messages..." 
						class="w-full rounded-2xl border-none bg-gray-100 py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
					/>
				</div>
			</div>
		</div>

		<!-- Chat List -->
		<div class="divide-y divide-gray-100 dark:divide-gray-800/50 bg-white dark:bg-gray-900 min-h-[60vh]">
			{#if chats.length === 0}
				<div class="flex flex-col items-center justify-center py-20 px-4 text-center">
					<span class="text-6xl mb-4 opacity-40">💬</span>
					<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">No messages yet</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">When you message a provider or request a quote, your chats will appear here.</p>
				</div>
			{/if}

			{#each chats as chat (chat.id)}
				<a 
					href={`/user/messages/${chat.id}`} 
					class="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 group"
				>
					<div class="relative shrink-0">
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 text-xl font-black text-orange-600 shadow-sm dark:from-orange-500/20 dark:to-orange-500/40 dark:text-orange-400">
							{chat.providerImage}
						</div>
						{#if chat.isOnline}
							<span class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
						{/if}
					</div>

					<div class="flex flex-1 flex-col overflow-hidden">
						<div class="flex items-center justify-between mb-1">
							<h3 class="truncate text-base font-bold text-gray-900 dark:text-white leading-none">
								{chat.providerName}
							</h3>
							<span class={`whitespace-nowrap text-xs font-semibold ${chat.unreadCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
								{chat.timestamp}
							</span>
						</div>
						
						<div class="flex items-center justify-between gap-3">
							<p class={`truncate text-sm ${chat.unreadCount > 0 ? 'text-gray-900 font-semibold dark:text-gray-200' : 'text-gray-500 font-medium dark:text-gray-400'}`}>
								{chat.lastMessage}
							</p>
							{#if chat.unreadCount > 0}
								<span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white shadow-sm shrink-0">
									{chat.unreadCount}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
