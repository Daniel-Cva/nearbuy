<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';

	// ── State ────────────────────────────────────────────────────────────────
	let profile    = $state(null);
	let loading    = $state(true);
	let saving     = $state(false);
	let isEditing  = $state(false);
	let errorMsg   = $state('');
	let successMsg = $state('');

	// Edit fields — staff payload: name, mobile, password
	let editName     = $state('');
	let editMobile   = $state('');
	let editPassword = $state('');
	let showPassword = $state(false);

	// ── Load via GET /api/me ─────────────────────────────────────────────────
	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include',
				headers: { 'Accept': 'application/json' }
			});
			if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
			const data = await res.json();
			profile = data.profile ?? data;
			syncForm();
		} catch (err) {
			errorMsg = err?.message ?? 'Unable to load your profile.';
		} finally {
			loading = false;
		}
	});

	function syncForm() {
		if (!profile) return;
		editName   = profile.name   ?? '';
		editMobile = profile.mobile ?? profile.phone ?? '';
		editPassword = '';
	}

	function startEdit() { syncForm(); isEditing = true; errorMsg = ''; successMsg = ''; }
	function cancelEdit() { isEditing = false; syncForm(); }

	// ── Save: PUT /api/me with staff payload ─────────────────────────────────
	async function saveProfile() {
		errorMsg = ''; successMsg = ''; saving = true;
		try {
			const payload = {
				name:   editName.trim()            || undefined,
				mobile: editMobile.replace(/\D/g, '') || undefined,
				...(editPassword.trim() ? { password: editPassword } : {})
			};

			const res = await fetch(`${API_BASE_URL}/api/me`, {
				method:      'PUT',
				credentials: 'include',
				headers:     { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body:        JSON.stringify(payload)
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.message ?? `Update failed (${res.status})`);
			}
			const updated = await res.json();
			profile   = updated.profile ?? updated;
			isEditing = false;
			syncForm();
			successMsg = 'Profile updated!';
			setTimeout(() => (successMsg = ''), 3500);
		} catch (err) {
			errorMsg = err?.message ?? 'Unable to save profile.';
		} finally {
			saving = false;
		}
	}

	const displayName    = $derived(profile?.name ?? 'Staff Member');
	const displayInitial = $derived(displayName[0]?.toUpperCase() ?? 'S');
	const roleLabel      = $derived(profile?.role ?? 'staff');
</script>

<svelte:head>
	<title>My Profile — NearBuy Staff</title>
	<meta name="description" content="Manage your NearBuy staff account profile." />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">

	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<a href="/provider/home" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="16" height="16" />
		</a>
		<h1 class="flex-1 font-bold text-gray-900 dark:text-white">My Profile</h1>
		{#if !isEditing && !loading}
			<button onclick={startEdit} class="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
				<Icon icon="mdi:pencil-outline" width="14" height="14" /> Edit
			</button>
		{/if}
	</header>

	<div class="mx-auto max-w-lg px-4 py-6 space-y-5">

		<!-- Banners -->
		{#if errorMsg}
			<div class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500">
				<Icon icon="mdi:alert-circle-outline" width="16" height="16" class="shrink-0" />{errorMsg}
			</div>
		{/if}
		{#if successMsg}
			<div class="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-xs font-bold text-green-600 dark:text-green-400">
				<Icon icon="mdi:check-circle-outline" width="16" height="16" class="shrink-0" />{successMsg}
			</div>
		{/if}

		{#if loading}
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-8 shadow-sm animate-pulse flex flex-col items-center gap-4">
				<div class="h-20 w-20 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
			</div>
		{:else}

		<!-- Avatar + role card -->
		<div class="flex flex-col items-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm text-center">
			<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 text-3xl font-black text-white shadow-md">
				{displayInitial}
			</div>
			<h2 class="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
			<span class="mt-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
				{roleLabel}
			</span>
			{#if profile?.employee_id}
				<span class="mt-1 text-[10px] font-bold text-gray-400">{profile.employee_id}</span>
			{/if}
		</div>

		<!-- Details form -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm space-y-4">
			<h3 class="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-500 border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:account-edit-outline" width="16" height="16" /> Account Details
			</h3>

			<!-- Name -->
			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="me-name">Full Name</label>
				{#if isEditing}
					<input id="me-name" type="text" bind:value={editName} placeholder="Your full name"
						class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none transition-all" />
				{:else}
					<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
						{profile?.name ?? '—'}
					</p>
				{/if}
			</div>

			<!-- Mobile -->
			<div>
				<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="me-mobile">Mobile Number</label>
				{#if isEditing}
					<div class="relative">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+91</span>
						<input id="me-mobile" type="tel" bind:value={editMobile}
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-all" />
					</div>
				{:else}
					<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
						{profile?.mobile ? `+91 ${profile.mobile}` : '—'}
					</p>
				{/if}
			</div>

			<!-- Email (read-only always) -->
			<div>
				<p class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email Address</p>
				<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					{profile?.email ?? '—'}
				</p>
			</div>

			<!-- Password (edit only) -->
			{#if isEditing}
				<div>
					<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" for="me-pass">New Password <span class="normal-case tracking-normal font-medium text-gray-400">(leave blank to keep current)</span></label>
					<div class="relative">
						<input
							id="me-pass"
							type={showPassword ? 'text' : 'password'}
							bind:value={editPassword}
							placeholder="Enter new password"
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 pr-10 py-3 text-sm focus:border-orange-500 focus:outline-none transition-all"
						/>
						<button type="button" onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
							aria-label={showPassword ? 'Hide password' : 'Show password'}>
							<Icon icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} width="16" height="16" />
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Business info (read-only) -->
		{#if profile?.biz_id || profile?.business_name}
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 shadow-sm">
				<h3 class="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-500 border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">
					<Icon icon="mdi:store" width="16" height="16" /> Business
				</h3>
				<p class="font-semibold text-gray-800 dark:text-gray-200">{profile?.business_name ?? '—'}</p>
				{#if profile?.biz_id}
					<span class="text-[10px] font-bold text-gray-400">ID: {profile.biz_id}</span>
				{/if}
			</div>
		{/if}

		<!-- Actions -->
		{#if isEditing}
			<div class="flex gap-3 sticky bottom-6 z-20">
				<button onclick={cancelEdit}
					class="flex-1 py-4 rounded-2xl font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
					Cancel
				</button>
				<button onclick={saveProfile} disabled={saving}
					class="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-60">
					{#if saving}
						<Icon icon="mdi:loading" width="16" height="16" class="animate-spin" /> Saving...
					{:else}
						<Icon icon="mdi:content-save-outline" width="16" height="16" /> Save Changes
					{/if}
				</button>
			</div>
		{/if}

		{/if}
	</div>
</div>
