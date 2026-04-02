<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';

	let profile   = $state(null);
	let loading   = $state(true);
	let saving    = $state(false);
	let uploading = $state(false);
	let isEditing = $state(false);
	let errorMsg  = $state('');
	let successMsg= $state('');

	let editName      = $state('');
	let editEmail     = $state('');
	let editMobile    = $state('');
	let editBio       = $state('');
	let avatarFile    = $state(null);
	let avatarPreview = $state('');

	// Load profile ONLY when this page is visited
	onMount(async () => {
		try {
			// Check store first (no network call if already loaded)
			const stored = getCurrentProfile();
			if (stored?.id) {
				profile = stored;
				syncForm();
				loading = false;
				return;
			}
			// Otherwise call /api/me
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			const data = await res.json();
			profile = data.profile ?? data;
			syncForm();
		} catch (e) {
			errorMsg = 'Failed to load profile';
		} finally {
			loading = false;
		}
	});

	function syncForm() {
		if (!profile) return;
		editName   = profile.name ?? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim();
		editEmail  = profile.email ?? '';
		editMobile = profile.mobile ?? profile.phone ?? '';
		editBio    = profile.bio ?? '';
		avatarPreview = profile.avatar_url ? toDisplayUrl(profile.avatar_url) : '';
	}

	function startEdit() { syncForm(); avatarFile = null; isEditing = true; errorMsg = ''; successMsg = ''; }
	function cancelEdit() { isEditing = false; avatarFile = null; syncForm(); }

	function handleAvatarPick(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		avatarFile = file;
		avatarPreview = URL.createObjectURL(file);
	}

	async function saveProfile() {
		errorMsg = ''; successMsg = ''; saving = true;
		try {
			let avatarUrl = profile?.avatar_url ?? null;
			if (avatarFile) {
				uploading = true;
				const up = await uploadToUniversalApi({
					type: 'business-profile',
					bizId: profile?.biz_id,
					file: avatarFile
				});
				avatarUrl = up.path;
				uploading = false;
			}

			const payload = {
				name:       editName.trim()   || undefined,
				email:      editEmail.trim()  || undefined,
				mobile:     editMobile.replace(/\D/g, '') || undefined,
				bio:        editBio.trim(),
				...(avatarUrl ? { avatar_url: avatarUrl } : {})
			};

			const res = await fetch(`${API_BASE_URL}/api/me`, {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.message ?? `Update failed (${res.status})`);
			}

			// Reload profile after save
			const meRes = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			const meData = await meRes.json();
			profile = meData.profile ?? meData;
			isEditing = false;
			avatarFile = null;
			syncForm();
			successMsg = 'Profile updated!';
			setTimeout(() => (successMsg = ''), 3000);
		} catch (err) {
			errorMsg = err?.message ?? 'Unable to save profile.';
		} finally {
			saving = false; uploading = false;
		}
	}

	async function toggleCollab() {
		try {
			const newMode = (profile?.collab_mode === 'ON') ? 'OFF' : 'ON';
			const res = await fetch(`${API_BASE_URL}/api/me`, {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({ collab_mode: newMode })
			});
			if (res.ok) {
				const updated = await res.json();
				profile = updated.profile ?? updated.founder ?? updated;
				syncForm();
			}
		} catch (err) {
			errorMsg = "Failed to toggle collab mode.";
		}
	}

	const initial = $derived((profile?.name ?? profile?.firstname ?? 'F')[0]?.toUpperCase() ?? 'F');
	const displayAvatar = $derived(avatarPreview || (profile?.avatar_url ? toDisplayUrl(profile.avatar_url) : ''));
	const displayName = $derived((profile?.name ?? `${profile?.firstname ?? ''} ${profile?.lastname ?? ''}`.trim()) || 'Founder');
	const collabOn = $derived((profile?.collab_mode ?? 'ON') === 'ON');
</script>

