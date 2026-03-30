<script>
	let notifications = $state({
		newRequirements: true,
		quoteAccepted: true,
		stockAlerts: false,
		marketing: false
	});

	let accessLevels = $state([
		{ role: 'Founder', access: ['Dashboard', 'Inventory', 'Staff', 'Settings', 'Advertise', 'Collab'], authority: 'Owner' },
		{ role: 'Admin', access: ['Dashboard', 'Inventory', 'Staff', 'Requirements'], authority: 'Manager' },
		{ role: 'Employee', access: ['Inventory', 'Requirements'], authority: 'Staff' }
	]);

	let accessibility = $state({
		darkMode: 'auto',
		fontScale: 100,
		highContrast: false,
		reduceMotion: false
	});

	function toggleNotification(key) {
		notifications[key] = !notifications[key];
	}
</script>

<svelte:head>
	<title>Business Settings — NearBuy</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 pb-32">
	<div class="mb-8">
		<h1 class="text-3xl font-black text-gray-900 dark:text-white">Settings</h1>
		<p class="mt-2 text-gray-500 dark:text-gray-400">Manage your business authority and preferences.</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Sidebar Navigation -->
		<div class="lg:col-span-1">
			<nav class="sticky top-8 flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
				<a href="#authority" class="rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">Authority & Access</a>
				<a href="#notifications" class="rounded-xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">Notifications</a>
				<a href="#accessibility" class="rounded-xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">Accessibility</a>
				<a href="#danger" class="rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">Security & Privacy</a>
			</nav>
		</div>

		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Authority & Access -->
			<section id="authority" class="scroll-mt-8 space-y-4">
				<h2 class="text-lg font-bold text-gray-900 dark:text-white">Authority & Access Levels</h2>
				<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
					<div class="divide-y divide-gray-100 dark:divide-gray-800">
						{#each accessLevels as level}
							<div class="p-5">
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="text-xl">
											{#if level.role === 'Founder'}👑{:else if level.role === 'Admin'}🛠️{:else}👷{/if}
										</span>
										<span class="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">{level.role}</span>
									</div>
									<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase dark:bg-gray-800">{level.authority}</span>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each level.access as permission}
										<span class="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">{permission}</span>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Notification Preferences -->
			<section id="notifications" class="scroll-mt-8 space-y-4">
				<h2 class="text-lg font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
				<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
					<div class="flex items-center justify-between p-5">
						<div>
							<p class="font-bold text-gray-900 dark:text-white">New Requirements</p>
							<p class="text-xs text-gray-500">Get notified when someone posts a need nearby.</p>
						</div>
						<button 
							aria-label="Toggle New Requirements notifications"
							onclick={() => toggleNotification('newRequirements')} 
							class={`h-6 w-11 rounded-full transition-colors ${notifications.newRequirements ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
							<div class={`h-4 w-4 rounded-full bg-white transition-all ${notifications.newRequirements ? 'ml-6' : 'ml-1'}`}></div>
						</button>
					</div>
					<div class="flex items-center justify-between p-5">
						<div>
							<p class="font-bold text-gray-900 dark:text-white">Quote Accepted</p>
							<p class="text-xs text-gray-500">Instant notification when a user accepts your quote.</p>
						</div>
						<button 
							aria-label="Toggle Quote Accepted notifications"
							onclick={() => toggleNotification('quoteAccepted')} 
							class={`h-6 w-11 rounded-full transition-colors ${notifications.quoteAccepted ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
							<div class={`h-4 w-4 rounded-full bg-white transition-all ${notifications.quoteAccepted ? 'ml-6' : 'ml-1'}`}></div>
						</button>
					</div>
					<div class="flex items-center justify-between p-5">
						<div>
							<p class="font-bold text-gray-900 dark:text-white">Low Stock Alerts</p>
							<p class="text-xs text-gray-500">Reminder when products inventory is running low.</p>
						</div>
						<button 
							aria-label="Toggle Low Stock notifications"
							onclick={() => toggleNotification('stockAlerts')} 
							class={`h-6 w-11 rounded-full transition-colors ${notifications.stockAlerts ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
							<div class={`h-4 w-4 rounded-full bg-white transition-all ${notifications.stockAlerts ? 'ml-6' : 'ml-1'}`}></div>
						</button>
					</div>
				</div>
			</section>

			<!-- Accessibility -->
			<section id="accessibility" class="scroll-mt-8 space-y-4">
				<h2 class="text-lg font-bold text-gray-900 dark:text-white">Accessibility & Display</h2>
				<div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm p-6 space-y-6">
					<div>
						<label class="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Theme Preference</label>
						<div class="grid grid-cols-3 gap-2">
							{#each ['light', 'dark', 'auto'] as mode}
								<button onclick={() => accessibility.darkMode = mode} class={`rounded-xl border py-2 text-xs font-bold capitalize transition-all ${accessibility.darkMode === mode ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10' : 'border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800'}`}>
									{mode}
								</button>
							{/each}
						</div>
					</div>
					<div class="flex items-center justify-between">
						<label for="high-contrast-toggle">
							<p class="font-bold text-gray-900 dark:text-white">High Contrast</p>
							<p class="text-xs text-gray-500">Increase visibility of text and elements.</p>
						</label>
						<input id="high-contrast-toggle" type="checkbox" bind:checked={accessibility.highContrast} class="h-5 w-5 accent-orange-500" />
					</div>
					<div class="flex items-center justify-between">
						<label for="reduce-motion-toggle">
							<p class="font-bold text-gray-900 dark:text-white">Reduce Motion</p>
							<p class="text-xs text-gray-500">Minimize animations and transitions.</p>
						</label>
						<input id="reduce-motion-toggle" type="checkbox" bind:checked={accessibility.reduceMotion} class="h-5 w-5 accent-orange-500" />
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
