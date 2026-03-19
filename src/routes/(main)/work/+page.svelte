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
      title: "The Roman Timeline",
      description:
        "Cool website explaining and visualizing the history of the Roman Civilization in an interactive way. This is an ongoing project and I am stil updating it from time to time. It will hopefully feature a custom dataset of the Roman Civilization's controlled area.",
      date: "03.2026",
      status: "Ongoing",
      href: "https://theromantimeline.com",
    },
    {
      title: "Emp**yment",
      description:
        "I do what I am told to do and in turn I get money. Company name is a secret. Business logic and CRMs.",
      date: "02.2026",
      status: "Ongoing",
    },
    {
      title: "Wingless",
      description:
        "A Wayland compositor with focus on beauty and ease of use. Good defaults, pretty graphics, modern feel. The goal is to be kind of the MacOS for Linux being a beautiful system that just works. It's a failure until everything everywhere works on the first try.",
      date: "01.2026",
      status: "Ongoing",
      href: "https://github.com/oxrinz/wingless",
    },
    {
      title: "Sealth project",
      description:
        "Flutter, Swift, boring business logic, something something.",
      date: "09.2025",
      status: "Ongoing",
    },
    {
      title: "Thinkin' Rocks",
      description:
        "I was one of the five founders of a local tech non-profit. The idea was to function as a tech library similar to book libraries, giving people the possibility to temporarily use tech that people wouldn't otherwise have access to. Quit in late 2025 after the project wasn't going in the direction I was hoping for. There were two cool things that happened during my time there. First, we got the president of Finland to wave at a robot we showed him. Second is the purchase of Tenstorrent p100.",
      date: "08.2025",
      status: "Ended",
      href: "https://thinkinrocks.com",
    },
    {
      title: "ryu!",
      description:
        "A high level machine learning language with low level control. Compiles to LLVM and PTX, with other backends coming in the future. Designed for easy and efficient ML development. Learn tons about compilers and machine learning infrastructure.",
      date: "03.2025",
      status: "Abandoned",
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
        "Shopify store and website agency. Sold various digital goods to customers, mostly clothing brands",
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
      </div>
    {/each}
  </div>
</div>
