<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Download, Folder, Search, X, ChevronLeft, ChevronRight } from "lucide-svelte";
  import {
    allItems,
    crumbs,
    formatBytes,
    fullUrl,
    itemsIn,
    loadManifest,
    subdirs,
    thumbUrl,
    type Item,
    type Manifest,
  } from "$lib/archive";

  const id = $derived(page.params.collection ?? "");

  const PAGE_SIZE = 200;
  const MAX_RESULTS = 1000;

  let manifest = $state<Manifest | null>(null);
  let error = $state<string | null>(null);
  let dir = $state("");
  let query = $state("");
  let openPath = $state<string | null>(null);
  let shown = $state(PAGE_SIZE);
  let sentinel = $state<HTMLElement | null>(null);

  const searching = $derived(query.trim().length > 0);

  const folders = $derived(manifest && !searching ? subdirs(manifest, dir) : []);

  const items = $derived.by((): Item[] => {
    if (!manifest) return [];
    if (!searching) return itemsIn(manifest, dir);
    const needle = query.trim().toLowerCase();
    const hits: Item[] = [];
    for (const item of allItems(manifest)) {
      if (item.path.toLowerCase().includes(needle)) hits.push(item);
      if (hits.length >= MAX_RESULTS) break;
    }
    return hits;
  });

  const visible = $derived(items.slice(0, shown));
  const openIndex = $derived(openPath ? items.findIndex((i) => i.path === openPath) : -1);
  const open = $derived(openIndex >= 0 ? items[openIndex] : null);

  /** URL is the source of truth so every view is linkable. */
  function readUrl() {
    const params = new URLSearchParams(location.search);
    dir = params.get("p") ?? "";
    query = params.get("q") ?? "";
    openPath = params.get("i");
    shown = PAGE_SIZE;
  }

  function writeUrl(replace = false) {
    const params = new URLSearchParams();
    if (dir) params.set("p", dir);
    if (query.trim()) params.set("q", query.trim());
    if (openPath) params.set("i", openPath);
    const search = params.toString();
    const url = `${location.pathname}${search ? `?${search}` : ""}`;
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function goto(next: string) {
    dir = next;
    query = "";
    openPath = null;
    shown = PAGE_SIZE;
    writeUrl();
    scrollTo({ top: 0 });
  }

  function openImage(item: Item) {
    openPath = item.path;
    writeUrl();
  }

  function close() {
    openPath = null;
    writeUrl();
  }

  function step(delta: number) {
    if (openIndex < 0) return;
    const next = items[openIndex + delta];
    if (!next) return;
    openPath = next.path;
    if (openIndex + delta >= shown - 1) shown = Math.min(items.length, shown + PAGE_SIZE);
    writeUrl(true);
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
  }

  // Typing replaces the history entry rather than stacking one per keystroke.
  function onSearch(event: Event) {
    query = (event.currentTarget as HTMLInputElement).value;
    openPath = null;
    shown = PAGE_SIZE;
    writeUrl(true);
  }

  function clearSearch() {
    query = "";
    shown = PAGE_SIZE;
    writeUrl(true);
  }

  $effect(() => {
    const node = sentinel;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      shown = Math.min(items.length, shown + PAGE_SIZE);
      // Re-observe so a sentinel still in view after the reveal fires again.
      observer.unobserve(node);
      requestAnimationFrame(() => observer.observe(node));
    });
    observer.observe(node);
    return () => observer.disconnect();
  });

  // Preload the neighbours so arrowing through full-res images feels instant.
  $effect(() => {
    if (openIndex < 0) return;
    for (const delta of [1, -1]) {
      const neighbour = items[openIndex + delta];
      if (neighbour) new Image().src = fullUrl(id, neighbour.path);
    }
  });

  onMount(async () => {
    readUrl();
    try {
      manifest = await loadManifest(id);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  });
</script>

<svelte:head>
  <title>{manifest?.title ?? id} — archive — oxrinz</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} onpopstate={readUrl} />

