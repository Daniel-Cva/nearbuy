<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { initializeAuthFromServer } from '$lib/helpers/authInit.js';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let profile    = $state(null);
	let loading    = $state(true);
	let saving     = $state(false);
	let uploading  = $state(false);
	let isEditing  = $state(false);
	let errorMsg   = $state('');
	let successMsg = $state('');

	// Edit fields — shopper payload: firstname, lastname, mobile, interests
	let editFirstname = $state('');
	let editLastname  = $state('');
	let editMobile    = $state('');
	let editCity      = $state('');
	let editState     = $state('');
	let editPincode   = $state('');
	let editInterests = $state([]);

	let avatarFile    = $state(null);
	let avatarPreview = $state('');

	// Pincode lookup
	let pincodeResults    = $state([]);
	let pincodeSearching  = $state(false);
	let pincodeError      = $state('');

	// ── Load via /api/me (centralized) ───────────────────────────────────────
	// ── Profile page is the designated /api/me call point ───────────────────
	// This is the ONLY place we call /api/me proactively (as per design).
	// The layout does NOT call /api/me — it only guards routes via cookie.
	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
			if (!res.ok) throw new Error('Session expired. Please log in again.');
			const data = await res.json();
			profile = data.profile ?? data;
			// Also refresh the in-memory auth store with fresh data
			setAuthFromResponse({ profile, userid: profile.id }, 'user');
			syncForm();
		} catch (e) {
			errorMsg = e?.message ?? 'Unable to load your profile.';
		} finally {
			loading = false;
		}
	});

	function syncForm() {
		if (!profile) return;
		// API may return full name or split names
		editFirstname = profile.firstname ?? profile.first_name ?? (profile.name?.split(' ')[0] ?? '');
		editLastname  = profile.lastname  ?? profile.last_name  ?? (profile.name?.split(' ').slice(1).join(' ') ?? '');
		editMobile    = profile.mobile    ?? profile.phone      ?? '';
		editCity      = profile.city      ?? '';
		editState     = profile.state     ?? '';
		editPincode   = profile.pincode   ?? '';
		editInterests = Array.isArray(profile.interests) ? [...profile.interests] : [];
		avatarPreview = profile.avatar_url ? toDisplayUrl(profile.avatar_url) : '';
	}

	function startEdit() { syncForm(); avatarFile = null; isEditing = true; errorMsg = ''; successMsg = ''; }
	function cancelEdit() { isEditing = false; avatarFile = null; syncForm(); pincodeResults = []; pincodeError = ''; }

	function handleAvatarPick(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		avatarFile    = file;
		avatarPreview = URL.createObjectURL(file);
	}

	// Pincode lookup
	async function searchPincode() {
		const pin = editPincode.replace(/\D/g, '').slice(0, 6);
		if (pin.length !== 6) return;
		pincodeSearching = true; pincodeResults = []; pincodeError = '';
		try {
			const res = await fetch(`${API_BASE_URL}/api/pincodes/${pin}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				pincodeResults = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
			} else {
				pincodeError = 'Pincode not found';
			}
		} catch { pincodeError = 'Lookup failed'; }
		finally { pincodeSearching = false; }
	}

	function applyPincode(r) { editCity = r.city; editState = r.state; pincodeResults = []; }

	function toggleInterest(tag) {
		const idx = editInterests.indexOf(tag);
		if (idx === -1) editInterests = [...editInterests, tag];
		else editInterests = editInterests.filter((_, i) => i !== idx);
	}

	// ── Save: Step 1 R2 upload, Step 2 PUT /api/me ───────────────────────────
	async function saveProfile() {
		errorMsg = ''; successMsg = ''; saving = true;
		try {
			let avatarUrl = profile?.avatar_url ?? null;

			// Step 1 — upload avatar to R2 if new file
			if (avatarFile) {
				uploading = true;
				const up = await uploadToUniversalApi({
					type:   'user-profile',
					userId: profile?.id ?? profile?.user_id ?? '',
					file:   avatarFile
				});
				avatarUrl = up.path;
				uploading = false;
			}

			// Step 2 — PUT /api/me with shopper payload
			const payload = {
				firstname: editFirstname.trim() || undefined,
				lastname:  editLastname.trim()  || undefined,
				mobile:    editMobile.replace(/\D/g, '') || undefined,
				city:      editCity.trim()      || undefined,
				state:     editState.trim()     || undefined,
				pincode:   editPincode.trim()   || undefined,
				interests: editInterests.length ? editInterests : undefined,
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
			profile    = updated.profile ?? updated;
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

	// Derived
	const fullName    = $derived(`${profile?.firstname ?? profile?.first_name ?? ''} ${profile?.lastname ?? profile?.last_name ?? ''}`.trim() || profile?.name || 'User');
	const initial     = $derived(fullName[0]?.toUpperCase() ?? 'U');
	const displayAvatar = $derived(avatarPreview || (profile?.avatar_url ? toDisplayUrl(profile.avatar_url) : ''));

	const INTEREST_TAGS = ['Electronics', 'Fashion', 'Food', 'Home', 'Health', 'Sports', 'Books', 'Toys', 'Automotive', 'Beauty'];
</script>

<svelte:head>
	<title>My Profile — NearBuy</title>
	<meta name="description" content="Manage your NearBuy shopper profile." />
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white pb-28">

	<!-- Header -->
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
			<Icon icon="mdi:arrow-left" width="16" height="16" />
		</a>
		<h1 class="flex-1 font-bold">My Profile</h1>
		{#if !isEditing && !loading}
			<button onclick={startEdit} class="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
				<Icon icon="mdi:pencil-outline" width="14" height="14" /> Edit
			</button>
		{/if}
	</header>

	<div class="mx-auto max-w-xl px-4 py-6 space-y-6">

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
			<div class="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-8 shadow-sm animate-pulse gap-4">
				<div class="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700"></div>
			</div>
		{:else}

		<!-- Avatar / Name card -->
		<div class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
			<div class="absolute top-0 left-0 right-0 h-24 bg-linear-to-br from-orange-400/20 to-orange-600/20 dark:from-orange-500/10 dark:to-orange-600/10"></div>

			<div class="relative w-24 h-24 mb-4 z-10">
				<div class="w-full h-full rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-orange-500/30 border-4 border-white dark:border-gray-900 overflow-hidden">
					{#if displayAvatar}
						<img src={displayAvatar} alt="Profile" class="h-full w-full object-cover" />
					{:else}
						{initial}
					{/if}
				</div>
				{#if isEditing}
					<label for="user-avatar-upload" class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm cursor-pointer hover:scale-110 transition-transform">
						{#if uploading}
							<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
						{:else}
							<Icon icon="mdi:camera" width="14" height="14" />
						{/if}
					</label>
					<input id="user-avatar-upload" type="file" accept="image/*" class="hidden" onchange={handleAvatarPick} disabled={uploading} />
				{/if}
			</div>

			{#if isEditing}
				<div class="flex gap-2 w-full max-w-xs">
					<input type="text" bind:value={editFirstname} placeholder="First name"
						class="flex-1 text-center font-bold text-sm bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 px-2 py-1.5 focus:border-b-orange-500 focus:outline-none transition-colors" />
					<input type="text" bind:value={editLastname} placeholder="Last name"
						class="flex-1 text-center font-bold text-sm bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 px-2 py-1.5 focus:border-b-orange-500 focus:outline-none transition-colors" />
				</div>
			{:else}
				<h2 class="text-2xl font-black z-10">{fullName}</h2>
				<p class="text-gray-500 dark:text-gray-400 text-sm font-medium z-10 mt-0.5">
					{profile?.email ?? ''}{profile?.mobile ? ` · +91 ${profile.mobile}` : ''}
				</p>
			{/if}
		</div>

		<!-- Contact -->
		<div class="space-y-4 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
			<h3 class="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 text-orange-600 dark:text-orange-500 flex items-center gap-2">
				<Icon icon="mdi:card-account-details-outline" width="16" height="16" /> Contact Information
			</h3>
			<!-- Mobile -->
			<div>
				<label for="edit-mobile" class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
				{#if isEditing}
					<div class="relative">
						<span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+91</span>
						<input id="edit-mobile" type="tel" bind:value={editMobile}
							class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-all" />
					</div>
				{:else}
					<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
						{profile?.mobile ? `+91 ${profile.mobile}` : '—'}
					</p>
				{/if}
			</div>
			<!-- Email (read-only) -->
			<div>
				<div class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</div>
				<p class="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
					{profile?.email ?? '—'}
				</p>
			</div>
		</div>

		<!-- Location -->
		<div class="space-y-4 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
			<h3 class="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 text-orange-600 dark:text-orange-500 flex items-center gap-2">
				<Icon icon="mdi:map-marker-outline" width="16" height="16" /> Location
			</h3>
			{#if isEditing}
				<!-- Pincode with search -->
				<div>
					<label for="edit-pincode" class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Pincode</label>
					<div class="flex gap-2">
						<input id="edit-pincode" type="text" bind:value={editPincode} maxlength="6" placeholder="600001"
							class="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-all"
							onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchPincode(); } }} />
						<button type="button" onclick={searchPincode} disabled={pincodeSearching}
							class="flex items-center gap-1 rounded-xl border border-orange-500 bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 active:scale-95 disabled:opacity-60 transition-all">
							{#if pincodeSearching}
								<Icon icon="mdi:loading" width="14" height="14" class="animate-spin" />
							{:else}
								<Icon icon="mdi:magnify" width="14" height="14" />
							{/if}
						</button>
					</div>
					{#if pincodeError}<p class="mt-1 text-[10px] font-bold text-red-500">{pincodeError}</p>{/if}
					{#if pincodeResults.length > 0}
						<div class="mt-2 space-y-1 max-h-36 overflow-y-auto">
							{#each pincodeResults as r}
								<button type="button" onclick={() => applyPincode(r)}
									class="w-full flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-left text-xs font-semibold hover:border-orange-500 hover:text-orange-600 transition-all">
									<Icon icon="mdi:map-marker" width="12" height="12" class="text-orange-400 shrink-0" />
									{r.city}, {r.state}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="edit-city" class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">City</label>
						<input id="edit-city" type="text" bind:value={editCity} readonly
							class="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm cursor-default focus:outline-none" />
					</div>
					<div>
						<label for="edit-state" class="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">State</label>
						<input id="edit-state" type="text" bind:value={editState} readonly
							class="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm cursor-default focus:outline-none" />
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-3 gap-3">
					{#each [['Pincode', profile?.pincode], ['City', profile?.city], ['State', profile?.state]] as [lbl, val]}
						<div>
							<p class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{lbl}</p>
							<p class="font-semibold text-gray-800 dark:text-gray-200">{val ?? '—'}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Interests -->
		<div class="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
			<h3 class="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 mb-3 text-orange-600 dark:text-orange-500 flex items-center gap-2">
				<Icon icon="mdi:tag-multiple-outline" width="16" height="16" /> Interests
			</h3>
			{#if isEditing}
				<div class="flex flex-wrap gap-2">
					{#each INTEREST_TAGS as tag}
						<button type="button" onclick={() => toggleInterest(tag)}
							class={`rounded-full px-3 py-1 text-xs font-bold transition-all ${editInterests.includes(tag) ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-orange-300 border border-transparent'}`}>
							{tag}
						</button>
					{/each}
				</div>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each (profile?.interests ?? []) as tag}
						<span class="rounded-full bg-orange-50 dark:bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">{tag}</span>
					{/each}
					{#if !(profile?.interests?.length)}
						<p class="text-sm italic text-gray-400">No interests added yet.</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Privacy note -->
		<div class="p-5 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl flex gap-4 text-blue-900 dark:text-blue-300 shadow-sm">
			<div class="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 shadow-sm">
				<Icon icon="mdi:lock-outline" width="20" height="20" class="text-blue-500" />
			</div>
			<div>
				<p class="font-bold mb-1">Your Privacy Matters</p>
				<p class="opacity-80 text-xs leading-relaxed">This profile information is strictly private. Used exclusively to match you with relevant local providers. <strong class="font-bold">Never publicly visible to other users.</strong></p>
			</div>
		</div>

		<!-- Action buttons -->
		{#if isEditing}
			<div class="flex gap-3 pt-2 sticky bottom-6 z-20">
				<button onclick={cancelEdit} class="flex-1 py-4 rounded-2xl font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
					Cancel
				</button>
				<button onclick={saveProfile} disabled={saving}
					class="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-[0_8px_32px_-4px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-60">
					{#if saving}
						<Icon icon="mdi:loading" width="16" height="16" class="animate-spin" />
						{uploading ? 'Uploading...' : 'Saving...'}
					{:else}
						<Icon icon="mdi:content-save-outline" width="16" height="16" /> Save Changes
					{/if}
				</button>
			</div>
		{/if}

		{/if}
	</div>
</div>
