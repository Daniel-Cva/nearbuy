<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { toDisplayUrl, uploadToUniversalApi } from '$lib/helpers/upload.js';

	// ── State ────────────────────────────────────────────────────────────────
	let bizId        = $state('');
	let staff        = $state([]);
	let loading      = $state(true);
	let errorMsg     = $state('');
	let successMsg   = $state('');
	let saving       = $state(false);

	let showAddModal = $state(false);
	let newMember = $state({
		name: '',
		email: '',
		mobile: '',
		role: 'staff', // DJ.md §6.2: "manager" or "staff"
		location: ''
	});
	let password = $state(''); // Staff login password

	// ── Load ─────────────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			// 1. Get bizId from /api/me
			const me = await fetch(`${API_BASE_URL}/api/me`, {
				credentials: 'include', headers: { 'Accept': 'application/json' }
			});
			if (!me.ok) throw new Error('Not authenticated');
			const meData = await me.json();
			bizId = meData.biz_id ?? meData.profile?.biz_id ?? '';
			if (!bizId) throw new Error('No business association found.');

			await loadStaff();
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to load staff list.';
		} finally {
			loading = false;
		}
	});

	async function loadStaff() {
		try {
			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/staff`, {
				credentials: 'include', headers: { 'Accept': 'application/json' }
			});
			if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);
			const data = await res.json();
			staff = Array.isArray(data.staff ?? data.data ?? data) ? (data.staff ?? data.data ?? data) : [];
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to refresh staff list.';
		}
	}

	// ── Actions ──────────────────────────────────────────────────────────────
	async function handleAddStaff(e) {
		e.preventDefault();
		if (!newMember.name || !newMember.email || !password) {
			errorMsg = 'Name, email and password are required.';
			return;
		}
		
		errorMsg = ''; successMsg = ''; saving = true;
		try {
			// DJ.md §6.2: POST /api/businesses/[bizId]/staff
			const res = await fetch(`${API_BASE_URL}/api/businesses/${bizId}/staff`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({
					...newMember,
					password
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.message ?? `Failed to add staff (${res.status})`);
			}

			successMsg = 'Staff member added successfully!';
			showAddModal = false;
			newMember = { name: '', email: '', mobile: '', role: 'staff', location: '' };
			password = '';
			await loadStaff();
		} catch (err) {
			errorMsg = err?.message ?? 'Failed to add staff member.';
		} finally {
			saving = false;
		}
	}

	function closeModals() {
		showAddModal = false;
		errorMsg = '';
	}
</script>

<svelte:head>
	<title>Staff Management — NearBuy</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sticky top-0 z-10 md:static md:bg-transparent md:border-none md:backdrop-blur-none md:px-0 md:py-0 md:mb-6 md:mt-2">
		<div class="flex items-center gap-4">
			<a href="/provider/home" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
				<Icon icon="mdi:arrow-left" width="16" height="16" /> Home
			</a>
			<h1 class="font-bold text-gray-900 dark:text-white">Staff Management</h1>
		</div>
		<button onclick={() => (showAddModal = true)}
			class="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-orange-600 shadow-md shadow-orange-500/20 active:scale-95">
			+ Add Member
		</button>
	</div>

	<div class="mx-auto max-w-3xl px-6 py-8 md:px-0 md:py-0">
		
		{#if successMsg}
			<div class="mb-6 flex items-center gap-2 rounded-xl bg-green-500/10 p-4 text-sm font-bold text-green-600 border border-green-500/20">
				<Icon icon="mdi:check-circle" width="18" height="18" /> {successMsg}
			</div>
		{/if}

		{#if errorMsg && !showAddModal}
			<div class="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm font-bold text-red-500 border border-red-500/20">
				<Icon icon="mdi:alert-circle" width="18" height="18" /> {errorMsg}
			</div>
		{/if}

		{#if loading}
			<div class="space-y-3">
				{#each Array(4) as _}
					<div class="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
				{/each}
			</div>
		{:else if staff.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
				<Icon icon="mdi:account-group-outline" width="64" height="64" class="text-gray-300 dark:text-gray-700 mb-4" />
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">No Staff Members</h2>
				<p class="text-gray-500 dark:text-gray-400 mt-2 max-w-sm px-6">Invite your team to help manage orders and inventory.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each staff as member}
					<a href={`/provider/staff/${member.id}`}
						class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm hover:border-orange-500/50 transition-all">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-lg font-bold text-white">
							{member.name?.[0]?.toUpperCase() ?? 'S'}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<h3 class="font-bold text-gray-900 dark:text-white truncate">{member.name}</h3>
								<span class={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${member.role === 'manager' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
									{member.role}
								</span>
							</div>
							<p class="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
						</div>
						<div class="text-right shrink-0">
							<p class="text-[10px] font-black uppercase text-gray-400">View Account</p>
							<Icon icon="mdi:chevron-right" width="20" height="20" class="text-gray-300 group-hover:text-orange-500 ml-auto" />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Add Modal -->
	{#if showAddModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<form onsubmit={handleAddStaff} class="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
				<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Team Member</h2>
				
				{#if errorMsg}
					<div class="text-xs font-bold text-red-500 bg-red-500/10 p-2 rounded-lg">{errorMsg}</div>
				{/if}

				<div class="space-y-3">
					<div>
						<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1" for="s-name">Full Name</label>
						<input id="s-name" type="text" bind:value={newMember.name} required
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1" for="s-email">Email Address</label>
						<input id="s-email" type="email" bind:value={newMember.email} required
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1" for="s-pass">Password</label>
						<input id="s-pass" type="password" bind:value={password} required
							class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1" for="s-role">Role</label>
							<select id="s-role" bind:value={newMember.role} class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none font-bold">
								<option value="staff">Staff Member</option>
								<option value="manager">Manager</option>
							</select>
						</div>
						<div>
							<label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1" for="s-phone">Mobile</label>
							<input id="s-phone" type="tel" bind:value={newMember.mobile}
								class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
						</div>
					</div>
				</div>

				<div class="flex gap-3 pt-4">
					<button type="button" onclick={closeModals} class="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Cancel</button>
					<button type="submit" disabled={saving} class="flex-2 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-60">
						{saving ? 'Adding...' : 'Add Member'}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
