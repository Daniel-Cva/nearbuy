<script>
	import { page } from '$app/stores';
	const staffId = $page.params.id;

	// Mock staff data
	const staffMembers = {
		'1': {
			id: 1,
			employeeId: 'NB-STF-001',
			name: 'Priya S',
			role: 'employee',
			email: 'priya@krishna.in',
			phone: '+91 98001 11111',
			jobs: 42,
			joined: '2025-10-01',
			imageUrl: 'https://i.pravatar.cc/150?u=priya',
			address: 'Anna Nagar, Chennai',
			emergencyContact: '+91 99988 77665',
			performance: 94
		},
		'2': {
			id: 2,
			employeeId: 'NB-STF-002',
			name: 'Karthik M',
			role: 'employee',
			email: 'karthik@krishna.in',
			phone: '+91 98002 22222',
			jobs: 28,
			joined: '2026-01-15',
			imageUrl: 'https://i.pravatar.cc/150?u=karthik',
			address: 'T Nagar, Chennai',
			emergencyContact: '+91 88877 66554',
			performance: 88
		}
	};

	const member = staffMembers[staffId] || staffMembers['1'];
	
	let isEditing = $state(false);
	let editedMember = $state({ ...member });
	let saved = $state(false);

	// Permission checks
	const currentUserRole = 'founder'; // In real app, this would come from a session store
	const canEdit = currentUserRole === 'founder' || currentUserRole === 'admin';

	function handleSave() {
		saved = true;
		setTimeout(() => {
			saved = false;
			isEditing = false;
		}, 1500);
	}

	function handleDelete() {
		if (confirm('Permanently remove this team member? This cannot be undone.')) {
			window.location.href = '/provider/staff';
		}
	}
</script>

<svelte:head>
	<title>{member.name} — Staff Details</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
	<header class="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 shadow-sm">
		<div class="flex items-center gap-3">
			<a href="/provider/staff" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Team</a>
			<h1 class="font-bold text-gray-900 dark:text-white">{member.name}</h1>
		</div>
		
		{#if canEdit}
			<div class="flex items-center gap-2">
				{#if !isEditing}
					<button 
						onclick={() => (isEditing = true)}
						class="rounded-xl border border-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all shadow-sm"
					>Edit</button>
					<button 
						onclick={handleDelete}
						class="rounded-xl border border-red-200 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm"
					>Delete</button>
				{:else}
					<button 
						onclick={handleSave}
						class={`rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all ${saved ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
					>
						{saved ? 'Saved ✓' : 'Save Changes'}
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<div class="mx-auto max-w-2xl px-4 py-8">
		<!-- Profile Header -->
		<div class="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
			<div class="relative group">
				<div class="h-24 w-24 overflow-hidden rounded-[32px] border-4 border-white shadow-xl dark:border-gray-800">
					<img src={member.imageUrl} alt={member.name} class="h-full w-full object-cover" />
				</div>
				{#if isEditing}
					<div class="absolute inset-0 flex items-center justify-center rounded-[32px] bg-black/40 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
						<span class="text-xl">📷</span>
					</div>
				{/if}
			</div>
			<div class="flex-1">
				<span class="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm dark:bg-orange-500/20 dark:text-orange-400">
					{member.employeeId}
				</span>
				<h2 class="mt-2 text-3xl font-black text-gray-900 dark:text-white leading-tight">
					{#if isEditing}
						<input 
							bind:value={editedMember.name} 
							class="w-full bg-transparent border-b-2 border-orange-500 focus:outline-none"
						/>
					{:else}
						{member.name}
					{/if}
				</h2>
				<p class="mt-1 text-sm font-bold text-gray-500 uppercase tracking-wide">
					{#if isEditing}
						<select bind:value={editedMember.role} class="bg-transparent text-gray-500 border-none p-0 focus:outline-none">
							<option value="employee">Employee</option>
							<option value="admin">Admin</option>
						</select>
					{:else}
						{member.role}
					{/if}
					 · Joined {member.joined}
				</p>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="mb-8">
			<div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Jobs</p>
				<p class="text-2xl font-black text-gray-900 dark:text-white">{member.jobs}</p>
			</div>
		</div>

		<!-- Details -->
		<div class="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h3 class="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">Personnel Information</h3>
			
			<div class="grid gap-6 sm:grid-cols-2">
				<div>
					<span class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</span>
					{#if isEditing}
						<input bind:value={editedMember.email} class="w-full rounded-xl bg-gray-50 p-3 text-sm font-bold dark:bg-gray-800 border-none" />
					{:else}
						<p class="font-bold text-gray-900 dark:text-white">{member.email}</p>
					{/if}
				</div>
				<div>
					<span class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</span>
					{#if isEditing}
						<input bind:value={editedMember.phone} class="w-full rounded-xl bg-gray-50 p-3 text-sm font-bold dark:bg-gray-800 border-none" />
					{:else}
						<p class="font-bold text-gray-900 dark:text-white">{member.phone}</p>
					{/if}
				</div>
				<div>
					<span class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Home Address</span>
					{#if isEditing}
						<textarea bind:value={editedMember.address} class="w-full rounded-xl bg-gray-50 p-3 text-sm font-bold dark:bg-gray-800 border-none resize-none" rows="2"></textarea>
					{:else}
						<p class="font-bold text-gray-900 dark:text-white">{member.address}</p>
					{/if}
				</div>
				<div>
					<span class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Emergency Contact</span>
					{#if isEditing}
						<input bind:value={editedMember.emergencyContact} class="w-full rounded-xl bg-gray-50 p-3 text-sm font-bold dark:bg-gray-800 border-none" />
					{:else}
						<p class="font-bold text-gray-900 dark:text-white">{member.emergencyContact}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
