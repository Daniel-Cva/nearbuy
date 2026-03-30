<script>
	import { logout } from '$lib/stores/auth.svelte.js';
	import { goto } from '$app/navigation';
	let theme = $state('dark');
	let notifications = $state(true);
	let language = $state('en');
	let saved = $state(false);

	$effect(() => {
		// Load initial theme on mount
		const storedTheme = localStorage.getItem('theme');
		if (storedTheme) {
			theme = storedTheme;
		} else {
			// Check system preference
			const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			theme = systemPrefersDark ? 'dark' : 'light';
		}
	});

	function setTheme(newTheme) {
		theme = newTheme;
		localStorage.setItem('theme', theme);
		
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function handleSave() {
		saved = true;
		
		// Apply all settings (theme is already reactive, but we ensure it's saved)
		localStorage.setItem('notifications', String(notifications));
		localStorage.setItem('language', language);
		
		setTimeout(() => (saved = false), 2000);
	}
</script>

<svelte:head>
	<title>Settings — NearBuy</title>
	<meta
		name="description"
		content="Manage your NearBuy account settings including theme, notifications, and language preferences."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<!-- Header -->
	<header class="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
			>← Back</a
		>
		<h1 class="text-xl font-bold">Settings</h1>
	</header>

	<div class="mx-auto max-w-2xl space-y-6 px-6 py-8">
		<!-- Appearance -->
		<section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-bold">🎨 Appearance</h2>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">Theme</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Choose your preferred color mode</p>
				</div>
				<div class="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
					<button
						id="theme-dark"
						onclick={() => setTheme('dark')}
						class={`px-4 py-2 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-900 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'}`}
						>🌙 Dark</button
					>
					<button
						id="theme-light"
						onclick={() => setTheme('light')}
						class={`px-4 py-2 text-sm font-medium transition-all ${theme === 'light' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}
						>☀️ Light</button
					>
				</div>
			</div>
		</section>

		<!-- Notifications -->
		<section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h2 class="mb-4 text-lg font-bold">🔔 Notifications</h2>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">Push Notifications</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Receive alerts for quotes, orders, and messages</p>
				</div>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button
					id="toggle-notifications"
					onclick={() => (notifications = !notifications)}
					class={`relative h-6 w-12 rounded-full transition-colors ${notifications ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}
				>
					<span
						class={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${notifications ? 'left-7' : 'left-1'}`}
					></span>
				</button>
			</div>
		</section>

		<!-- Language -->
		<section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h2 class="mb-4 text-lg font-bold">🌐 Language</h2>
			<select
				id="select-language"
				bind:value={language}
				class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
			>
				<option value="en">English</option>
				<option value="ta">Tamil</option>
				<option value="hi">Hindi</option>
				<option value="te">Telugu</option>
			</select>
		</section>

		<!-- Account -->
		<section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h2 class="mb-4 text-lg font-bold">👤 Account</h2>
			<div class="space-y-3">
				<a
					href="/forgot-password"
					class="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					<span>Change Password</span><span class="text-gray-400 dark:text-gray-500">→</span>
				</a>
				<button
					id="btn-logout"
					onclick={() => {
						logout();
						goto('/');
					}}
					class="flex w-full items-center justify-between rounded-xl p-3 text-left text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
				>
					<span>Sign Out</span><span>→</span>
				</button>
			</div>
		</section>

		<button
			id="btn-save-settings"
			onclick={handleSave}
			class={`w-full rounded-xl py-3 font-semibold shadow-sm transition-all ${saved ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-500/40 active:scale-95'}`}
		>
			{saved ? '✓ Saved!' : 'Save Changes'}
		</button>
	</div>
</div>
