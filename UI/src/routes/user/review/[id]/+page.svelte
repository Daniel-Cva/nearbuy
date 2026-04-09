<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/helpers/config.js';
	import { uploadToUniversalApi, toDisplayUrl } from '$lib/helpers/upload.js';

	const orderId = page.params.id;

	let stars = $state(0);
	let hovered = $state(0);
	let comment = $state('');
	let submitted = $state(false);
	let submitting = $state(false);
	let tags = $state([]);
	let errorMsg = $state('');
	let attachments = $state([]); // Array of { path, type }
	let uploadingMedia = $state(false);

	// Order info fetched so we know which business to review
	let order = $state(null);

	const quickTags = [
		'Fast service',
		'Great quality',
		'Value for money',
		'Professional',
		'On time',
		'Would recommend'
	];

	onMount(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				order = data.order || data;
			}
		} catch (e) {
			console.error('Failed to load order info:', e);
		}
	});

	function toggleTag(tag) {
		tags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
	}

	async function handleFileUpload(e) {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;

		uploadingMedia = true;
		errorMsg = '';

		try {
			for (const file of files) {
				const isVideo = file.type.startsWith('video/');
				const uploadType = isVideo ? 'review-video' : 'review-image';
				
				// Use item_id if available, otherwise fallback to a generic identifier
				const itemIdForPath = order?.accepted_item?.id || `biz_rev_${order?.business_id || orderId.slice(0, 8)}`;
				const uploadNum = (attachments.length + 1).toString();

				const res = await uploadToUniversalApi({
					file,
					type: uploadType,
					itemId: itemIdForPath,
					num: uploadNum
				});

				attachments = [...attachments, { path: res.path, type: isVideo ? 'video' : 'image' }];
			}
		} catch (err) {
			console.error('Upload failed:', err);
			errorMsg = 'Failed to upload one or more files.';
		} finally {
			uploadingMedia = false;
			e.target.value = ''; // Reset input
		}
	}

	function removeAttachment(path) {
		attachments = attachments.filter(a => a.path !== path);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!stars || submitting) return;
		submitting = true;
		errorMsg = '';

		try {
			const reviewText = [comment, tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''].filter(Boolean).join('\n');

			const res = await fetch(`${API_BASE_URL}/api/reviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					acceptance_id: orderId,
					business_id: order?.business_id,
					item_id: order?.accepted_item?.id || null,
					rating: stars,
					review_text: reviewText,
					image_url: attachments.filter(a => a.type === 'image').map(a => a.path),
					review_video_url: attachments.filter(a => a.type === 'video').map(a => a.path)
				})
			});

			if (!res.ok) {
				const data = await res.json();
                console.error('Review submission failed:', data);
				throw new Error(data.message || data.error || 'Failed to submit review');
			}

			submitted = true;
		} catch (err) {
			errorMsg = err.message;
		} finally {
			submitting = false;
		}
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
					{#if order?.biz_name || order?.seller?.biz_name}
						<span class="font-bold text-gray-900 dark:text-white">{order?.biz_name || order?.seller?.biz_name}</span>
					{:else}
						Order <span class="font-mono text-gray-900 dark:text-white">#{orderId.slice(-6)}</span>
					{/if}
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

				<!-- Media Upload -->
				<div>
					<p class="mb-3 text-sm text-gray-500 dark:text-gray-400">Add Photos or Video (optional)</p>
					<div class="grid grid-cols-3 gap-3">
						{#each attachments as media}
							<div class="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 shadow-sm">
								{#if media.type === 'video'}
									<div class="h-full w-full bg-slate-900 border border-black/10">
										<video 
											src={toDisplayUrl(media.path)} 
											class="h-full w-full object-cover" 
											autoplay muted loop playsinline
										></video>
									</div>
								{:else}
									<img src={toDisplayUrl(media.path)} alt="Preview" class="h-full w-full object-cover" />
								{/if}
								<button 
									type="button" 
									onclick={() => removeAttachment(media.path)}
									class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
								>✕</button>
							</div>
						{/each}
						
						{#if attachments.length < 6}
							<label class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white transition-all hover:border-orange-500 hover:bg-orange-50/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-500/50">
								<input type="file" multiple accept="image/*,video/*" class="hidden" onchange={handleFileUpload} disabled={uploadingMedia} />
								{#if uploadingMedia}
									<div class="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
								{:else}
									<span class="text-2xl text-gray-400">+</span>
									<span class="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Upload</span>
								{/if}
							</label>
						{/if}
					</div>
				</div>

				{#if errorMsg}
					<p class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 text-sm font-bold text-red-500">{errorMsg}</p>
				{/if}

				<button
					id="btn-submit-review"
					type="submit"
					disabled={!stars || submitting || uploadingMedia}
					class={`w-full rounded-2xl py-4 text-lg font-bold transition-all ${stars && !submitting && !uploadingMedia ? 'bg-orange-500 text-white hover:bg-orange-400 active:scale-95' : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}`}
				>
					{#if submitting}
						Submitting...
					{:else}
						Submit Review {stars ? '⭐'.repeat(stars) : ''}
					{/if}
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
					href="/user/quotes"
					class="rounded-2xl bg-orange-500 px-8 py-3 font-bold text-white transition-all hover:bg-orange-400"
					>Back to My Requirements</a
				>
			</div>
		{/if}
	</div>
</div>
