<script>
	import { goto } from '$app/navigation';
	import { registerUser } from '$lib/helpers/authApi.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { saveUserAuth } from '$lib/helpers/authStorage.js';
	import { setAuthFromResponse } from '$lib/stores/auth.svelte.js';

	let step = $state(1); // 1 = Identity, 2 = Location, 3 = Categories
	
	let form = $state({ 
		firstname: '', 
		lastname: '',
		email: '', 
		mobile: '', 
		password: '',
		
		pincode: '', 
		city: '', 
		district: '',
		state: '',
		
		theme: 'system', // 'light' | 'dark' | 'system'
		
		interests: [],
		avatar_url: ''
	});

	let avatarPreview = $state(null);

	// OTP states
	let emailOtpSent = $state(false);
	let phoneOtpSent = $state(false);
	let emailOtp = $state('');
	let phoneOtp = $state('');
	let emailVerified = $state(false);
	let phoneVerified = $state(false);

	let errorMsg = $state('');

	let isFetchingLocation = $state(false);
	let isSubmitting = $state(false);

	// Category states
	const allCategories = [
		'Electronics', 'Grocery & Supermarket', 'Fashion & Clothing', 
		'Home & Furniture', 'Health & Pharmacy', 'Food & Restaurants', 
		'Salon & Beauty', 'Repair & Services', 'Education & Tutoring', 
		'Sports & Fitness'
	];
	let catSearchQuery = $state('');
	let filteredCategories = $derived(
		allCategories.filter(c => c.toLowerCase().includes(catSearchQuery.toLowerCase()))
	);

	function verifyEmail() {
		emailVerified = true;
	}

	function verifyPhone() {
		phoneVerified = true;
	}

	function toggleInterest(i) {
		if (form.interests.includes(i)) {
			form.interests = form.interests.filter((x) => x !== i);
		} else {
			if (form.interests.length < 10) {
				form.interests = [...form.interests, i];
			}
		}
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			avatarPreview = event.target.result;
			form.avatar_url = event.target.result; // Base64 string
		};
		reader.readAsDataURL(file);
	}
	
	function updateTheme(t) {
		form.theme = t;
		if (typeof document !== 'undefined') {
			if (t === 'dark') document.documentElement.classList.add('dark');
			else if (t === 'light') document.documentElement.classList.remove('dark');
			else {
				if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
				else document.documentElement.classList.remove('dark');
			}
		}
	}

	let pincodeResults = $state([]);
	let isSearchingPincode = $state(false);

	async function searchPincode() {
		if (String(form.pincode).length !== 6) return;
		isSearchingPincode = true;
		pincodeResults = [];
		errorMsg = '';

		try {
			const baseUrl = PUBLIC_API_BASE_URL;
			const response = await fetch(`${baseUrl}/api/pincodes/${form.pincode}`, {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				pincodeResults = Array.isArray(data.data) ? data.data : [data.data];
			} else {
				errorMsg = 'Pincode not found!';
			}
		} catch (err) {
			console.error('Pincode fetch error:', err);
			errorMsg = 'Error searching pincode';
		} finally {
			isSearchingPincode = false;
		}
	}

	function applyPincodeResult(res) {
		form.city = res.city;
		form.district = res.district;
		form.state = res.state;
		pincodeResults = [];
	}

	function handlePincodeChange() {
		errorMsg = '';
		pincodeResults = [];
		if (String(form.pincode).length === 6) {
			searchPincode();
		} else {
			form.city = '';
			form.district = '';
			form.state = '';
		}
	}

	function nextStep(e) {
		if (e) e.preventDefault();
		errorMsg = '';
		if (step === 1) {
			// Require basic fields
			if (!form.firstname || !form.lastname || !form.email || !form.mobile || !form.password) {
				errorMsg = 'Please fill all required fields';
				return;
			}
		}
		if (step === 2) {
			// Require location
			if (!form.pincode || !form.city || !form.district || !form.state) {
				errorMsg = 'Please enter a valid 6-digit Pincode and include State.';
				return;
			}
		}
		if (step === 3) {
			// Theme is strictly required, but the default is 'system'
			if (!form.theme) return;
		}
		if (step < 4) step++;
	}

	/**
	 * Handle user registration
	 * Calls POST /api/auth/user/register
	 */
	async function handleSubmit(e) {
		if (e) e.preventDefault();
		errorMsg = '';
		isSubmitting = true;

		try {
			// Call registration API with form data
			const response = await registerUser({
				firstname: form.firstname,
				lastname: form.lastname,
				email: form.email,
				password: form.password,
				mobile: form.mobile,
				city: form.city,
				pincode: form.pincode,
				district: form.district,
				state: form.state,
				interests: form.interests,
				avatar_url: form.avatar_url
			});

			// Verify response
			if (!response?.token) {
				throw new Error('Registration succeeded but no token was returned');
			}

			// Update global auth state using normalized response
			// Note: registerUser helper works like loginUser in returning consolidated payload
			setAuthFromResponse(response, 'user');

			// Route to home on success
			goto('/user/home');
		} catch (err) {
			console.error('Registration error:', err);
			
			if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
				errorMsg = `Cannot connect to API at ${PUBLIC_API_BASE_URL}. Please ensure the backend is running and CORS is enabled.`;
			} else if (err?.status === 400) {
				// Validation errors from API
				errorMsg = err?.message || 'Invalid registration data. Please check your inputs.';
			} else {
				errorMsg = err?.message || 'Registration failed. Please try again.';
			}
		} finally {
			isSubmitting = false;
		}
	}

	// Template markup below
