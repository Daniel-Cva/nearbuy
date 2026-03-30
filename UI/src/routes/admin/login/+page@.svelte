<script>
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';
	import { loginAdmin } from '$lib/helpers/authApi.js';

	let loginMode = $state('email'); // 'email' | 'mobile'
	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let step = $state('login'); // 'login' | 'mfa'
	let mfaCode = $state('');
	let attempts = $state(0);
	let locked = $state(false);
	let lockTimer = $state(0);
	let errorMsg = $state('');
	let lockInterval;

	const MAX_ATTEMPTS = 5;
	const LOCK_SECONDS = 120;

	/**
	 * Start account lockout after too many failed attempts
	 */
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

	/**
	 * Handle admin login
	 * Calls /api/auth/admin/login endpoint
	 * Admin login only accepts email (not mobile or username)
	 */
	async function handleLogin(e) {
		if (e) e.preventDefault();
		if (locked) return;

		loading = true;
		errorMsg = '';

		try {
			const data = await loginAdmin({
				password,
				...(loginMode === 'email' ? { email: identifier } : { mobile: identifier })
			});
			console.log('Admin login response:', data);

			if (data.login_status === 'success') {
				// Use the central auth store to manage session state in-memory
				// The backend handles the cookie via credentials: 'include'
				setAuthFromResponse(data, 'admin');
				
				console.log('Redirecting to dashboard...');
				await goto('/admin/dashboard');
			} else if (data.login_status === 'mfa') {
				step = 'mfa';
			} else {
				throw new Error(data.message || 'Invalid email or password');
			}
		} catch (err) {
			console.error('Admin login error:', err);

			attempts += 1;
			if (attempts >= MAX_ATTEMPTS) {
				startLockCountdown();
				errorMsg = `Too many failed attempts. Please try again in ${LOCK_SECONDS} seconds.`;
			} else {
				// Handle different error types
				if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
					errorMsg = `Cannot connect to API at ${PUBLIC_API_BASE_URL}. Please ensure the backend is running and CORS is enabled.`;
				} else if (err?.status === 401) {
					errorMsg = err?.message || 'Invalid email or password';
				} else if (err?.status === 400) {
					errorMsg = err?.message || 'Invalid login format.';
				} else {
					errorMsg = err?.message || 'Something went wrong. Please try again.';
				}
			}
		} finally {
			loading = false;
		}
	}

	function switchLoginMode(mode) {
		loginMode = mode;
		identifier = '';
		errorMsg = '';
	}

	function handleMfa(e) {
		e.preventDefault();
		loading = true;
		setTimeout(() => goto('/admin/dashboard'), 1000);
	}

	$effect(() => {
		return () => {
			if (lockInterval) clearInterval(lockInterval);
		};
	});
</script>

<svelte:head>
	<title>Super Admin — NearBuy Platform Authority</title>
	<meta name="description" content="Restricted access — NearBuy Super Admin Control Panel." />
</svelte:head>

<div
	class="admin-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
