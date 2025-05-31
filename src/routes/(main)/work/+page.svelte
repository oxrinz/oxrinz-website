<script lang="ts">
  type ProjectDate = `${string}-${string}`;

  interface Project {
    title: string;
    description?: string;
    date?: ProjectDate;
    status?: string;
    href?: string;
  }

  export let projects = [
    {
      title: "Ryulang",
      description:
        "A high level machine learning language with low level control. Compiles to LLVM and PTX, with other backends coming in the future. Designed for easy and efficient ML development. Name will more than likely change in the future. I am going to beat PyTorch in performance",
      date: "03.2025",
      status: "Fulltime development",
    },
    {
      title: "rv32i",
      description:
        "Pipelined RISC-V based integer only cpu core with a few extensions. Written in verilog. Also an assembler and C compiler for this architecture written in zig, from scratch",
      date: "01.2025",
      status: "Finished",
      href: "https://github.com/oxrinz/rv32i",
    },
    {
      title: "VNVault",
      description:
        'A vndb "alternative". Using the data from vndb with a few extra features and improvements. No longer hosted',
      date: "08.2024",
      status: "After 3 remakes, dropped",
    },
    {
      title: "#%?&$",
      description:
        'Shopify store and website agency. Sold various digital goods to customers, mostly clothing brands',
      date: "03.2022 - 10.2024",
      status: "Finished",
    },
  ];
</script>

<svelte:head>
  <title>Work</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Work</h1>
    {#each projects as project}
      <div>
        <div class="flex flex-row items-center gap-2">
          {#if project.href}
            <a href={project.href} target="_blank" class="font-bold text-lg"
              >{project.title}</a
            >
          {:else}
            <h3 class="text-rose-400 font-bold text-lg">{project.title}</h3>
          {/if}
          <p class="text-sm text-rose-400/50">({project.date})</p>
        </div>
        <p class="text-base text-rose-200">{project.description}</p>
        <p class="text-rose-300">
          <span>Status: </span>
          <span class="font-bold text-rose-200">{project.status}</span>
        </p>
      </div>
    {/each}
  </div>
</div>