</script>

<svelte:head>
	<title>Create Account — NearBuy</title>
	<meta name="description" content="Sign up to NearBuy and discover products and services from local businesses near you." />
</svelte:head>

<div class="user-bg flex min-h-screen">
	<!-- Left Panel (desktop) -->
	<div class="left-panel relative hidden w-[420px] flex-col justify-between overflow-hidden p-12 lg:flex">
		<div class="deco-circle deco-c1"></div>
		<div class="deco-circle deco-c2"></div>
		<div class="deco-circle deco-c3"></div>

		<a href="/" class="relative z-10 text-4xl font-black">
			<span class="text-white">Near</span><span class="text-orange-500">Buy</span>
		</a>

		<div class="relative z-10">
			<div class="mb-4 text-5xl">🛍️</div>
			<h2 class="mb-3 text-3xl leading-tight font-black text-white">Join the Local<br />Revolution.</h2>
			<p class="text-base leading-relaxed text-gray-400">
				Post your requirements and let local businesses compete to serve you.
			</p>

			<div class="mt-8 space-y-4">
				<div class="flex items-center gap-3 text-sm text-gray-300"><span>⚡</span> <span>Instant vendor connections</span></div>
				<div class="flex items-center gap-3 text-sm text-gray-300"><span>📍</span> <span>Hyper-local recommendations</span></div>
				<div class="flex items-center gap-3 text-sm text-gray-300"><span>🔒</span> <span>Secure & transparent quotes</span></div>
			</div>
		</div>

		<p class="relative z-10 text-xs text-gray-600">© 2026 NearBuy</p>
	</div>

	<!-- Right Panel -->
	<div class="flex flex-1 items-center justify-center px-4 py-12">
		<div class="w-full max-w-lg">
			<!-- Mobile logo -->
			<div class="mb-8 text-center lg:hidden">
				<a href="/" class="text-4xl font-black">
					<span class="text-gray-900 dark:text-white">Near</span><span class="text-orange-500">Buy</span>
				</a>
			</div>

			<div class="form-card rounded-3xl p-8 sm:p-10 relative">
				<!-- Step Indicator -->
				<div class="absolute top-0 left-0 w-full h-1.5 bg-gray-800 rounded-t-3xl overflow-hidden">
					<div class="h-full bg-orange-500 transition-all duration-300" style="width: {(step / 4) * 100}%"></div>
				</div>

				<div class="mb-6 flex justify-between items-start">
					<div>
						<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
							{#if step === 1}Create Account
							{:else if step === 2}Your Location
							{:else if step === 3}App Appearance
							{:else}Your Interests{/if}
						</h1>
						<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
							{#if step === 1}Step 1 of 4: Identity & Security
							{:else if step === 2}Step 2 of 4: Fast proximity matching
							{:else if step === 3}Step 3 of 4: Select your preferred theme
							{:else}Step 4 of 4: Let's personalize your feed{/if}
						</p>
					</div>
					{#if step > 1}
						<button onclick={() => {step--; errorMsg='';}} class="text-sm font-medium text-gray-500 hover:text-white transition-colors">← Back</button>
					{/if}
				</div>

				{#if errorMsg}
					<div class="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-medium text-red-400 animate-in">
						⚠️ {errorMsg}
					</div>
				{/if}

				<!-- Step 1: Identity -->
				{#if step === 1}
					<form onsubmit={nextStep} class="space-y-5 animate-in">
						<!-- Avatar Upload -->
						<div class="flex flex-col items-center mb-6">
							<div class="relative group">
								<div class="w-24 h-24 rounded-full border-2 border-orange-500/30 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all group-hover:border-orange-500">
									{#if avatarPreview}
										<img src={avatarPreview} alt="Avatar Preview" class="w-full h-full object-cover" />
									{:else}
										<span class="text-3xl">👤</span>
									{/if}
									<label for="avatar-input" class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
										<span class="text-white text-xs font-bold">Change</span>
									</label>
								</div>
								<input id="avatar-input" type="file" accept="image/*" onchange={handleFileChange} class="hidden" />
							</div>
							<p class="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Picture</p>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400" for="first-name">First Name</label>
								<input id="first-name" type="text" bind:value={form.firstname} placeholder="First" class="input-field focus:border-orange-500" required />
							</div>
							<div>
								<label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400" for="last-name">Last Name</label>
								<input id="last-name" type="text" bind:value={form.lastname} placeholder="Last" class="input-field focus:border-orange-500" required />
							</div>
						</div>

						<div class="space-y-4 border-y border-gray-200 dark:border-gray-800 py-4">
							<div>
								<label class="mb-1.5 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-400" for="user-email">
									Email Address
									{#if emailVerified}
										<span class="text-green-500 font-bold text-xs">✓ Verified</span>
									{/if}
								</label>
								<div class="flex gap-2">
									<input id="user-email" type="email" bind:value={form.email} disabled={emailVerified} placeholder="you@example.com" class="input-field flex-1 focus:border-orange-500" required />
									{#if !emailVerified && !emailOtpSent}
										<button type="button" onclick={() => { if(form.email) emailOtpSent = true; }} class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-bold text-orange-600 dark:text-orange-500 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Verify</button>
									{/if}
								</div>
								{#if emailOtpSent && !emailVerified}
									<div class="flex gap-2 mt-2 animate-in">
										<input type="text" bind:value={emailOtp} placeholder="OTP" class="input-field flex-1 max-w-[120px] text-center tracking-widest" />
										<button type="button" onclick={verifyEmail} class="px-4 py-2 bg-orange-500 text-sm font-bold text-white rounded-xl hover:bg-orange-400 transition-colors">Confirm</button>
									</div>
								{/if}
							</div>

							<div>
								<label class="mb-1.5 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-400" for="user-mobile">
									Mobile Number
									{#if phoneVerified}
										<span class="text-green-500 font-bold text-xs">✓ Verified</span>
									{/if}
								</label>
								<div class="flex gap-2">
									<input id="user-mobile" type="tel" bind:value={form.mobile} disabled={phoneVerified} placeholder="9876543210" class="input-field flex-1 focus:border-orange-500" required />
									{#if !phoneVerified && !phoneOtpSent}
										<button type="button" onclick={() => { if(form.mobile) phoneOtpSent = true; }} class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-bold text-orange-600 dark:text-orange-500 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Verify</button>
									{/if}
								</div>
								{#if phoneOtpSent && !phoneVerified}
									<div class="flex gap-2 mt-2 animate-in">
										<input type="text" bind:value={phoneOtp} placeholder="OTP" class="input-field flex-1 max-w-[120px] text-center tracking-widest" />
										<button type="button" onclick={verifyPhone} class="px-4 py-2 bg-orange-500 text-sm font-bold text-white rounded-xl hover:bg-orange-400 transition-colors">Confirm</button>
									</div>
								{/if}
							</div>
						</div>

						<div>
							<label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400" for="user-password">Create Password</label>
							<input id="user-password" type="password" bind:value={form.password} placeholder="Create a secure password" class="input-field focus:border-orange-500" required />
						</div>

						<button type="submit" class="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:scale-[1.01] active:scale-[0.99]">
							Continue to Location →
						</button>
					</form>
				{/if}

				<!-- Step 2: Location -->
				{#if step === 2}
					<form onsubmit={nextStep} class="space-y-4 animate-in">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div class="sm:col-span-1">
								<div class="relative">
									<input type="number" bind:value={form.pincode} oninput={handlePincodeChange} placeholder="Pincode" class="input-field focus:border-orange-500 pr-12" required />
									<button type="button" onclick={searchPincode} class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
										{#if isSearchingPincode}
											<span class="loader-sm border-2 w-4 h-4"></span>
										{:else}
											🔍
										{/if}
									</button>
								</div>
								{#if pincodeResults.length > 0}
									<div class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
										<p class="text-[10px] font-bold text-orange-400 uppercase tracking-widest pl-1">Choose your location:</p>
										{#each pincodeResults as res}
											<button 
												type="button" 
												onclick={() => applyPincodeResult(res)} 
												class="w-full flex flex-col items-start p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-orange-500 hover:bg-orange-500/5 transition-all text-left group"
											>
												<span class="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">📍 {res.city}</span>
												<span class="text-[10px] text-gray-500 mt-0.5 uppercase font-semibold">{res.district}, {res.state}</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>
							<div class="sm:col-span-1">
								<input type="text" bind:value={form.city} placeholder="City" class="input-field bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 focus:border-orange-500" required readonly={true} />
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
							{#if isFetchingLocation}
								<div class="absolute inset-0 z-10 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
									<span class="loader-sm border-orange-500 border-t-transparent"></span>
								</div>
							{/if}
							<input type="text" bind:value={form.district} placeholder="District" class="input-field bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 focus:border-orange-500" required readonly={true} />
							<input type="text" bind:value={form.state} placeholder="State" class="input-field bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 focus:border-orange-500" required readonly={true} />
						</div>

						<button type="button" class="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 py-3 font-bold text-gray-600 dark:text-gray-300 transition-colors hover:border-orange-500 hover:text-orange-500">
							🗺️ Open in map to extract exact location
						</button>

						<button type="submit" class="mt-6 w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:scale-[1.01] active:scale-[0.99]">
							Continue to Theme →
						</button>
					</form>
				{/if}

				<!-- Step 3: Theme -->
				{#if step === 3}
					<form onsubmit={nextStep} class="space-y-5 animate-in">
						<div class="grid grid-cols-1 gap-4">
							<button type="button" onclick={() => updateTheme('light')} class={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all text-left ${form.theme === 'light' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-600'}`}>
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm border border-gray-200 dark:border-none">☀️</div>
								<div>
									<h3 class="font-bold text-gray-900 dark:text-white">Light Mode</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">Clean, bright, and readable</p>
								</div>
								{#if form.theme === 'light'}<div class="ml-auto text-xl text-orange-500">✅</div>{/if}
							</button>

							<button type="button" onclick={() => updateTheme('dark')} class={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all text-left ${form.theme === 'dark' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-600'}`}>
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 border border-gray-700 text-2xl shadow-sm">🌙</div>
								<div>
									<h3 class="font-bold text-gray-900 dark:text-white">Dark Mode</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes, sleek contrast</p>
								</div>
								{#if form.theme === 'dark'}<div class="ml-auto text-xl text-orange-500">✅</div>{/if}
							</button>

							<button type="button" onclick={() => updateTheme('system')} class={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all text-left ${form.theme === 'system' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-600'}`}>
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-white to-gray-900 border border-gray-300 dark:border-gray-700 text-xl shadow-sm">⚙️</div>
								<div>
									<h3 class="font-bold text-gray-900 dark:text-white">System Default</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">Adapts to device settings</p>
								</div>
								{#if form.theme === 'system'}<div class="ml-auto text-xl text-orange-500">✅</div>{/if}
							</button>
						</div>

						<button type="submit" class="mt-6 w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:scale-[1.01] active:scale-[0.99]">
							Continue to Categories →
						</button>
					</form>
				{/if}

				<!-- Step 4: Categories -->
				{#if step === 4}
					<form onsubmit={handleSubmit} class="space-y-5 animate-in flex flex-col h-full">
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
							<input type="text" bind:value={catSearchQuery} placeholder="Search categories..." class="input-field pl-10 focus:border-orange-500" />
						</div>

						<div class="flex justify-between items-center text-xs text-gray-400 font-medium">
							<span>Select up to 10 interests</span>
							<span class={form.interests.length === 10 ? 'text-orange-500 font-bold' : ''}>{form.interests.length} / 10 selected</span>
						</div>

						<div class="overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
							<div class="flex flex-wrap gap-2 pb-2">
								{#each filteredCategories as interest}
									<button
										type="button"
										onclick={() => toggleInterest(interest)}
										class={`rounded-xl px-4 py-2 text-sm font-medium transition-all border ${form.interests.includes(interest) ? 'border-orange-500 bg-orange-500 text-white shadow-md' : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300'}`}
									>{interest}</button>
								{:else}
									<p class="text-sm text-gray-500 text-center w-full py-4">No categories found matching "{catSearchQuery}"</p>
								{/each}
							</div>
						</div>

						<div class="pt-4 flex items-center gap-3">
							<button type="button" onclick={handleSubmit} class="flex-1 rounded-xl bg-gray-800 py-3.5 font-bold text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
								Skip
							</button>
							<button type="submit" disabled={isSubmitting} class="flex-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70">
								{isSubmitting ? 'Creating...' : 'Create Account ✅'}
							</button>
						</div>
					</form>
				{/if}

				{#if step === 1}
				<div class="mt-6 text-center text-sm text-gray-500">
					Already have an account? <a href="/user/login" class="ml-1 font-semibold text-orange-400 hover:text-orange-300 hover:underline">Sign in</a>
				</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.user-bg {
		background: #f8fafc;
		min-height: 100vh;
		transition: background-color 0.3s ease;
	}
	:global(.dark) .user-bg {
		background: #030712;
	}

	.left-panel {
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		border-right: 1px solid rgba(249, 115, 22, 0.2);
	}
	:global(.dark) .left-panel {
		background: linear-gradient(135deg, #0f172a 0%, #1a0a00 100%);
		border-right: 1px solid rgba(249, 115, 22, 0.1);
	}

	.deco-circle {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.15;
		pointer-events: none;
	}
	:global(.dark) .deco-circle { opacity: 0.2; }
	.deco-c1 { width: 300px; height: 300px; background: #f97316; top: -80px; right: -80px; }
	.deco-c2 { width: 200px; height: 200px; background: #fb923c; bottom: 100px; left: -50px; }
	.deco-c3 { width: 150px; height: 150px; background: #fbbf24; bottom: -50px; right: 50px; }

	.form-card {
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid rgba(249, 115, 22, 0.2);
		backdrop-filter: blur(16px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05);
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}
	:global(.dark) .form-card {
		background: rgba(17, 24, 39, 0.85);
		border: 1px solid rgba(249, 115, 22, 0.1);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	.input-field {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		background: rgba(249, 250, 251, 0.8);
		padding: 0.75rem 1rem;
		color: #111827;
		font-size: 0.875rem;
		transition: all 0.2s;
		outline: none;
	}
	:global(.dark) .input-field {
		border: 1px solid #374151;
		background: rgba(31, 41, 55, 0.7);
		color: white;
	}
	.input-field::placeholder { color: #9ca3af; }
	:global(.dark) .input-field::placeholder { color: #4b5563; }
	.input-field:focus { box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12); }
	.input-field:disabled { opacity: 0.5; cursor: not-allowed; }

	/* Custom Scrollbar */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(31, 41, 55, 0.5);
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(249, 115, 22, 0.5);
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(249, 115, 22, 0.8);
	}

	/* Simple enter animation */
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-in {
		animation: fadeIn 0.3s ease-out forwards;
	}

	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.loader-sm {
		width: 16px;
		height: 16px;
		border: 2px solid;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		display: inline-block;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
