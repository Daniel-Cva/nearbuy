<script>
	import { page } from '$app/stores';

	const ads = [
		{ id: 'AD-001', business: 'Krishna Electronics', type: 'In-App Banner', range: '5km', status: 'active', plan: 'Pro', expires: '2026-04-01' },
		{ id: 'AD-002', business: 'Lakshmi Grocery', type: 'Push Notification', range: '2km', status: 'active', plan: 'Basic', expires: '2026-03-15' },
		{ id: 'AD-003', business: 'Meera Tailors', type: 'WhatsApp', range: '3km', status: 'paused', plan: 'Standard', expires: '2026-03-20' }
	];

	const ad = $derived(ads.find((item) => item.id === $page.params.id));
	let form = $state({ business: '', type: 'In-App Banner', range: '2km', status: 'active', plan: 'Basic', expires: '' });
	let saved = $state(false);

	$effect(() => {
		if (ad) {
			form = { business: ad.business, type: ad.type, range: ad.range, status: ad.status, plan: ad.plan, expires: ad.expires };
		}
	});

	function save(e) {
		e.preventDefault();
		saved = true;
	}
</script>

<div class="mx-auto w-full max-w-3xl p-6 md:p-10">
	{#if ad}
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Advertisement Editor</p>
		<h1 class="mt-1 text-3xl font-black text-gray-900 dark:text-white">Edit {ad.id}</h1>
		<form onsubmit={save} class="mt-6 space-y-4 rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
			<input class="field" bind:value={form.business} placeholder="Business" required />
			<select class="field" bind:value={form.type}><option>In-App Banner</option><option>Push Notification</option><option>WhatsApp</option></select>
			<input class="field" bind:value={form.range} placeholder="Reach range" required />
			<select class="field" bind:value={form.status}><option value="active">Active</option><option value="paused">Paused</option><option value="expired">Expired</option></select>
			<select class="field" bind:value={form.plan}><option>Basic</option><option>Standard</option><option>Pro</option></select>
			<input class="field" bind:value={form.expires} type="date" required />
			<div class="flex items-center gap-3">
				<button type="submit" class="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white">Save</button>
				<a href="/admin/advertisements" class="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-600">Back</a>
			</div>
			{#if saved}<p class="text-xs font-bold text-green-600">Ad {ad.id} updated in UI state.</p>{/if}
		</form>
	{:else}
		<p class="text-sm font-bold text-gray-500">Unknown advertisement ID: {$page.params.id}</p>
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
	}
</style>
