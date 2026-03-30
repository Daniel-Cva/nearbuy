<script>
	let email = $state('');
	let submitted = $state(false);

	function handleSubmit(e) {
		e.preventDefault();
		submitted = true;
	}
</script>

<svelte:head>
	<title>Forgot Password — NearBuy</title>
	<meta name="description" content="Reset your NearBuy account password." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href="/" class="text-4xl font-black"
				><span class="text-white">Near</span><span class="text-orange-500">Buy</span></a
			>
			<p class="mt-2 text-gray-400">Reset your password</p>
		</div>

		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-8">
			{#if !submitted}
				<div class="mb-6 text-center">
					<div class="mb-3 text-4xl">🔑</div>
					<h1 class="text-xl font-bold text-white">Forgot Password?</h1>
					<p class="mt-1 text-sm text-gray-400">
						Enter your registered email or phone number and we'll send you an OTP.
					</p>
				</div>
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label class="mb-1 block text-sm text-gray-400" for="forgot-email">Email or Phone</label
						>
						<input
							id="forgot-email"
							type="text"
							bind:value={email}
							placeholder="you@example.com"
							class="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none"
							required
						/>
					</div>
					<button
						id="btn-send-otp"
						type="submit"
						class="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition-all hover:bg-orange-400"
					>
						Send OTP
					</button>
				</form>
			{:else}
				<div class="text-center">
					<div class="mb-3 text-4xl">📨</div>
					<h2 class="mb-2 text-xl font-bold text-white">OTP Sent!</h2>
					<p class="mb-6 text-sm text-gray-400">
						We've sent an OTP to <span class="text-white">{email}</span>. Check your inbox or SMS.
					</p>
					<a
						href="/verify-otp"
						class="block w-full rounded-xl bg-orange-500 py-3 text-center font-semibold text-white transition-all hover:bg-orange-400"
						>Verify OTP</a
					>
				</div>
			{/if}

			<div class="mt-6 text-center text-sm text-gray-500">
				Remember your password? <a href="/user/login" class="ml-1 text-orange-400 hover:text-orange-300"
					>Sign in</a
				>
			</div>
		</div>
	</div>
</div>
