<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { timeAgo } from '$lib/helpers/id.js';

	let rawNotifications = $state([]);
	let loading = $state(true);

	const iconMap = { order: '📦', requirement: '📋', review: '⭐', quote: '💰', collab: '🤝', info: '👥', warning: '📢', success: '✅' };

	async function fetchNotifications() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/notifications`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				rawNotifications = data.notifications || [];
			}
		} catch (err) {
			console.error('Failed to fetch notifications:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchNotifications();
	});

	const notifications = $derived(
		rawNotifications.map(n => ({
			id: n.id,
			title: n.title,
			message: n.message,
			time: timeAgo(n.createdAt || n.created_at),
			type: n.type,
			read: n.read || n.status === 'read',
			icon: iconMap[n.type] || '🔔',
			link: n.link
		}))
	);

	async function markAllAsRead() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
				method: 'POST',
				credentials: 'include'
			});
			if (res.ok) {
				fetchNotifications();
			}
		} catch (err) {
			console.error('Failed to mark all as read:', err);
		}
	}

	async function deleteNotification(id) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
				method: 'DELETE',
				credentials: 'include'
			});
			if (res.ok) {
				fetchNotifications();
			}
		} catch (err) {
			console.error('Failed to delete notification:', err);
		}
	}
</script>

<svelte:head>
	<title>Notifications — NearBuy</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 pb-20">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-black text-gray-900 dark:text-white">Notifications</h1>
			<p class="mt-2 text-gray-500 dark:text-gray-400">Stay updated with your business activity.</p>
		</div>
		<button 
			onclick={markAllAsRead}
			class="text-sm font-bold text-orange-500 hover:underline"
		>Mark all as read</button>
	</div>

	<div class="space-y-3">
		{#each notifications as note}
			<div class={`group relative overflow-hidden rounded-2xl border p-4 transition-all ${note.read ? 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900' : 'border-orange-200 bg-orange-50/50 shadow-sm dark:border-orange-500/30 dark:bg-orange-500/5'}`}>
				{#if !note.read}
					<div class="absolute left-0 top-0 h-full w-1 bg-orange-500"></div>
				{/if}
				<div class="flex items-start gap-4">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-800 text-2xl">
						{note.icon}
					</div>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class={`text-sm font-bold ${note.read ? 'text-gray-900 dark:text-gray-100' : 'text-orange-900 dark:text-orange-400'}`}>{note.title}</h3>
							<span class="text-[10px] font-medium text-gray-400">{note.time}</span>
						</div>
						<p class="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{note.message}</p>
						
						{#if note.type === 'requirement'}
							<a href="/provider/requirements" class="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 hover:bg-orange-600">Respond Now</a>
						{/if}
					</div>
					<button 
						onclick={() => deleteNotification(note.id)}
						class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
						title="Delete"
					>✕</button>
				</div>
			</div>
		{/each}

		{#if notifications.length === 0}
			<div class="py-20 text-center flex flex-col items-center">
				<div class="mb-6 text-6xl opacity-20">🔔</div>
				<h3 class="text-xl font-bold text-gray-900 dark:text-white">All caught up!</h3>
				<p class="mt-1 text-sm text-gray-500">No new notifications for you.</p>
			</div>
		{/if}
	</div>
</div>