>
	<!-- Animated grid -->
	<div class="grid-overlay"></div>

	<!-- Orbs -->
	<div class="orb orb-1"></div>
	<div class="orb orb-2"></div>

	<div class="relative z-10 w-full max-w-lg">
		<!-- Logo + Badge -->
		<div class="mb-8 text-center">
			<a href="/" class="inline-block">
				<span class="text-5xl font-black">
					<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
				</span>
			</a>
			<div class="mt-3 flex justify-center">
				<div
					class="warning-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
				>
					<span class="pulse-dot"></span>
					<Icon icon="mdi:shield-lock" class="text-base" /> Platform Authority — Restricted Zone
				</div>
			</div>
		</div>

		<!-- Security notice -->
		<div
			class="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3"
		>
			<Icon icon="mdi:alert-box" class="mt-0.5 text-2xl text-yellow-400" />
			<div>
				<p class="mb-0.5 text-xs font-semibold text-yellow-300">Authorized Personnel Only</p>
				<p class="text-xs text-gray-400">
					All access attempts are logged and monitored. Unauthorized access is a violation of
					platform policy.
				</p>
			</div>
		</div>

		<!-- Card -->
		<div class="admin-card overflow-hidden rounded-3xl">
			<!-- Top accent bar -->
			<div class="h-1 w-full bg-linear-to-r from-red-700 via-red-500 to-orange-500"></div>

			<div class="p-8">
				{#if step === 'login'}
					<div class="mb-6">
						<div class="mb-3 flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl text-red-500"
							>
								<Icon icon="mdi:shield-lock" />
							</div>
							<div>
								<h1 class="text-xl font-bold text-white">Super Admin Login</h1>
								<p class="text-xs text-gray-400">Control Panel — Tier 1 Access</p>
							</div>
						</div>
					</div>

					<form onsubmit={handleLogin} class="space-y-4">
						{#if errorMsg}
							<div class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300">
								{errorMsg}
							</div>
						{/if}

						{#if locked}
							<div class="rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-xs font-semibold text-yellow-200">
								Too many failed attempts. Try again in {lockTimer}s.
							</div>
						{/if}

						<div>
							<div class="mb-2 flex items-center justify-between gap-2">
								<label class="block text-sm font-medium text-gray-400" for="admin-identifier">
									{loginMode === 'email' ? 'Admin Email' : 'Admin Mobile'}
									<span class="ml-1 text-xs text-red-400">*</span>
								</label>
								<div class="inline-flex rounded-lg border border-gray-700 bg-gray-900/70 p-0.5 text-xs font-semibold">
									<button
										type="button"
										onclick={() => switchLoginMode('email')}
										class={`rounded-md px-2.5 py-1 transition-colors ${loginMode === 'email' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
									>
										Email
									</button>
									<button
										type="button"
										onclick={() => switchLoginMode('mobile')}
										class={`rounded-md px-2.5 py-1 transition-colors ${loginMode === 'mobile' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
									>
										Mobile
									</button>
								</div>
							</div>
							<label class="sr-only" for="admin-identifier">
								{loginMode === 'email' ? 'Admin Email' : 'Admin Mobile'}
								<span class="ml-1 text-xs text-red-400">*</span>
							</label>
							<div class="relative">
								<input
									id="admin-identifier"
									type={loginMode === 'email' ? 'email' : 'tel'}
									inputmode={loginMode === 'email' ? 'email' : 'numeric'}
									bind:value={identifier}
									placeholder={loginMode === 'email' ? 'admin@nearbuy.in' : '9876543210'}
									class="input-field focus:border-red-500"
									required
								/>
								<span class="absolute top-1/2 right-3 -translate-y-1/2 text-lg text-gray-600">
									<Icon icon={loginMode === 'email' ? 'mdi:email' : 'mdi:cellphone'} />
								</span>
							</div>
						</div>

						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-400" for="admin-password">
								Password
								<span class="ml-1 text-xs text-red-400">*</span>
							</label>
							<div class="relative">
								<input
									id="admin-password"
									type={showPassword ? 'text' : 'password'}
									bind:value={password}
									placeholder="••••••••••••"
									class="input-field pr-11 focus:border-red-500"
									required
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute top-1/2 right-3 -translate-y-1/2 text-xl text-gray-500 transition-colors hover:text-gray-300"
								>
									<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
								</button>
							</div>
						</div>

						<button
							id="btn-admin-login"
							type="submit"
							disabled={loading || locked}
							class={`w-full rounded-xl py-3.5 font-bold text-white transition-all duration-200 ${locked ? 'cursor-not-allowed bg-gray-700' : 'bg-linear-to-r from-red-700 to-red-500 shadow-lg shadow-red-900/30 hover:scale-[1.01] hover:from-red-600 hover:to-red-400 active:scale-[0.99]'} ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
						>
							{#if loading}
								<span class="flex items-center justify-center gap-2">
									<Icon icon="mdi:loading" class="animate-spin" /> Authenticating…
								</span>
							{:else if locked}
								<span class="flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest">
									<Icon icon="mdi:lock" /> Account Temporarily Locked
								</span>
							{:else}
								Access Control Panel
							{/if}
						</button>
					</form>

					<p class="mt-5 text-center text-xs text-gray-600">
						Not an admin? Go to
						<a href="/user/login" class="text-gray-400 transition-colors hover:text-orange-400">
							user login</a
						>
						<span class="mx-1">·</span>
						<a href="/provider/login" class="text-gray-400 transition-colors hover:text-orange-400">
							business login</a
						>
					</p>
				{:else}
					<!-- MFA Step -->
					<div class="mb-6">
						<div class="mb-3 flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-2xl text-green-500"
							>
								<Icon icon="mdi:lock-check" />
							</div>
							<div>
								<h1 class="text-xl font-bold text-white">Multi-Factor Auth</h1>
								<p class="text-xs text-gray-400">Step 2 of 2 — Identity Verification</p>
							</div>
						</div>
						<p class="text-sm text-gray-400">
							Enter the 6-digit TOTP code from your authenticator app, or the code sent to <span
								class="font-medium text-white">{identifier}</span
							>.
						</p>
					</div>

					<form onsubmit={handleMfa} class="space-y-4">
						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-400" for="admin-mfa">
								Authentication Code
							</label>
							<input
								id="admin-mfa"
								type="text"
								bind:value={mfaCode}
								placeholder="000 000"
								maxlength="6"
								class="input-field text-center font-mono text-2xl tracking-[0.8em] focus:border-green-500"
								required
							/>
						</div>

						<button
							id="btn-admin-verify"
							type="submit"
							disabled={loading}
							class={`w-full rounded-xl bg-linear-to-r from-green-700 to-green-500 py-3.5 font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:from-green-600 hover:to-green-400 ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
						>
							{loading ? 'Verifying Identity…' : 'Confirm & Enter Control Panel'}
						</button>

						<button
							type="button"
							onclick={() => {
								step = 'login';
								loading = false;
							}}
							class="w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-400 transition-all hover:bg-gray-800"
						>
							← Cancel — Back to Login
						</button>
					</form>

					<div class="mt-5 flex items-center gap-2 rounded-xl bg-gray-800/50 px-4 py-3">
						<Icon icon="mdi:clock-outline" class="text-yellow-400" />
						<p class="text-xs text-gray-400">
							This session will expire in <span class="font-medium text-white">15 minutes</span> of inactivity.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<p class="mt-5 text-center text-xs text-gray-700">
			NearBuy Platform Authority · Internal Use Only · v2.0
		</p>
	</div>
</div>

<style>
	.admin-bg {
		background: #030712;
	}

	.grid-overlay {
		position: fixed;
		inset: 0;
		background-image:
			linear-gradient(rgba(220, 38, 38, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(220, 38, 38, 0.04) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
	}

	.orb {
		position: fixed;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.12;
		pointer-events: none;
	}

	.orb-1 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #dc2626, transparent 70%);
		top: -200px;
		left: -200px;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, #7f1d1d, transparent 70%);
		bottom: -100px;
		right: -100px;
	}

	.warning-badge {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.08);
		color: #fca5a5;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #ef4444;
		animation: pulse 1.5s ease-in-out infinite;
		display: inline-block;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.8);
		}
	}

	.admin-card {
		background: rgba(17, 24, 39, 0.95);
		border: 1px solid rgba(220, 38, 38, 0.15);
		backdrop-filter: blur(20px);
		box-shadow:
			0 30px 70px rgba(0, 0, 0, 0.7),
			0 0 0 1px rgba(255, 255, 255, 0.03),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.input-field {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid #374151;
		background: rgba(31, 41, 55, 0.6);
		padding: 0.75rem 1rem;
		color: white;
		font-size: 0.875rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		outline: none;
	}

	.input-field::placeholder {
		color: #4b5563;
	}

	.input-field:focus {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
	}

	.loader-sm {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
