<script>
	import { goto } from '$app/navigation';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';

	let loginType = $state('email'); // 'email' | 'mobile'
	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMsg = $state('');

	async function handleLogin(e) {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		console.log('[Login Flow started] -> Type:', loginType, 'Identifier:', identifier);

		try {
			console.log('[Login API Call] fetching POST /api/auth/user/login');
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/auth/user/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					[loginType]: identifier,
					password
				})
			});

			const data = await res.json();
			console.log('[Login API Response]', { ok: res.ok, status: res.status, data });

			if (res.ok && data.login_status === 'success') {
				console.log('[Login Success] Updating global auth store');
				setAuthFromResponse(data, 'user');
				
				console.log('[Login Navigation] attempting to goto("/user/home")');
				goto('/user/home')
					.then(() => console.log('[Login Navigation] goto("/user/home") promise resolved successfully!'))
					.catch(gotoErr => console.error('[Login Navigation Error]', gotoErr));
			} else {
				console.log('[Login Failed] Server rejection or status!==success');
				throw new Error(data.message || 'Login failed');
			}
		} catch (err) {
			console.error('[Login ExceptionCaught]', err);
			errorMsg = err.message || 'An error occurred during login';
		} finally {
			loading = false;
			console.log('[Login Flow processing completed]');
		}
	}
</script>

<svelte:head>
	<title>User Login — NearBuy</title>
	<meta
		name="description"
		content="Sign in to your NearBuy user account and discover nearby local businesses."
	/>
</svelte:head>

<div class="user-bg flex min-h-screen">
	<!-- Left Panel (desktop) -->
	<div
		class="left-panel relative hidden w-105 flex-col justify-between overflow-hidden p-12 lg:flex"
	>
		<!-- Decorative circles -->
		<div class="deco-circle deco-c1"></div>
		<div class="deco-circle deco-c2"></div>
		<div class="deco-circle deco-c3"></div>

		<a href="/" class="relative z-10 text-4xl font-black">
			<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
		</a>

		<div class="relative z-10">
			<div class="mb-4 text-5xl">🛍️</div>
			<h2 class="mb-3 text-3xl leading-tight font-black text-white">
				Shop Local,<br />Live Local.
			</h2>
			<p class="text-base leading-relaxed text-gray-400">
				Post your requirements and let local businesses compete to serve you. True reverse
				e-commerce, hyper-locally.
			</p>

			<div class="mt-8 space-y-3">
				{#each ['📍 Discover stores within 5km', '🔄 Post needs, get offers', '💬 Chat with local providers', '⭐ Review & rate experiences'] as feature}
					<div class="flex items-center gap-3 text-sm text-gray-300">
						<span>{feature.split(' ')[0]}</span>
						<span>{feature.split(' ').slice(1).join(' ')}</span>
					</div>
				{/each}
			</div>
		</div>

		<p class="relative z-10 text-xs text-gray-600">© 2026 NearBuy</p>
	</div>

	<!-- Right Panel -->
	<div class="flex flex-1 items-center justify-center px-4 py-12">
		<div class="w-full max-w-md">
			<!-- Mobile logo -->
			<div class="mb-8 text-center lg:hidden">
				<a href="/" class="text-4xl font-black">
					<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
				</a>
			</div>

			<div class="form-card rounded-3xl p-8">
				<!-- Header -->
				<div class="mb-6">
					<div
						class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl"
					>
						👤
					</div>
					<h1 class="text-2xl font-bold text-white">User Sign In</h1>
					<p class="mt-1 text-sm text-gray-400">Access your NearBuy account</p>
				</div>

				<!-- Mode Toggle -->
				<div class="mb-6 flex rounded-xl bg-gray-800/60 p-1">
					<button
						id="mode-email"
						onclick={() => (loginType = 'email')}
						class={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginType === 'email' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
					>
						Email
					</button>
					<button
						id="mode-mobile"
						onclick={() => (loginType = 'mobile')}
						class={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginType === 'mobile' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
					>
						Mobile Number
					</button>
				</div>

				{#if errorMsg}
					<div class="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-medium text-red-400 animate-in">
						⚠️ {errorMsg}
					</div>
				{/if}

				<form onsubmit={handleLogin} class="space-y-4">
					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-400" for="user-identifier">
							{loginType === 'email' ? 'Email Address' : 'Mobile Number'}
						</label>
						<input
							id="user-identifier"
							type={loginType === 'email' ? 'email' : 'tel'}
							bind:value={identifier}
							placeholder={loginType === 'email' ? 'you@example.com' : '9876543210'}
							class="input-field focus:border-orange-500"
							required
						/>
					</div>

					<div>
						<label class="mb-1.5 block text-sm font-medium text-gray-400" for="user-password"
							>Password</label
						>
						<div class="relative">
							<input
								id="user-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="••••••••"
								class="input-field pr-11 focus:border-orange-500"
								required
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500 transition-colors hover:text-gray-300"
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<label class="flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="rounded border-gray-600" />
							<span class="text-xs text-gray-400">Remember me</span>
						</label>
						<a href="/forgot-password" class="text-xs text-orange-400 hover:underline"
							>Forgot password?</a
						>
					</div>

					<button
						id="btn-user-login"
						type="submit"
						disabled={loading}
						class={`w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:bg-orange-400 ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
					>
						{#if loading}
							<span class="flex items-center justify-center gap-2">
								<span class="loader-sm"></span> Signing in…
							</span>
						{:else}
							Sign In
						{/if}
					</button>
				</form>

				<p class="mt-6 text-center text-sm text-gray-500">
					New to NearBuy?
					<a href="/user/register" class="ml-1 font-semibold text-orange-400 hover:underline"
						>Create account</a
					>
				</p>

				<p class="mt-3 text-center text-xs text-gray-600">
					Are you a business?
					<a href="/provider/login" class="ml-1 text-blue-400 hover:underline">Business Login</a>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.user-bg {
		background: #030712;
		min-height: 100vh;
	}

	.left-panel {
		background: linear-gradient(135deg, #0f172a 0%, #1a0a00 100%);
		border-right: 1px solid rgba(249, 115, 22, 0.1);
	}

	.deco-circle {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.2;
		pointer-events: none;
	}

	.deco-c1 {
		width: 300px;
		height: 300px;
		background: #f97316;
		top: -80px;
		right: -80px;
	}

	.deco-c2 {
		width: 200px;
		height: 200px;
		background: #fb923c;
		bottom: 100px;
		left: -50px;
	}

	.deco-c3 {
		width: 150px;
		height: 150px;
		background: #fbbf24;
		bottom: -50px;
		right: 50px;
	}

	.form-card {
		background: rgba(17, 24, 39, 0.85);
		border: 1px solid rgba(249, 115, 22, 0.1);
		backdrop-filter: blur(16px);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
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

	.input-field:focus {
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
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
