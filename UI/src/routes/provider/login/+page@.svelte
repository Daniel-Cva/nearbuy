<script>
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { loginBusiness } from '$lib/helpers/authApi.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';

	let loginMode = $state('email'); // 'email' | 'mobile' | 'username'
	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMsg = $state('');
	let attempts = $state(0);
	let locked = $state(false);
	let lockTimer = $state(0);
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
	 * Handle business/provider login
	 * Calls /api/auth/business/login endpoint
	 * Supports email, mobile, or username
	 */
	async function handleLogin(e) {
		if (e) e.preventDefault();
		if (locked) return;

		loading = true;
		errorMsg = '';

		try {
			// Auto-detect identifier type
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

			console.log(`[Provider Login] Mode detected: ${detectMode}`, credentials);

			// Call API
			const response = await loginBusiness(credentials);

			// Check for pending status
			const bizStatus = response?.business?.status || response?.profile?.status || response?.status;
			if (bizStatus === 'pending' || bizStatus === 'PENDING') {
				// Immediately revoke the newly created session cookie if they are pending
				await fetch(`${PUBLIC_API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
				throw { status: 403, message: 'Your business is currently pending admin approval. You cannot log in until it is approved.' };
			}

			// Update global auth state using normalized response
			setAuthFromResponse(response, 'provider');

			// Navigate to provider dashboard
			goto('/provider/dashboard');
		} catch (err) {
			console.error('Business login error:', err);

			attempts += 1;
			if (attempts >= MAX_ATTEMPTS) {
				startLockCountdown();
				errorMsg = `Too many failed attempts. Please try again in ${LOCK_SECONDS} seconds.`;
			} else {
				// Handle different error types
			if (err?.name === 'TypeError' && (err?.message?.includes('fetch') || err?.message?.includes('NetworkError'))) {
					errorMsg = `CONNECTION ERROR: The browser could not connect to the API at ${PUBLIC_API_BASE_URL}. This is usually because the SSL certificate is untrusted or CORS is blocked.`;
				} else if (err?.status === 403) {
					// Business account restrictions
					errorMsg = err?.message || 'Your business account access is restricted. Contact support.';
				} else if (err?.status === 401) {
					errorMsg = err?.message || 'Invalid credentials';
				} else if (err?.status === 400) {
					errorMsg = err?.message || 'Invalid login format or business data.';
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

</script>


<svelte:head>
	<title>Business Login — NearBuy Business</title>
	<meta
		name="description"
		content="Sign in to your NearBuy business account and manage your shop."
	/>
</svelte:head>

<div class="provider-bg flex min-h-screen">
	<!-- Right decorative panel (desktop) -->
	<div
		class="relative order-2 hidden w-100 flex-col justify-between overflow-hidden p-12 lg:flex"
	>
		<div class="deco-circle deco-c1"></div>
		<div class="deco-circle deco-c2"></div>

		<div class="relative z-10 flex justify-end">
			<a href="/" class="text-3xl font-black">
				<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
			</a>
		</div>

		<div class="relative z-10">
			<div class="mb-4 text-6xl text-orange-500">
				<Icon icon="mdi:store" />
			</div>
			<h2 class="mb-3 text-3xl leading-snug font-black text-white">
				Grow Your<br />Local Business.
			</h2>
			<p class="text-sm leading-relaxed text-gray-400">
				Manage inventory, respond to requirements, track quotes, and connect with customers — all
				from one dashboard.
			</p>

			<div class="mt-8 grid grid-cols-2 gap-3">
				{#each [{ icon: 'mdi:package-variant-closed', label: 'Inventory Mgmt' }, { icon: 'mdi:chat', label: 'Quote Responses' }, { icon: 'mdi:view-dashboard', label: 'Analytics' }, { icon: 'mdi:account-group', label: 'Founder Network' }] as feature}
					<div class="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3">
						<div class="mb-1 text-2xl text-blue-400">
							<Icon icon={feature.icon} />
						</div>
						<p class="text-xs font-medium text-gray-300">{feature.label}</p>
					</div>
				{/each}
			</div>
		</div>

		<p class="relative z-10 text-right text-xs text-gray-600">Business Portal v2.0</p>
	</div>

	<!-- Left / Main Panel -->
	<div class="order-1 flex flex-1 items-center justify-center px-4 py-12">
		<div class="w-full max-w-md">
			<!-- Mobile logo -->
			<div class="mb-8 text-center lg:hidden">
				<a href="/" class="text-4xl font-black">
					<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
				</a>
				<p class="mt-1 text-sm font-medium text-blue-400">Business Portal</p>
			</div>

			<div class="form-card rounded-3xl p-8">
				<!-- Header -->
				<div class="mb-6">
					<div
						class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl text-blue-500"
					>
						<Icon icon="mdi:store" />
					</div>
					<div class="mb-1 flex items-center gap-2">
						<h1 class="text-2xl font-bold text-white">Business Login</h1>
						<span
							class="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400"
							>Business</span
						>
					</div>
					<p class="text-sm text-gray-400">Access your business dashboard</p>
				</div>

				<form onsubmit={handleLogin} class="space-y-4">
					{#if errorMsg}
						<div class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300 flex flex-col gap-2">
							<div class="flex items-start gap-2">
								<Icon icon="mdi:alert-box" class="text-lg shrink-0" />
								<span>{errorMsg}</span>
							</div>

							{#if errorMsg.includes('CONNECTION ERROR')}
								<div class="mt-1 border-t border-red-500/10 pt-2 flex flex-col gap-2">
									<p class="text-[10px] text-gray-400 font-normal">If you are using a self-signed cert on an IP, click below to open the API URL and click "Proceed" or "Advanced" in the new tab to trust it.</p>
									<a 
										href={PUBLIC_API_BASE_URL} 
										target="_blank" 
										class="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors py-1"
									>
										<Icon icon="mdi:open-in-new" /> Fix SSL / Open API Base URL
									</a>
								</div>
							{/if}
						</div>
					{/if}

					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-400" for="prov-email"
							>Business Email / Mobile / Username</label
						>
						<input
							id="prov-email"
							type="text"
							bind:value={identifier}
							placeholder="business@example.com or 9876543210 or dani_biz123"
							class="input-field focus:shadow-blue focus:border-blue-500"
							required
						/>
					</div>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-400" for="prov-password"
							>Password</label
						>
						<div class="relative">
							<input
								id="prov-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="••••••••"
								class="input-field focus:shadow-blue pr-11 focus:border-blue-500"
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

					<div class="flex items-center justify-between">
						<label class="flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="rounded border-gray-600" />
							<span class="text-xs text-gray-400">Keep me signed in</span>
						</label>
						<a href="/forgot-password" class="text-xs text-blue-400 hover:underline"
							>Forgot password?</a
						>
					</div>

					<button
						id="btn-provider-login"
						type="submit"
						disabled={loading}
						class={`w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
					>
						{#if loading}
							<span class="flex items-center justify-center gap-2">
								<Icon icon="mdi:loading" class="animate-spin" /> Signing in…
							</span>
						{:else}
							Sign In to Dashboard
						{/if}
					</button>
				</form>

				<div class="mt-8 border-t border-gray-800 pt-6 space-y-3">
					<p class="text-center text-sm text-gray-500">
						New business?
						<a href="/provider/register" class="ml-1 font-semibold text-blue-400 hover:underline"
							>Register your shop</a
						>
					</p>
					<p class="text-center text-xs text-gray-600">
						Looking to shop?
						<a href="/user/login" class="ml-1 text-orange-400 hover:underline">User Login</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.provider-bg {
		background: #030712;
		min-height: 100vh;
	}

	.order-2 {
		background: linear-gradient(135deg, #0f172a 0%, #0a0a1a 100%);
		border-left: 1px solid rgba(59, 130, 246, 0.1);
	}

	.deco-circle {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		opacity: 0.2;
		pointer-events: none;
	}

	.deco-c1 {
		width: 300px;
		height: 300px;
		background: #3b82f6;
		top: -80px;
		left: -80px;
	}

	.deco-c2 {
		width: 200px;
		height: 200px;
		background: #6366f1;
		bottom: 80px;
		right: -40px;
	}

	.form-card {
		background: rgba(17, 24, 39, 0.9);
		border: 1px solid rgba(59, 130, 246, 0.1);
		backdrop-filter: blur(16px);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	.input-field {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid #374151;
		background: rgba(31, 41, 55, 0.7);
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

	.input-field.focus\:shadow-blue:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
	}

	.input-field:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
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
