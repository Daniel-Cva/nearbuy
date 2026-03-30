<script>
	import { getCurrentProfile } from '$lib/stores/auth.svelte.js';

	// Get business from profile (if logged in) OR from pending registration data
	let profile = $derived(getCurrentProfile() || {});
	let pendingData = $state(typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('pendingBusinessData') || '{}') : {});
	let biz = $derived(Object.keys(profile).length > 0 ? profile : pendingData);
	
	let isApproved = $derived(biz.status === 'approved' || biz.IsVerified === 1);
	let isPending = $derived(biz.status === 'pending' || biz.IsVerified === 0);
	let dateSubmitted = $derived((biz.createdAt || biz.created_at || new Date().toISOString()).slice(0, 10));

	function handleBackToLogin() {
		// Clear pending registration data when user navigates back
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('pendingBusinessData');
		}
		window.location.href = '/provider/login';
	}
</script>

<svelte:head>
	<title>Verification Status — NearBuy</title>
	<meta
		name="description"
		content="Check the status of your business verification request on NearBuy."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 text-gray-900 dark:text-white pb-20 md:pb-0">
	<div class="w-full max-w-md text-center">
		<a href="/" class="mb-10 block text-4xl font-black drop-shadow-sm"
			><span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span></a
		>

		<div class="rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-8 shadow-sm">
			{#if isApproved}
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-5xl dark:border-green-500/30 dark:bg-green-500/10 shadow-inner"
				>
					✅
				</div>
				<h1 class="mb-3 text-2xl font-black text-gray-900 dark:text-white">Approved!</h1>
				<p class="mb-8 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
					Your business "{biz.name}" has been verified. You can now start managing your store.
				</p>
				<a href="/provider/home" oneclick={() => { if (typeof localStorage !== 'undefined') localStorage.removeItem('pendingBusinessData'); }} class="block w-full rounded-2xl bg-orange-500 py-4 text-center font-black text-white shadow-xl shadow-orange-500/20 active:scale-95">Go to Dashboard</a>
			{:else}
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-yellow-200 bg-yellow-100 text-5xl dark:border-yellow-500/30 dark:bg-yellow-500/10 shadow-inner"
				>
					⏳
				</div>
				<h1 class="mb-3 text-2xl font-black text-gray-900 dark:text-white">Under Review</h1>
				<p class="mb-8 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
					Your business verification documents for "{biz.name || 'your business'}" are currently being reviewed by
					our team. This usually takes 1–2 business days.
				</p>

			<!-- Timeline -->
			<div class="mb-10 space-y-5 text-left bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
				<div class="flex items-center gap-4 relative">
					<div class="absolute left-4 top-8 -bottom-5 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white shadow-sm ring-4 ring-gray-50 dark:ring-gray-800/50 z-10"
					>
						✓
					</div>
					<div>
						<p class="text-sm font-bold text-gray-900 dark:text-white">Documents Submitted</p>
						<p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">2026-03-03 at 10:30 AM</p>
					</div>
				</div>
				<div class="flex items-start gap-4 relative">
					<div class="absolute left-4 top-8 -bottom-5 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-sm shadow-sm ring-4 ring-gray-50 dark:border-yellow-500/50 dark:bg-yellow-500/20 dark:ring-gray-800/50 z-10"
					>
						⏳
					</div>
					<div>
						<p class="text-sm font-bold text-yellow-600 dark:text-yellow-400">Under Review</p>
						<p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Platform Authority is reviewing your application</p>
					</div>
				</div>
				<div class="flex items-start gap-4 relative">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-sm text-gray-400 ring-4 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-800/50 z-10"
					>
						○
					</div>
					<div>
						<p class="text-sm font-bold text-gray-400 dark:text-gray-500">Approved & Active</p>
						<p class="text-xs font-medium text-gray-400 dark:text-gray-600 mt-0.5">You'll be notified via email and SMS</p>
					</div>
				</div>
			</div>

			<p class="mb-5 text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-500">
				Reference ID: <span class="font-mono text-gray-900 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md ml-1">APP-20260303-0042</span>
			</p>
			<button
				onclick={handleBackToLogin}
				class="block w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 py-3.5 font-bold text-gray-600 dark:text-gray-400 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-white active:scale-95"
				>Back to Login</button
			>
			{/if}
		</div>
	</div>
</div>

