<script lang="ts">
  import { onMount } from "svelte";
  import { formatBytes, loadIndex, thumbUrl, type Collection } from "$lib/archive";

  let collections = $state<Collection[] | null>(null);
  let error = $state<string | null>(null);

  const totals = $derived({
    count: collections?.reduce((sum, c) => sum + c.count, 0) ?? 0,
    bytes: collections?.reduce((sum, c) => sum + c.bytes, 0) ?? 0
  });

  onMount(async () => {
    try {
      collections = await loadIndex();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  });
</script>

<svelte:head>
  <title>archive — oxrinz</title>
</svelte:head>

<div class="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
  <header class="mb-8 border-b border-rose-500/20 pb-4">
    <div class="flex flex-wrap items-baseline justify-between gap-4">
      <h1 class="!mb-0 !mt-0">archive</h1>
      {#if collections?.length}
        <p class="text-xs text-rose-200/50">
          {collections.length} collection{collections.length === 1 ? "" : "s"} ·
          {totals.count.toLocaleString()} images · {formatBytes(totals.bytes)}
        </p>
      {/if}
    </div>
    <p class="mt-2 text-sm text-rose-200/60">Image sets I've ripped, scraped or otherwise hoarded.</p>
  </header>

  {#if error}
    <p class="text-sm text-rose-400">couldn't load the archive index: {error}</p>
  {:else if !collections}
    <p class="text-sm text-rose-200/50">loading…</p>
  {:else if !collections.length}
    <p class="text-sm text-rose-200/50">nothing archived yet</p>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each collections as collection (collection.id)}
        <a
          class="group flex flex-col overflow-hidden rounded border border-rose-500/20 !font-normal !text-inherit !no-underline transition hover:border-rose-500/60"
          href="/archive/{collection.id}"
        >
          <div class="aspect-video overflow-hidden bg-rose-500/5">
            {#if collection.cover}
              <img
                src={thumbUrl(collection.id, collection.cover)}
                alt=""
                loading="lazy"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            {/if}
          </div>
          <div class="flex flex-1 flex-col gap-1 p-3">
            <span class="font-bold text-rose-400">{collection.title}</span>
            {#if collection.note}
              <span class="text-xs text-rose-200/60">{collection.note}</span>
            {/if}
            <span class="mt-auto pt-2 text-xs text-rose-200/40">
              {collection.count.toLocaleString()} images · {formatBytes(collection.bytes)}
            </span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
