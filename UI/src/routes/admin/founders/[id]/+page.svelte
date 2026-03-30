<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let loading = $state(true);
	let errorMsg = $state('');
	let founderData = $state(null);

	async function fetchFounderDetail() {
		loading = true;
		errorMsg = '';
		try {
		const response = await fetch(`${API_BASE_URL}/api/admin/founders/${$page.params.id}`, {
				credentials: 'include'
			});

			const contentType = response.headers.get('content-type') || '';
			const isJson = contentType.includes('application/json');
			const data = isJson ? await response.json() : null;

			if (!response.ok) {
				throw new Error(data?.message || `Failed to fetch founder (${response.status}).`);
			}

			founderData = data?.founder || data?.data || null;
		} catch (err) {
			console.error('Failed to load founder:', err);
			errorMsg = err?.message || 'Failed to load founder details.';
		} finally {
			loading = false;
		}
	}

	const founder = $derived(
		founderData
			? {
					id: founderData.id || $page.params.id,
					name: founderData.name || '-',
					business: founderData.bname || founderData.business || '-',
					location: `${founderData.city || '-'}${founderData.state ? `, ${founderData.state}` : ''}`,
					industry: founderData.industry || founderData.category || 'General',
					collab:
						String(founderData.collab_mode || founderData.collab || 'OFF').toUpperCase() === 'ON'
							? 'Open'
							: 'Closed',
					bio: founderData.bio || 'No bio available.',
					connections: Number(founderData.connections || 0)
			  }
			: null
	);

	onMount(() => {
		fetchFounderDetail();
	});
</script>

<svelte:head>
	<title>Founder Profile - NearBuy Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl p-6 md:p-10">
	{#if founder}
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Founder Profile</p>
		<h1 class="mt-1 text-3xl font-black text-gray-900 dark:text-white">{founder.name}</h1>
		<p class="mt-1 text-sm font-bold text-gray-500">{founder.id} • {founder.business}</p>
		<div class="mt-6 grid gap-5 md:grid-cols-2">
			<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry</p>
				<p class="mt-1 text-lg font-black text-gray-900 dark:text-white">{founder.industry}</p>
				<p class="mt-2 text-sm font-bold text-gray-500">{founder.location}</p>
			</div>
			<div class="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Network</p>
				<p class="mt-1 text-lg font-black text-gray-900 dark:text-white">{founder.connections} Connections</p>
				<p class="mt-2 text-sm font-bold text-gray-500">Collab: {founder.collab}</p>
			</div>
		</div>
		<div class="mt-5 rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Bio</p>
			<p class="mt-2 text-sm font-bold leading-relaxed text-gray-600 dark:text-gray-300">{founder.bio}</p>
		</div>
	{:else if loading}
		<p class="text-sm font-bold text-gray-500">Loading founder: {$page.params.id}</p>
	{:else}
		<p class="text-sm font-bold text-gray-500">{errorMsg || `Unknown founder ID: ${$page.params.id}`}</p>
	{/if}
</div>
