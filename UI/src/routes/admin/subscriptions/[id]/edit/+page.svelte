<script>
	import { page } from '$app/stores';

	const plans = [
		{ id: 'PLAN-001', name: 'Basic', price: 299, duration: 30, reach: '2km', adTypes: ['In-App Banner'] },
		{ id: 'PLAN-002', name: 'Standard', price: 599, duration: 30, reach: '5km', adTypes: ['In-App Banner', 'Push Notification'] },
		{ id: 'PLAN-003', name: 'Pro', price: 999, duration: 30, reach: '10km', adTypes: ['In-App Banner', 'Push Notification', 'WhatsApp'] }
	];

	const plan = $derived(plans.find((item) => item.id === $page.params.id));
	let form = $state({ name: '', price: 0, duration: 30, reach: '', adTypes: '' });
	let saved = $state(false);

	$effect(() => {
		if (plan) {
			form = { name: plan.name, price: plan.price, duration: plan.duration, reach: plan.reach, adTypes: plan.adTypes.join(', ') };
		}
	});

	function save(e) {
		e.preventDefault();
		saved = true;
	}
</script>

<div class="mx-auto w-full max-w-3xl p-6 md:p-10">
	{#if plan}
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Subscription Plan Editor</p>
		<h1 class="mt-1 text-3xl font-black text-gray-900 dark:text-white">Edit {plan.id}</h1>
		<form onsubmit={save} class="mt-6 space-y-4 rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
			<input class="field" bind:value={form.name} placeholder="Plan name" required />
			<input class="field" bind:value={form.price} type="number" min="1" placeholder="Price" required />
			<input class="field" bind:value={form.duration} type="number" min="1" placeholder="Duration" required />
			<input class="field" bind:value={form.reach} placeholder="Reach" required />
			<input class="field" bind:value={form.adTypes} placeholder="Ad types comma separated" required />
			<div class="flex items-center gap-3">
				<button type="submit" class="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white">Save</button>
				<a href="/admin/subscriptions" class="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-600">Back</a>
			</div>
			{#if saved}<p class="text-xs font-bold text-green-600">Plan {plan.id} updated in UI state.</p>{/if}
		</form>
	{:else}
		<p class="text-sm font-bold text-gray-500">Unknown plan ID: {$page.params.id}</p>
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
