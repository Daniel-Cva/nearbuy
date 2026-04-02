<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { API_BASE_URL } from '$lib/helpers/config.js';
    import Icon from '@iconify/svelte';

    let businessId = $derived($page.params.id);
    let bizData = $state(null);
    let items = $state([]);
    let loading = $state(true);
    let errorMsg = $state('');
    let activeTab = $state('items'); // 'items' | 'about'

    onMount(async () => {
        try {
            // Fetch business profile Data
            const bizRes = await fetch(`${API_BASE_URL}/api/businesses/${businessId}`);
            if (!bizRes.ok) throw new Error('Business not found or unavailable');
            bizData = await bizRes.json();

            // Fetch public inventory
            const itemsRes = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/items`);
            if (itemsRes.ok) {
                const iData = await itemsRes.json();
                items = Array.isArray(iData) ? iData : (iData.items ?? []);
            }
        } catch (err) {
            errorMsg = err.message;
        } finally {
            loading = false;
        }
    });

    function formatCategories(cats) {
        if (!cats) return '';
        try {
            const parsed = JSON.parse(cats);
            return Array.isArray(parsed) ? parsed.join(', ') : '';
        } catch (_) {
            return cats;
        }
    }
</script>

<svelte:head>
    <title>{bizData?.bname ?? 'Business'} — NearBuy Profile</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20 dark:bg-gray-950 text-gray-900 dark:text-white">
    <div class="h-48 w-full bg-linear-to-r from-orange-500 to-orange-400"></div>

    <div class="mx-auto max-w-4xl px-4 sm:px-6">
        {#if loading}
            <div class="-mt-16 text-center">
                <div class="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl dark:border-gray-900 dark:bg-gray-800">
                    <Icon icon="mdi:loading" width="40" height="40" class="animate-spin text-orange-500" />
                </div>
            </div>
        {:else if errorMsg}
            <div class="-mt-8 rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-900">
                <Icon icon="mdi:alert-circle" width="48" height="48" class="mx-auto mb-4 text-red-500" />
                <h2 class="text-xl font-bold">Error</h2>
                <p class="mt-2 text-gray-500">{errorMsg}</p>
                <a href="/" class="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-2 text-white hover:bg-orange-600">Return Home</a>
            </div>
        {:else if bizData}
            <!-- Profile Header -->
            <div class="-mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                <div class="h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-gray-900">
                    {#if bizData.avatar_url}
                        <img src={bizData.avatar_url} alt={bizData.bname} class="h-full w-full object-cover" />
                    {:else}
                        <div class="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800 text-3xl font-black text-orange-500">
                            {bizData.bname?.[0]?.toUpperCase()}
                        </div>
                    {/if}
                </div>

                <div class="mt-4 flex-1 text-center sm:mt-0 sm:text-left sm:mb-2">
                    <h1 class="text-3xl font-black dark:text-white flex items-center justify-center sm:justify-start gap-2">
                        {bizData.bname}
                        {#if bizData.IsVerified}
                            <Icon icon="mdi:check-decagram" class="text-blue-500 text-2xl" title="Verified Business" />
                        {/if}
                    </h1>
                    <p class="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                        {formatCategories(bizData.categories) || bizData.btype || 'Local Business'} • {bizData.city}
                    </p>
                </div>
                
                <!-- Action Buttons -->
                <div class="mt-6 flex gap-3 sm:mt-0 sm:mb-2">
                    <button class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 font-bold text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                        <Icon icon="mdi:chat" width="20" height="20" /> Message
                    </button>
                    <button class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
                        <Icon icon="mdi:flag-outline" width="20" height="20" />
                    </button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="mt-10 flex border-b border-gray-200 dark:border-gray-800">
                <button onclick={() => (activeTab = 'items')} class={`px-6 py-3 font-bold transition-colors border-b-2 ${activeTab === 'items' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Products & Services</button>
                <button onclick={() => (activeTab = 'about')} class={`px-6 py-3 font-bold transition-colors border-b-2 ${activeTab === 'about' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>About Insights</button>
            </div>

            <!-- Tab Content -->
            <div class="mt-8">
                {#if activeTab === 'items'}
                    {#if items.length === 0}
                        <div class="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                            <Icon icon="mdi:package-variant-closed" width="48" height="48" class="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p class="font-bold text-gray-500 dark:text-gray-400">No items listed by this business yet.</p>
                        </div>
                    {:else}
                        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {#each items as item}
                                {@const specs = JSON.parse(item.specification || '{}')}
                                {@const itemPrice = specs.price || item.selling_price || 'N/A'}
                                {@const itemImgs = JSON.parse(item.image || '[]')}
                                {@const mainImg = Array.isArray(itemImgs) ? itemImgs[0] : item.image}
                                
                                <a href={`/user/item/${item.id}`} class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-orange-500 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                                    <div class="aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        {#if mainImg}
                                            <img src={mainImg} alt={item.product_name} class="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        {:else}
                                            <div class="flex h-full items-center justify-center">
                                                <Icon icon="mdi:package-variant" width="48" height="48" class="text-gray-300 dark:text-gray-600" />
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="flex flex-1 flex-col p-4">
                                        <h3 class="line-clamp-1 text-sm font-bold">{item.product_name}</h3>
                                        {#if item.brand}
                                            <p class="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.brand}</p>
                                        {/if}
                                        <div class="mt-auto pt-3 flex items-center justify-between">
                                            <p class="text-lg font-black text-orange-600 dark:text-orange-400">₹{itemPrice}</p>
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</span>
                                        </div>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {/if}
                {:else if activeTab === 'about'}
                    <div class="grid gap-6 md:grid-cols-3">
                        <div class="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 class="text-lg font-black mb-4 flex items-center gap-2"><Icon icon="mdi:domain" class="text-orange-500" /> About Business</h3>
                            <p class="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300 text-sm">
                                {bizData.about || 'No detailed description provided by this business.'}
                            </p>
                        </div>
                        <div class="space-y-6">
                            <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 class="text-sm font-black mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</h3>
                                <p class="text-sm font-medium flex items-start gap-2">
                                    <Icon icon="mdi:map-marker" class="text-orange-500 mt-0.5 shrink-0" />
                                    <span>
                                        {#if bizData.address}{bizData.address}, <br/>{/if}
                                        {bizData.city}, {bizData.district}<br/>
                                        {bizData.state}
                                    </span>
                                </p>
                            </div>
                            <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 class="text-sm font-black mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Business Type</h3>
                                <p class="text-base font-bold capitalize flex items-center gap-2">
                                    <Icon icon={bizData.btype === 'service' ? 'mdi:tools' : bizData.btype === 'product' ? 'mdi:package-variant-closed' : 'mdi:handshake'} class="text-orange-500" />
                                    {bizData.btype}
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
