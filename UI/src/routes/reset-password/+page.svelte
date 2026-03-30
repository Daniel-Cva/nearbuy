<script>
	let password = $state('');
	let confirm = $state('');
	let error = $state('');
	let done = $state(false);

	function handleReset(e) {
		e.preventDefault();
		if (password !== confirm) {
			error = 'Passwords do not match.';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}
		error = '';
		done = true;
	}
</script>

<svelte:head>
	<title>Reset Password — NearBuy</title>
	<meta name="description" content="Set a new password for your NearBuy account." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href="/" class="text-4xl font-black"
				><span class="text-white">Near</span><span class="text-orange-500">Buy</span></a
			>
		</div>

		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-8">
			{#if !done}
				<div class="mb-6 text-center">
					<div class="mb-3 text-4xl">🛡️</div>
					<h1 class="text-xl font-bold text-white">Set New Password</h1>
					<p class="mt-1 text-sm text-gray-400">Choose a strong password for your account.</p>
				</div>
				<form onsubmit={handleReset} class="space-y-4">
					<div>
						<label class="mb-1 block text-sm text-gray-400" for="new-password">New Password</label>
						<input
							id="new-password"
							type="password"
							bind:value={password}
							placeholder="••••••••"
							class="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none"
							required
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-gray-400" for="confirm-password"
							>Confirm Password</label
						>
						<input
							id="confirm-password"
							type="password"
							bind:value={confirm}
							placeholder="••••••••"
							class="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none"
							required
						/>
					</div>
					{#if error}<p class="text-sm text-red-400">{error}</p>{/if}
					<button
						id="btn-reset-password"
						type="submit"
						class="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition-all hover:bg-orange-400"
					>
						Reset Password
					</button>
				</form>
			{:else}
				<div class="text-center">
					<div class="mb-4 text-5xl">✅</div>
					<h2 class="mb-2 text-xl font-bold text-white">Password Updated!</h2>
					<p class="mb-6 text-sm text-gray-400">
						Your password has been successfully changed. You can now sign in.
					</p>
					<a
						href="/user/login"
						class="block w-full rounded-xl bg-orange-500 py-3 text-center font-semibold text-white transition-all hover:bg-orange-400"
						>Go to Login</a
					>
				</div>
			{/if}
		</div>
	</div>
</div>