<div class="mx-auto max-w-[1600px] px-4 py-6 sm:px-8">
  <header class="mb-6 flex flex-col gap-4 border-b border-rose-500/20 pb-4">
    <div class="flex flex-wrap items-baseline justify-between gap-4">
      <div class="flex flex-wrap items-baseline gap-2 text-sm">
        <a class="crumb" href="/archive">archive</a>
        <span class="text-rose-500/40">/</span>
        <button class="crumb font-bold" onclick={() => goto("")}>{manifest?.title ?? id}</button>
        {#each crumbs(dir) as crumb (crumb.path)}
          <span class="text-rose-500/40">/</span>
          <button class="crumb" onclick={() => goto(crumb.path)}>{crumb.name}</button>
        {/each}
      </div>
      {#if manifest}
        <p class="text-xs text-rose-200/50">
          {manifest.count.toLocaleString()} images · {formatBytes(manifest.bytes)}
        </p>
      {/if}
    </div>

    <label class="flex items-center gap-2 rounded border border-rose-500/20 bg-rose-500/5 px-3 py-2">
      <Search size={16} class="shrink-0 text-rose-500/60" />
      <input
        class="w-full bg-transparent text-sm text-rose-100 outline-none placeholder:text-rose-200/30"
        placeholder="search all filenames…"
        value={query}
        oninput={onSearch}
      />
      {#if searching}
        <button class="text-rose-500/60 hover:text-rose-400" onclick={clearSearch} aria-label="clear search">
          <X size={16} />
        </button>
      {/if}
    </label>
  </header>

  {#if error}
    <p class="text-sm text-rose-400">couldn't load this collection: {error}</p>
  {:else if !manifest}
    <p class="text-sm text-rose-200/50">loading…</p>
  {:else}
    {#if searching}
      <p class="mb-4 text-xs text-rose-200/50">
        {items.length === MAX_RESULTS ? `first ${MAX_RESULTS}` : items.length} match{items.length === 1 ? "" : "es"}
      </p>
    {/if}

    {#if folders.length}
      <div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {#each folders as folder (folder.path)}
          <button
            class="flex items-center gap-2 rounded border border-rose-500/20 px-3 py-2 text-left text-sm text-rose-100 transition hover:border-rose-500/60 hover:bg-rose-500/10"
            onclick={() => goto(folder.path)}
          >
            <Folder size={16} class="shrink-0 text-rose-500" />
            <span class="truncate">{folder.name}</span>
            <span class="ml-auto text-xs text-rose-200/40">{folder.count}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if items.length}
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {#each visible as item (item.path)}
          <button
            class="group relative aspect-square overflow-hidden rounded border border-rose-500/10 bg-rose-500/5 transition hover:border-rose-500/60"
            onclick={() => openImage(item)}
            title={item.path}
          >
            <img
              src={thumbUrl(id, item.path)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              class="h-full w-full object-contain transition group-hover:scale-105"
            />
            <span
              class="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-1 text-left text-[10px] text-rose-100 opacity-0 transition group-hover:opacity-100"
            >
              {searching ? item.path : item.name}
            </span>
          </button>
        {/each}
      </div>
      {#if shown < items.length}
        <div bind:this={sentinel} class="py-8 text-center text-xs text-rose-200/40">
          loading more… ({shown}/{items.length})
        </div>
      {/if}
    {:else if !folders.length}
      <p class="text-sm text-rose-200/50">nothing here</p>
    {/if}
  {/if}
</div>

{#if open}
  <div
    class="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur"
    role="dialog"
    aria-modal="true"
    aria-label={open.name}
  >
    <div class="flex items-center gap-3 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-200/70">
      <span class="truncate">{open.path}</span>
      <span class="ml-auto shrink-0 whitespace-nowrap">{open.w}×{open.h} · {formatBytes(open.size)}</span>
      <a
        class="shrink-0 text-rose-500 hover:text-rose-400"
        href={fullUrl(id, open.path)}
        download={open.name}
        target="_blank"
        rel="noopener"
        aria-label="download original"
      >
        <Download size={16} />
      </a>
      <button class="shrink-0 text-rose-500 hover:text-rose-400" onclick={close} aria-label="close">
        <X size={18} />
      </button>
    </div>

    <div class="relative flex min-h-0 flex-1 items-center justify-center p-4">
      <button
        class="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-rose-300 hover:text-rose-400 disabled:opacity-20"
        onclick={() => step(-1)}
        disabled={openIndex <= 0}
        aria-label="previous"
      >
        <ChevronLeft size={24} />
      </button>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <img
        src={fullUrl(id, open.path)}
        alt={open.name}
        class="max-h-full max-w-full object-contain"
        onclick={close}
      />
      <button
        class="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-rose-300 hover:text-rose-400 disabled:opacity-20"
        onclick={() => step(1)}
        disabled={openIndex >= items.length - 1}
        aria-label="next"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  </div>
{/if}

<style>
  .crumb {
    @apply text-rose-500 hover:underline;
  }
</style>
