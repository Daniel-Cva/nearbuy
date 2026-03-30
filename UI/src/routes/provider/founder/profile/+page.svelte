<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { initializeAuthFromServer } from '$lib/helpers/authInit.js';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let profile      = $state(null);
	let loading      = $state(true);
	let saving       = $state(false);
	let uploading    = $state(false);
	let errorMsg     = $state('');
	let successMsg   = $state('');
	let isEditing    = $state(false);

	// Edit fields — DJ.md §2.2: Founder/Staff PUT /api/me accepts: name, email, mobile, avatar_url, password only
	let editName     = $state('');
	let editMobile   = $state('');
	let avatarFile   = $state(null);
	let avatarPreview= $state('');

	// ── Load via /api/me (centralized) ───────────────────────────────────────
	onMount(async () => {
		try {
			// use the central helper to load profile and sync the auth store
			const result = await initializeAuthFromServer();
			
			if (result.success && result.role === 'provider') {
				// We call it once to initialize the store, then fetch raw for the UI state
				const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
				const data = await res.json();
				profile = data.profile ?? data.founder ?? data;
				syncForm();
			} else {
				throw new Error(result.error || 'Failed to authenticate');
			}
		} catch (err) {
			errorMsg = err?.message ?? 'Unable to load your profile.';
		} finally {
			loading = false;
		}
	});

	function syncForm() {
		if (!profile) return;
		editName    = profile.name ?? profile.founder_name ?? '';
		editMobile  = profile.mobile ?? profile.phone ?? '';
		avatarPreview = profile.avatar_url ? toDisplayUrl(profile.avatar_url) : '';
	}

	function startEdit() { syncForm(); avatarFile = null; isEditing = true; errorMsg = ''; successMsg = ''; }
	function cancelEdit() { isEditing = false; avatarFile = null; syncForm(); errorMsg = ''; }

	function handleAvatarPick(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		avatarFile    = file;
		avatarPreview = URL.createObjectURL(file);
	}

	// ── Save: Step 1 R2 upload (if new photo), Step 2 PUT /api/me ────────────
	async function saveProfile() {
		errorMsg = ''; successMsg = ''; saving = true;
		try {
			let avatarUrl = profile?.avatar_url ?? null;

			// Step 1 — upload to R2 only if a new file was picked
			if (avatarFile) {
				uploading = true;
				const up = await uploadToUniversalApi({
					type:  'business-profile',
					bizId: profile?.biz_id ?? profile?.business_id ?? '',
					file:  avatarFile
				});
				avatarUrl = up.path;
				uploading = false;
			}

			// Step 2 — PUT /api/me with founder payload (DJ.md §2.2)
			// Only: name, email, mobile, avatar_url, password
			const payload = {
				name:       editName.trim()   || undefined,
				mobile:     editMobile.replace(/\D/g, '') || undefined,
				...(avatarUrl ? { avatar_url: avatarUrl } : {})
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
			profile   = updated.profile ?? updated.founder ?? updated;
			avatarFile = null;
			isEditing  = false;
			syncForm();
			successMsg = 'Profile updated!';
			setTimeout(() => (successMsg = ''), 3500);
		} catch (err) {
			errorMsg = err?.message ?? 'Unable to save profile.';
		} finally {
			saving = false; uploading = false;
		}
	}

	// Collab toggle removed — collab_mode is not in DJ.md §2.2 founder/staff PUT payload

	// Derived
	const displayName    = $derived(profile?.name ?? profile?.founder_name ?? 'Founder');
	const displayInitial = $derived(displayName[0]?.toUpperCase() ?? 'F');
	const displayBio     = $derived(profile?.bio ?? '');
	const collabOn       = $derived((profile?.collab_mode ?? 'ON') === 'ON');
</script>

<svelte:head>
	<title>Founder Profile — NearBuy</title>
	<meta name="description" content="Manage your founder profile, collab visibility, and business public presence on NearBuy." />
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
				<Icon icon="mdi:arrow-left" width="16" height="16" /> Home
			</a>
			<span class="text-gray-300 dark:text-gray-700">|</span>
			<h1 class="font-bold text-gray-900 dark:text-white">Founder Profile</h1>
		</div>
		<a href="/provider/founder/collab" class="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-400 shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5">
			<Icon icon="mdi:handshake-outline" width="16" height="16" /> Start Collab
		</a>
	</div>

	<div class="mx-auto max-w-2xl space-y-6 px-6 py-6 md:py-0 md:px-0">

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
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm animate-pulse">
				<div class="flex items-center gap-5">
					<div class="h-20 w-20 rounded-2xl bg-gray-200 dark:bg-gray-700 shrink-0"></div>
					<div class="flex-1 space-y-3">
						<div class="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
						<div class="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700"></div>
					</div>
				</div>
			</div>
		{:else}

		<!-- Profile Card -->
		<div class="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
			<div class="relative group/avatar shrink-0">
				<div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 text-3xl font-bold text-white shadow-md">
					{#if avatarPreview}
						<img src={avatarPreview} alt={displayName} class="h-full w-full object-cover" />
					{:else}
						{displayInitial}
					{/if}
				</div>
				{#if isEditing}
					<label for="founder-avatar-input" class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[2px] opacity-0 transition-opacity group-hover/avatar:opacity-100">
						{#if uploading}<Icon icon="mdi:loading" width="20" height="20" class="animate-spin text-white" />
						{:else}<Icon icon="mdi:camera" width="20" height="20" class="text-white" />
						{/if}
					</label>
					<input id="founder-avatar-input" type="file" accept="image/*" class="hidden" onchange={handleAvatarPick} />
				{/if}
			</div>

			<div class="flex-1 text-center sm:text-left">
				{#if isEditing}
					<input bind:value={editName} placeholder="Your full name"
						class="mb-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-lg font-bold focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
					<input bind:value={editMobile} placeholder="Mobile number"
						class="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
				{:else}
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
					{#if profile?.mobile ?? profile?.phone}
						<p class="text-sm text-gray-500 dark:text-gray-400">{profile?.mobile ?? profile?.phone}</p>
					{/if}
				{/if}
				{#if profile?.biz_id}
					<span class="mt-1 inline-block rounded bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-black text-orange-500 uppercase tracking-tight">
						BIZ: {profile.biz_id}
					</span>
				{/if}
			</div>


			<div class="flex flex-col gap-2 w-full sm:w-auto">
				{#if isEditing}
					<button onclick={saveProfile} disabled={saving}
						class="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-60">
						{#if saving}
							<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
							{uploading ? 'Uploading...' : 'Saving...'}
						{:else}
							<Icon icon="mdi:content-save-outline" width="14" height="14" /> Save
						{/if}
					</button>
					<button onclick={cancelEdit} disabled={saving}
						class="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 px-6 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-gray-300 transition-all">
						Cancel
					</button>
				{:else}
					<button id="btn-edit-profile" onclick={startEdit}
						class="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
						<Icon icon="mdi:pencil-outline" width="14" height="14" /> Edit Profile
					</button>
				{/if}
			</div>
		</div>

		<!-- Quick links -->
		<div class="grid grid-cols-3 gap-4">
			<a href={profile?.biz_id ? `/provider/businesses/${profile.biz_id}` : '/provider/businesses'}
				class="col-span-2 group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-orange-500/50 hover:shadow-md">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-gray-800 text-orange-500">
					<Icon icon="mdi:store" width="22" height="22" />
				</div>
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Profile</p>
					<p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
						{profile?.business_name ?? profile?.bname ?? 'View Business'}
					</p>
				</div>
			</a>
			<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 text-center shadow-sm">
				<div class="text-2xl font-bold text-orange-500">{profile?.collab_count ?? 0}</div>
				<div class="mt-1 text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">Collabs</div>
			</div>
		</div>

		<!-- Collab (read-only display — collab_mode not in DJ.md §2.2 PUT payload) -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
			<h3 class="mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
				<Icon icon="mdi:handshake-outline" width="18" height="18" class="text-orange-500" />
				Collab Feature
				<span class="rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-400">Founder Exclusive</span>
			</h3>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-bold text-gray-900 dark:text-white">Collab Mode</p>
					<p class="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">Allow other founders to discover and connect</p>
				</div>
				<span class={`rounded-full px-3 py-1 text-xs font-black ${collabOn ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
					{collabOn ? 'ON' : 'OFF'}
				</span>
			</div>
		</div>

		<!-- Bio (read-only — bio is not in DJ.md §2.2 PUT payload) -->
		<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 shadow-sm">
			<h3 class="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
				<Icon icon="mdi:text-account" width="18" height="18" class="text-orange-500" /> About
			</h3>
			{#if displayBio}
				<p class="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">{displayBio}</p>
			{:else}
				<p class="text-sm italic text-gray-400">No bio available.</p>
			{/if}
		</div>

		{/if}
	</div>
</div>
