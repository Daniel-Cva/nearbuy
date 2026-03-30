<script>
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	let profileData = $state(null);
	let errorMsg = $state(null);
	let loading = $state(true);

	// DJ.md §2.1 — GET /api/me returns the raw profile row directly.
	// Use this instead of the removed /api/auth/user/session endpoint.
	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await res.json();

			if (!res.ok) {
				errorMsg = data?.message || `HTTP Error: ${res.status}`;
			} else {
				profileData = data;
			}
		} catch (err) {
			errorMsg = err.message;
			console.error('Profile test error:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Profile Test (GET /api/me)</h1>

	{#if loading}
		<p>Loading profile data...</p>
	{:else if errorMsg && !profileData}
		<div class="mb-4 rounded border border-red-500 bg-red-100 p-4 text-red-700">
			Error: {errorMsg}
		</div>
	{:else}
		{#if errorMsg}
			<div class="mb-4 rounded border border-red-500 bg-red-100 p-4 text-red-700">
				Error: {errorMsg}
			</div>
		{/if}
		<pre class="rounded bg-gray-900 p-4 text-sm text-green-400 overflow-auto whitespace-pre-wrap">{JSON.stringify(profileData, null, 2)}</pre>
	{/if}
</div>
