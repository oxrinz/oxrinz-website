<script lang="ts">
  interface Interest {
    title: string;
    description?: string;
    href?: string;
  }

  const interests: Interest[] = [
    {
      title: "rv32i",
      description:
        "Pipelined RISC-V based integer only cpu core with a few extensions. Written in verilog. Also an assembler and C compiler for this architecture written in zig, from scratch.",
      href: "https://github.com/oxrinz/rv32i",
    },
    {
      title: "zulip",
      description:
        "World's worst MILP solver. Honestly I'm not even sure if it's a MILP solver.",
      href: "https://github.com/oxrinz/zulip",
    },
    {
      title: "bamba-calc",
      description:
        "A Lisp based lambda evaluator. Ironically, it was, and possibly still is able to detect and more accurately evaluate edge cases than lambdacalc.dev, arguably the most popular modern lambda calculator.",
      href: "https://github.com/oxrinz/bamba-calc",
    },
    {
      title: "flap and parca",
      description:
        "I explored Lisp dialects and decided to create one of my own, exploring different ideas of programming language design. It was a very simple language based on something I called cells which were the replacements for any kind of data structure excluding the primitives. I liked the concept and development in it was exceedingly effortless compared to the mainstream GC'd languaes, but the language ran into performance issues as well as design issues because of the fact that it was based on Lisp. I didn't have the energy to rewrite it into an traditional imperative langauge so I ultimately abandoned the project. Parca was a small ECS based game engine written in flap which was very minimal and primitive, only supporting 2D gameplay. I also started working on a UI framework in flap aswell, but that ended shortly because of the design issues of Lisp.",
    },
    {
      title: "tt-kmd",
      description:
        "During my time at Thinkin' Rocks I spent a few months writing a kernel mode driver for tenstorrent from scratch. I learned a ton about PCI, PCIe, low level device control and motherboard / system design. The driver was very primitive, but functional. It supported most of the IOCTLs that the official driver had. Very cool and fun project.",
    },
    {
      title: "SpireUI",
      description:
        "Back when I was selling Shopify themes and websites I worked on a UI library called SpireUI. I noticed how any GLSL work was enormously expensive, and wanted to help the community (there were definitely no monetary motives here) by creating a library featuring Avant-Garde shader based React components. It was abandoned after a few months and components. The project strengthened my previous Three.js / shading skills which came in useful later on.",
    },
  ];
</script>

<svelte:head>
  <title>Interests</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Interests</h1>
    <p class="text-rose-200/70">
      Alongside bigger projects I often tinker with technology. This page is a
      record of those explorations.
    </p>
    {#each interests as interest}
      <div>
        {#if interest.href}
          <a href={interest.href} target="_blank" class="font-bold text-lg"
            >{interest.title}</a
          >
        {:else}
          <h3 class="text-rose-400 font-bold text-lg">{interest.title}</h3>
        {/if}
        {#if interest.description}
          <p class="text-base text-rose-200">{interest.description}</p>
        {/if}
      </div>
    {/each}
  </div>
</div>
