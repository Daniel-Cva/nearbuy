<script>
	let otp = $state(['', '', '', '', '', '']);
	let error = $state('');

	function handleInput(i, e) {
		const val = e.target.value.replace(/\D/g, '');
		otp[i] = val.slice(-1);
		if (val && i < 5) {
			document.getElementById(`otp-${i + 1}`)?.focus();
		}
	}

	function handleKeyDown(i, e) {
		if (e.key === 'Backspace' && !otp[i] && i > 0) {
			document.getElementById(`otp-${i - 1}`)?.focus();
		}
	}

	function handleVerify(e) {
		e.preventDefault();
		const code = otp.join('');
		if (code.length < 6) {
			error = 'Please enter all 6 digits.';
			return;
		}
		window.location.href = '/reset-password';
	}
</script>

<svelte:head>
	<title>Verify OTP — NearBuy</title>
	<meta
		name="description"
		content="Enter the OTP sent to your email or phone to verify your NearBuy account."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a href="/" class="text-4xl font-black"
				><span class="text-white">Near</span><span class="text-orange-500">Buy</span></a
			>
		</div>

		<div class="rounded-2xl border border-gray-800 bg-gray-900 p-8">
			<div class="mb-6 text-center">
				<div class="mb-3 text-4xl">🔒</div>
				<h1 class="text-xl font-bold text-white">Enter Verification Code</h1>
				<p class="mt-1 text-sm text-gray-400">We sent a 6-digit code to your email/phone.</p>
			</div>

			<form onsubmit={handleVerify}>
				<div class="mb-6 flex justify-center gap-3">
					{#each otp as digit, i}
						<input
							id={`otp-${i}`}
							type="text"
							inputmode="numeric"
							maxlength="1"
							value={digit}
							oninput={(e) => handleInput(i, e)}
							onkeydown={(e) => handleKeyDown(i, e)}
							class="h-12 w-12 rounded-xl border border-gray-700 bg-gray-800 text-center text-xl font-bold text-white transition-colors focus:border-orange-500 focus:outline-none"
						/>
					{/each}
				</div>

				{#if error}<p class="mb-4 text-center text-sm text-red-400">{error}</p>{/if}

				<button
					id="btn-verify-otp"
					type="submit"
					class="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition-all hover:bg-orange-400"
				>
					Verify Code
				</button>
			</form>

			<div class="mt-6 text-center text-sm text-gray-500">
				Didn't receive it? <button class="ml-1 text-orange-400 hover:text-orange-300"
					>Resend OTP</button
				>
			</div>
		</div>
	</div>
</div>
