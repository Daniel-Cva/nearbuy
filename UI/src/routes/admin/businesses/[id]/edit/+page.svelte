<script>
	import { page } from '$app/stores';

	const businesses = [
		{ id: 'BIZ-001', name: 'Krishna Electronics', owner: 'Ravi Kumar', location: 'Chennai, TN', plan: 'Pro', status: 'active' },
		{ id: 'BIZ-002', name: 'Meera Tailors', owner: 'Meera Devi', location: 'Coimbatore, TN', plan: 'Standard', status: 'active' },
		{ id: 'BIZ-003', name: 'Raj Mobile Works', owner: 'Raj Arjun', location: 'Madurai, TN', plan: 'Basic', status: 'active' },
		{ id: 'BIZ-004', name: 'Lakshmi Grocery', owner: 'Lakshmi S', location: 'Salem, TN', plan: 'Standard', status: 'active' },
		{ id: 'BIZ-005', name: 'Star Plumbing', owner: 'Murugan P', location: 'Trichy, TN', plan: 'Basic', status: 'suspended' },
		{ id: 'BIZ-006', name: 'Anand Bakery', owner: 'Anand R', location: 'Tirunelveli, TN', plan: 'Pro', status: 'active' },
		{ id: 'BIZ-007', name: 'NextGen Pharmacy', owner: 'Priya M', location: 'Vellore, TN', plan: 'Standard', status: 'active' },
		{ id: 'BIZ-008', name: 'Classic Electricals', owner: 'Kumar J', location: 'Erode, TN', plan: 'Basic', status: 'active' }
	];

	const biz = $derived(businesses.find((item) => item.id === $page.params.id));

	let form = $state({ name: '', owner: '', location: '', plan: 'Basic', status: 'active' });
	let saved = $state(false);

	$effect(() => {
		if (biz) {
			form = {
				name: biz.name,
				owner: biz.owner,
				location: biz.location,
				plan: biz.plan,
				status: biz.status
			};
		}
	});

	function save(e) {
		e.preventDefault();
		saved = true;
	}
</script>

<svelte:head>
	<title>Edit Business - NearBuy Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl p-6 md:p-10">
	{#if biz}
		<div class="mb-6">
			<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Edit</p>
			<h1 class="text-3xl font-black text-gray-900 dark:text-white">Edit {$page.params.id}</h1>
		</div>
		<form onsubmit={save} class="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
			<input bind:value={form.name} class="field" placeholder="Business name" required />
			<input bind:value={form.owner} class="field" placeholder="Owner name" required />
			<input bind:value={form.location} class="field" placeholder="Location" required />
			<select bind:value={form.plan} class="field"><option>Basic</option><option>Standard</option><option>Pro</option></select>
			<select bind:value={form.status} class="field"><option value="active">Active</option><option value="suspended">Suspended</option></select>
			<div class="flex items-center gap-3">
				<button type="submit" class="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white">Save</button>
				<a href={`/admin/businesses/${biz.id}`} class="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-600">Cancel</a>
			</div>
			{#if saved}
				<p class="text-xs font-bold text-green-600">Changes staged for {biz.id}. Connect this form to API action when backend is ready.</p>
			{/if}
		</form>
	{:else}
		<p class="text-sm font-bold text-gray-500">Unknown business ID: {$page.params.id}</p>
	{/if}
</div>

<style>
	.field {
		width: 100%;
		border-radius: 0.875rem;
		border: 1px solid #e5e7eb;
		padding: 0.75rem 0.9rem;
		font-size: 0.875rem;
		font-weight: 700;
		outline: none;
	}
</style>
