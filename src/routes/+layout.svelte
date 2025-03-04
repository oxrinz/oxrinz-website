<script>
  import { onMount } from "svelte";
  import Divider from "$lib/components/divider.svelte";
  import { Github, Instagram, Twitter, Youtube } from "lucide-svelte";
  import "../app.css";
</script>

<svelte:head>
  <title>oxrinz</title>
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<main class="flex flex-row justify-center px-6 lg:px-24">
  <div class="container border-x-0 p-6">
    <div class="flex flex-row gap-12">
      <div class="flex flex-col gap-12 w-full">
        <div class="flex flex-col w-full lg:flex-row items-center gap-12">
          <img alt="pfp" class="rounded-full" width="200" height="200" src="/pfp.png" />
          <div class="w-full">
            <h1>oxrinz</h1>
            <p class="text-base">Code poet</p>
          </div>
        </div>

        <Divider />

        <div class="grid md:grid-cols-3 gap-4">
          <div class="w-full col-span-2">
            <slot />
          </div>
          <div class="flex-col gap-6 hidden md:flex">
            <div class="flex gap-2 text-rose-500">
              <a
                href="https://github.com/oxrinz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github />
              </a>
              <a
                href="https://www.instagram.com/0xrinz/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram />
              </a>
              <a
                href="https://x.com/oxrinzz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter />
              </a>
              <a
                href="https://www.youtube.com/channel/UCaVBcke4vtLDz6uq9189nXw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube />
              </a>
            </div>

            <div class="flex flex-col">
              <a href="/">Home</a>
              <a href="/blog">Blog</a>
              <a href="/study">Study</a>
              <a href="/projects">Projects</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap");

  * {
    font-family: "IBM Plex Mono", monospace !important;
  }

  .container {
    max-width: 900px;
    width: 100%;
    padding: 1.5rem;
    border-color: rgba(255, 105, 180, 0.25);
  }
</style>
