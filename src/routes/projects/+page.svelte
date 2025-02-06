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
          "A vndb \"alternative\"\nWorks as a great vndb alternative, using the data from vndb with a few extra features and improvements",
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
  
  <style>
    .project {
      margin-bottom: 2rem;
    }
  
    .project-title {
      color: #f43f5e; /* Rose-400 */
      font-weight: bold;
      font-size: 1.2rem;
    }
  
    .project-status {
      color: #fecdd3; /* Rose-200 */
      font-weight: bold;
    }
  </style>
  
  <svelte:head>
    <title>Projects</title>
  </svelte:head>
  
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-6">
      <h1>Projects</h1>
      {#each projects as project}
        <div class="project">
          <div class="flex flex-row items-center gap-2">
            {#if project.href}
              <a href={project.href} target="_blank" class="project-title">{project.title}</a>
            {:else}
              <h3 class="project-title">{project.title}</h3>
            {/if}
            <p class="text-sm text-rose-400/50">({project.date})</p>
          </div>
          <p>{project.description}</p>
          <p>
            <span>Status: </span>
            <span class="project-status">{project.status}</span>
          </p>
        </div>
      {/each}
    </div>
  </div>
  