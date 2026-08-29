<script>
  import "../../app.css";
</script>

<svelte:head>
  <title>archive — oxrinz</title>
  <link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="min-h-screen">
  <slot />
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap");

  div :global(*) {
    font-family: "IBM Plex Mono", monospace;
  }
</style>
