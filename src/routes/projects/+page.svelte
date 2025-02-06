<script>
  export let projects = [
    {
      title: "RyuAI",
      description:
        "A collection of low-level AI related stuff. Hardware, library, distributed training. All tied together into a single, grand ballet",
      date: "01-2025",
      status: "Active",
    },
    {
      title: "RyuPy",
      description:
        "A python interfaced machine learning library written from scratch in cuda, c++",
      date: "09-2024",
      status: "Dropped",
      href: "https://github.com/oxrinz/ryupy",
    },
    {
      title: "VNVault",
      description:
        'A vndb "alternative"\nWorks as a great vndb alternative, using the data from vndb with a few extra features and improvements',
      date: "08-2024",
      status: "In very early alpha & slow development",
      href: "https://www.vnvault.com/",
    },
    {
      title: "AuraWizard",
      description:
        "Analyzes your discord account and gives you a detailed aura report based on your profile, then puts you on a leaderboard to compete with other users\nMade in ~6 hours",
      date: "08-2024",
      status: "Finished",
      href: "https://www.aurawizard.com/",
    },
    {
      title: "Tinkering",
      description:
        "Ongoing project of constantly trying to learn and become an expert at computers.",
      date: "2018-present",
      status: "Active",
    },
  ];
</script>

<svelte:head>
  <title>Projects</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Projects</h1>
    {#each projects as project}
      <div class="mb-8">
        <div class="flex flex-row items-center gap-2">
          {#if project.href}
            <a
              href={project.href}
              target="_blank"
              class="text-rose-400 font-bold text-lg">{project.title}</a
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