<svelte:head>
	<title>My Profile — NearBuy Business</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-16">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95 px-4 py-3 backdrop-blur">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="20" />
		</a>
		<h1 class="flex-1 font-bold">My Profile</h1>
		{#if !isEditing && !loading}
			<button onclick={startEdit} class="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1">
				<Icon icon="mdi:pencil-outline" width="14" /> Edit
			</button>
		{/if}
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-5">
		{#if errorMsg}
			<div class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-500">
				<Icon icon="mdi:alert-circle" width="16" />{errorMsg}
			</div>
		{/if}
		{#if successMsg}
			<div class="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm font-bold text-green-600">
				<Icon icon="mdi:check-circle" width="16" />{successMsg}
			</div>
		{/if}

		{#if loading}
			<div class="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 animate-pulse">
				<div class="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
			</div>
		{:else}
		<!-- Avatar card -->
		<div class="flex flex-col items-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm relative overflow-hidden">
			<div class="absolute top-0 inset-x-0 h-20 bg-linear-to-br from-orange-400/20 to-orange-600/20"></div>
			<div class="relative w-24 h-24 mb-4 z-10">
				<div class="w-full h-full rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-white dark:border-gray-900 overflow-hidden">
					{#if displayAvatar}
						<img src={displayAvatar} alt="Avatar" class="w-full h-full object-cover" />
					{:else}
						{initial}
					{/if}
				</div>
				{#if isEditing}
					<label for="provider-avatar" class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center border-2 border-white cursor-pointer hover:scale-110 transition-transform">
						{#if uploading}<Icon icon="mdi:loading" width="14" class="animate-spin" />{:else}<Icon icon="mdi:camera" width="14" />{/if}
					</label>
					<input id="provider-avatar" type="file" accept="image/*" class="hidden" onchange={handleAvatarPick} />
				{/if}
			</div>

			{#if isEditing}
				<input type="text" bind:value={editName} placeholder="Your name"
					class="text-center font-bold text-sm bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 px-3 py-1.5 focus:border-orange-500 focus:outline-none w-full max-w-xs" />
			{:else}
				<h2 class="text-xl font-black z-10">{displayName}</h2>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1 z-10">{profile?.email ?? ''}</p>
				{#if profile?.biz_id}
					<span class="mt-2 text-xs font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full z-10">Founder / Staff</span>
				{/if}
			{/if}
		</div>

		<!-- Bio / About -->
		<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 shadow-sm">
			<h3 class="font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:text-account" width="16" /> About
			</h3>
			{#if isEditing}
				<textarea bind:value={editBio} placeholder="Write a short personal or professional bio..."
					class="w-full h-32 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none resize-none"></textarea>
			{:else}
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
					{profile?.bio || 'No bio provided yet.'}
				</p>
			{/if}
		</div>

		<!-- Collab Feature -->
		<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between shadow-sm">
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
					<Icon icon="mdi:handshake-outline" width="22" />
				</div>
				<div>
					<p class="font-bold text-sm">Collab Mode</p>
					<p class="text-[10px] text-gray-500 dark:text-gray-400">Discoverable to other founders</p>
				</div>
			</div>
			<button onclick={toggleCollab} class={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${collabOn ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
				<span class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${collabOn ? 'translate-x-5' : 'translate-x-0'}`}></span>
			</button>
		</div>

		<!-- Contact info -->
		<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
			<h3 class="font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
				<Icon icon="mdi:card-account-details-outline" width="16" /> Contact
			</h3>

			<div>
				<label class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Email</label>
				{#if isEditing}
					<input type="email" bind:value={editEmail}
						class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none" />
				{:else}
					<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
						{profile?.email ?? '—'}
					</p>
				{/if}
			</div>

			<div>
				<label class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Mobile</label>
				{#if isEditing}
					<div class="relative">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+91</span>
						<input type="tel" bind:value={editMobile}
							class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none" />
					</div>
				{:else}
					<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
						{profile?.mobile ?? profile?.phone ? `+91 ${profile?.mobile ?? profile?.phone}` : '—'}
					</p>
				{/if}
			</div>
		</div>

		{#if isEditing}
			<div class="flex gap-3 sticky bottom-4 z-20">
				<button onclick={cancelEdit} class="flex-1 py-4 rounded-2xl font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
					Cancel
				</button>
				<button onclick={saveProfile} disabled={saving}
					class="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-60">
					{#if saving}
						<Icon icon="mdi:loading" width="16" class="animate-spin" />
						{uploading ? 'Uploading...' : 'Saving...'}
					{:else}
						<Icon icon="mdi:content-save-outline" width="16" /> Save Changes
					{/if}
				</button>
			</div>
		{/if}
		{/if}
	</div>
</div>
