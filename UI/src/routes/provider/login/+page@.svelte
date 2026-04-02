<script>
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { loginBusiness } from '$lib/helpers/authApi.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';

	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMsg = $state('');
	let isPending = $state(false);
	let attempts = $state(0);
	let locked = $state(false);
	let lockTimer = $state(0);
	let lockInterval;

	const MAX_ATTEMPTS = 5;
	const LOCK_SECONDS = 120;

	function startLockCountdown(seconds = LOCK_SECONDS) {
		locked = true;
		lockTimer = seconds;
		if (lockInterval) clearInterval(lockInterval);
		lockInterval = setInterval(() => {
			lockTimer -= 1;
			if (lockTimer <= 0) {
				clearInterval(lockInterval);
				lockInterval = null;
				locked = false;
				attempts = 0;
			}
		}, 1000);
	}

	async function handleLogin(e) {
		if (e) e.preventDefault();
		if (locked) return;

		loading = true;
		errorMsg = '';

		try {
			const cleanId = identifier.trim();
			let detectMode = 'username';
			
			if (cleanId.includes('@')) {
				detectMode = 'email';
			} else if (/^\d+$/.test(cleanId) && cleanId.length >= 10) {
				detectMode = 'mobile';
			}

			const credentials = {
				password,
				[detectMode]: cleanId
			};

			const response = await loginBusiness(credentials);
			setAuthFromResponse(response, 'provider');
			goto('/provider/inventory');
		} catch (err) {
			console.error('Business login error:', err);

			if (err?.status === 403 && err?.message?.toLowerCase().includes('pending')) {
				isPending = true;
				return;
			}

			attempts += 1;
			if (attempts >= MAX_ATTEMPTS) {
				startLockCountdown();
				errorMsg = `Too many failed attempts. Please try again in ${LOCK_SECONDS} seconds.`;
			} else {
				if (err?.name === 'TypeError' && (err?.message?.includes('fetch') || err?.message?.includes('NetworkError'))) {
					errorMsg = `CONNECTION ERROR: The browser could not connect to the API at ${PUBLIC_API_BASE_URL}. Trust the certificate.`;
				} else if (err?.status === 403) {
					errorMsg = err?.message || 'Access restricted.';
				} else if (err?.status === 401) {
					errorMsg = err?.message || 'Invalid credentials';
				} else {
					errorMsg = err?.message || 'Something went wrong.';
				}
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Business Login — NearBuy Business</title>
</svelte:head>

<div class="provider-bg flex min-h-screen">
	<!-- Decorative panel (desktop) -->
	<div class="relative order-2 hidden w-100 flex-col justify-between overflow-hidden p-12 lg:flex">
		<div class="deco-circle deco-c1"></div>
		<div class="deco-circle deco-c2"></div>

		<div class="relative z-10 flex justify-end">
			<a href="/" class="text-3xl font-black">
				<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
			</a>
		</div>

		<div class="relative z-10">
			<div class="mb-4 text-6xl text-orange-500"><Icon icon="mdi:store" /></div>
			<h2 class="mb-3 text-3xl font-black text-white leading-snug">Grow Your<br />Local Business.</h2>
			<p class="text-sm text-gray-400">Manage catalog and respond to customers from one dashboard.</p>
		</div>
		<p class="relative z-10 text-right text-xs text-gray-600">Business Portal v2.0</p>
	</div>

	<!-- Login area -->
	<div class="order-1 flex flex-1 items-center justify-center px-4 py-12">
		<div class="w-full max-w-md">
			<div class="form-card rounded-3xl p-8">
				{#if isPending}
					<div class="text-center space-y-6 py-4">
						<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl text-blue-500 animate-pulse">
							<Icon icon="mdi:clock-check-outline" />
						</div>
						<div class="space-y-2">
							<h1 class="text-2xl font-black text-white">Verification Pending</h1>
							<p class="text-sm text-gray-400">Your account is awaiting approval from the **Super Admin**. You will receive an email once activated.</p>
						</div>
						<button onclick={() => isPending = false} class="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg hover:bg-blue-500 transition-all">Return to Login</button>
					</div>
				{:else}
					<div class="mb-6">
						<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl text-blue-500"><Icon icon="mdi:store" /></div>
						<h1 class="text-2xl font-bold text-white">Business Login</h1>
						<p class="text-sm text-gray-400">Access your business dashboard</p>
					</div>

					<form onsubmit={handleLogin} class="space-y-4">
						{#if errorMsg}
							<div class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300 flex items-start gap-2">
								<Icon icon="mdi:alert-box" class="text-lg shrink-0" />
								<span>{errorMsg}</span>
							</div>
						{/if}

						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-400" for="prov-id">Email / Mobile / Username</label>
							<input id="prov-id" type="text" bind:value={identifier} class="input-field focus:border-blue-500" required />
						</div>

						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-400" for="prov-pass">Password</label>
							<div class="relative">
								<input id="prov-pass" type={showPassword ? 'text' : 'password'} bind:value={password} class="input-field focus:border-blue-500 pr-10" required />
								<button type="button" onclick={() => (showPassword = !showPassword)} class="absolute top-1/2 right-3 -translate-y-1/2 text-xl text-gray-500 hover:text-gray-300">
									<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
								</button>
							</div>
						</div>

						<button type="submit" disabled={loading} class="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg hover:bg-blue-500 disabled:opacity-70 transition-all">
							{#if loading}<Icon icon="mdi:loading" class="animate-spin inline mr-2" /> Signing in…{:else}Sign In{/if}
						</button>
					</form>

					<div class="mt-8 border-t border-gray-800 pt-6 text-center space-y-3">
						<p class="text-sm text-gray-500">New business? <a href="/provider/register" class="font-semibold text-blue-400 hover:underline">Register</a></p>
						<p class="text-xs text-gray-600">Looking to shop? <a href="/user/login" class="text-orange-400 hover:underline">User Login</a></p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.provider-bg { background: #030712; min-height: 100vh; }
	.order-2 { background: linear-gradient(135deg, #0f172a 0%, #0a0a1a 100%); border-left: 1px solid rgba(59, 130, 246, 0.1); }
	.deco-circle { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.2; pointer-events: none; }
	.deco-c1 { width: 300px; height: 300px; background: #3b82f6; top: -80px; left: -80px; }
	.deco-c2 { width: 200px; height: 200px; background: #6366f1; bottom: 80px; right: -40px; }
	.form-card { background: rgba(17, 24, 39, 0.9); border: 1px solid rgba(59, 130, 246, 0.1); backdrop-filter: blur(16px); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); }
	.input-field { width: 100%; border-radius: 0.75rem; border: 1px solid #374151; background: rgba(31, 41, 55, 0.7); padding: 0.75rem 1rem; color: white; font-size: 0.875rem; transition: border-color 0.2s; outline: none; }
	.input-field:focus { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
</style>
