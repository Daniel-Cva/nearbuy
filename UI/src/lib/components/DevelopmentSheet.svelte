<script>
	import { fade, fly } from 'svelte/transition';

	let { show = true, onDemo = () => {} } = $props();

	function close() {
		show = false;
		onDemo();
	}
</script>

{#if show}
	<!-- Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 300 }}
	>
		<!-- Bottom Sheet -->
		<div
			class="relative w-full max-w-lg rounded-t-[2.5rem] border-t border-white/10 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-md"
			transition:fly={{ y: 400, duration: 500 }}
		>
			<!-- Decorative Handle -->
			<div class="absolute top-4 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/20"></div>

			<div class="mt-4 text-center">
				<div class="mb-6 flex justify-center">
					<div class="relative">
						<div class="absolute -inset-1 rounded-full bg-orange-500/30 blur-xl animate-pulse"></div>
						<div class="relative flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/30 bg-gray-800 text-4xl shadow-inner">
							🚀
						</div>
					</div>
				</div>

				<h2 class="mb-3 text-2xl font-black tracking-tight text-white">
					Feature Coming Soon
				</h2>
				
				<p class="mb-8 text-balance text-gray-400">
					We're currently perfecting this experience. This page is under development and will be fully functional once the API integration is complete.
				</p>

				<div class="space-y-4">
					<button
						onclick={close}
						class="group relative block w-full overflow-hidden rounded-2xl bg-orange-500 p-4 text-lg font-bold text-white transition-all hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
					>
						<span class="relative z-10">View Demo Page</span>
						<div class="absolute inset-0 translate-y-full bg-gradient-to-t from-white/20 to-transparent transition-transform group-hover:translate-y-0"></div>
					</button>

					<p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
						Dummy Data Mode
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		overflow: hidden;
	}
	:global(body:has(:not(.fixed))) {
		overflow: auto;
	}
</style>
