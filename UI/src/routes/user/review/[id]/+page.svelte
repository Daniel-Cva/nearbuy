<script>
	import { page } from '$app/stores';
	const orderId = $page.params.id;

	let stars = $state(0);
	let hovered = $state(0);
	let comment = $state('');
	let submitted = $state(false);
	let tags = $state([]);

	const quickTags = [
		'Fast service',
		'Great quality',
		'Value for money',
		'Professional',
		'On time',
		'Would recommend'
	];

	function toggleTag(tag) {
		tags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
	}

	function handleSubmit(e) {
		e.preventDefault();
		if (!stars) return;
		submitted = true;
	}
</script>

<svelte:head>
	<title>Leave a Review — NearBuy</title>
	<meta name="description" content="Rate and review your experience with a business on NearBuy." />
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-28 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
	<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
		<!-- svelte-ignore a11y_invalid_attribute -->
		<a href="javascript:history.back()" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</a>
		<h1 class="font-bold">Leave a Review</h1>
	</header>

	<div class="mx-auto max-w-xl px-4 py-8">
		{#if !submitted}
			<div class="mb-8 text-center">
				<div class="mb-3 text-5xl">🛒</div>
				<h2 class="text-xl font-bold">How was your experience?</h2>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Order <span class="font-mono text-gray-900 dark:text-white">{orderId}</span> · Krishna Electronics
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Star Rating -->
				<div class="text-center">
					<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">Tap to rate</p>
					<div class="flex justify-center gap-3">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								id={`star-${star}`}
								onmouseover={() => (hovered = star)}
								onfocus={() => (hovered = star)}
								onmouseleave={() => (hovered = 0)}
								onblur={() => (hovered = 0)}
								onclick={() => (stars = star)}
								class={`text-4xl transition-all hover:scale-125 ${star <= (hovered || stars) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
								>★</button
							>
						{/each}
					</div>
					{#if stars > 0}
						<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
							{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
						</p>
					{/if}
				</div>

				<!-- Quick Tags -->
				<div>
					<p class="mb-3 text-sm text-gray-500 dark:text-gray-400">Quick tags (optional)</p>
					<div class="flex flex-wrap gap-2">
						{#each quickTags as tag}
							<button
								type="button"
								id={`tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
								onclick={() => toggleTag(tag)}
								class={`rounded-xl px-3 py-1.5 text-sm transition-all ${tags.includes(tag) ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
								>{tag}</button
							>
						{/each}
					</div>
				</div>

				<!-- Comment -->
				<div>
					<label class="mb-1 block text-sm text-gray-500 dark:text-gray-400" for="review-comment"
						>Write a review (optional)</label
					>
					<textarea
						id="review-comment"
						bind:value={comment}
						placeholder="Share your experience to help others make better choices..."
						rows="4"
						class="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
					></textarea>
				</div>

				<button
					id="btn-submit-review"
					type="submit"
					disabled={!stars}
					class={`w-full rounded-2xl py-4 text-lg font-bold transition-all ${stars ? 'bg-orange-500 text-white hover:bg-orange-400' : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}`}
				>
					Submit Review {stars ? '⭐'.repeat(stars) : ''}
				</button>
			</form>
		{:else}
			<div class="py-16 text-center">
				<div class="mb-4 text-6xl">🌟</div>
				<h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Thank You!</h2>
				<p class="mb-2 text-gray-600 dark:text-gray-400">Your {'⭐'.repeat(stars)} review has been submitted.</p>
				<p class="mb-8 text-sm text-gray-500 dark:text-gray-500">
					Your feedback helps local businesses grow and others make better choices.
				</p>
				<a
					href="/user/home"
					class="rounded-2xl bg-orange-500 px-8 py-3 font-bold text-white transition-all hover:bg-orange-400"
					>Back to Home</a
				>
			</div>
		{/if}
	</div>
</div>
