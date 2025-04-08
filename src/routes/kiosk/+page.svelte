<script lang="ts">
  import { onMount } from "svelte";

  interface SummaryStat {
    name: string;
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
    percent: number;
    total_seconds: number;
  }

  interface Summary {
    projects: SummaryStat[];
    languages: SummaryStat[];
    grand_total: {
      text: string;
      total_seconds: number;
    };
  }

  interface DominantStat {
    name: string;
    total_seconds: number;
  }

  // Add state variable to track stats visibility
  let showStats = true;

  // Function to toggle stats visibility
  function toggleStats() {
    showStats = !showStats;
  }

  var summaries: Summary[] = [];
  var daily_average: number = 0;
  var dominant_projects: DominantStat[] = [];
  var dominant_languages: DominantStat[] = [];
  var highest = 0;
  var highest_language = 0;
  var highest_project = 0;
  var total_all_days = 0;

  function lerpToAccent(t: number) {
    t = Math.max(0, Math.min(1, t));
    const white = { r: 80, g: 60, b: 20 };
    const accent = { r: 171, g: 133, b: 71 };
    const r = Math.round(white.r + (accent.r - white.r) * t);
    const g = Math.round(white.g + (accent.g - white.g) * t);
    const b = Math.round(white.b + (accent.b - white.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  async function getSummaries() {
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().split("T")[0];

    const response = await fetch(`api/summary?start=${startDate}&end=${end}`);
    var handled_data = await response.json();

    summaries = handled_data.data.data;
  }

  function updateStats() {
    getSummaries().then(() => {
      highest = 0;
      highest_language = 0;
      highest_project = 0;
      total_all_days = 0;

      dominant_languages = [];
      dominant_projects = [];

      summaries.forEach((summary) => {
        total_all_days += summary.grand_total.total_seconds;

        if (summary.grand_total.total_seconds > highest) {
          highest = summary.grand_total.total_seconds;
        }

        summary.projects.forEach((project) => {
          const matching_project = dominant_projects.find(
            (dom_project) => dom_project.name === project.name,
          );

          if (matching_project) {
            matching_project.total_seconds += project.total_seconds;
          } else {
            dominant_projects.push({
              name: project.name,
              total_seconds: project.total_seconds,
            });
          }
        });

        summary.languages.forEach((language) => {
          const matching_language = dominant_languages.find(
            (dom_language) => dom_language.name === language.name,
          );

          if (matching_language) {
            matching_language.total_seconds += language.total_seconds;
          } else {
            dominant_languages.push({
              name: language.name,
              total_seconds: language.total_seconds,
            });
          }
        });
      });

      dominant_projects = dominant_projects
        .sort((a, b) => b.total_seconds - a.total_seconds)
        .slice(0, 3);
      dominant_languages = dominant_languages
        .sort((a, b) => b.total_seconds - a.total_seconds)
        .slice(0, 4);

      if (dominant_languages.length > 0) {
        highest_language = dominant_languages[0].total_seconds;
      }

      if (dominant_projects.length > 0) {
        highest_project = dominant_projects[0].total_seconds;
      }

      highest = highest || 1;
      highest_language = highest_language || 1;
      highest_project = highest_project || 1;

      daily_average = total_all_days / 60 / 60 / 7;
      total_all_days = total_all_days / 60 / 60;
    });
  }

  onMount(() => {
    updateStats();
    const intervalId = setInterval(updateStats, 90000);
  });
</script>

<!-- Added on:click event handler to the main container -->
<div class="h-screen w-screen flex">
  <button 
    class="absolute w-full h-full z-10 opacity-0 cursor-default"
    on:click={toggleStats}
    on:keydown={(e) => e.key === 'Enter' && toggleStats()}
    aria-label={showStats ? "Hide statistics" : "Show statistics"}
  ></button>
  <div
    class="top-0 left-0 h-screen fixed -z-10 flex justify-between overflow-hidden"
  >
    <img
      src="/kiosk.jpg"
      alt="Kiosk display"
      class="max-w-full max-h-full object-cover opacity-100"
    />
    <div class="fixed w-full h-full bg-gradient-to-r from-[rgba(10,5,0,0.8)] to-transparent">

    </div>
  </div>
  
  <!-- Conditionally render stats based on showStats value -->
  {#if showStats}
  <div class="h-full w-[60%] flex justify-between flex-col py-4 px-4 gap-12">
    <!-- Quick info-->
    <div class="flex w-full justify-between gap-2 items-end">
      <div class="flex w-full justify-between flex-col gap-2">
        <div class="flex justify-between">
          <p class="text-bold text-x">
            Daily average: {Math.round(daily_average * 10) / 10} hrs
          </p>
        </div>
        <div class="relative">
          <div
            style={"width: " +
              Math.min(100, (daily_average / 6) * 100) +
              "%; background-color:" +
              lerpToAccent(daily_average / 6)}
            class="h-12 absolute opacity-25"
          ></div>
          <div class="h-12 w-full bg-yellow-200 opacity-25"></div>
        </div>
      </div>
    </div>

    <!-- Dominant languages -->
    <!-- <div class="flex w-full justify-between gap-2">
      {#each dominant_languages as language, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-sm mt-1">
            {Math.floor((language.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (language.total_seconds / highest_language) * 100 +
              "px; background-color:" +
              lerpToAccent(language.total_seconds / highest_language)}
            class="w-full"
          ></div>
          <p class="text-sm mt-1">
            {language.name}
          </p>
        </div>
      {/each}
    </div> -->

    <!-- Dominant projects -->
    <!-- <div class="flex w-full justify-between gap-2">
      {#each dominant_projects as project, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-sm mt-1">
            {Math.floor((project.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (project.total_seconds / highest_project) * 100 +
              "px; background-color:" +
              lerpToAccent(project.total_seconds / highest_project)}
            class="w-full"
          ></div>
          <p class="text-sm mt-1">
            {project.name}
          </p>
        </div>
      {/each}
    </div> -->

    <!-- Hours spent working -->
    <div class="flex w-full justify-between gap-2">
      {#each summaries as day, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-sm mt-1">
            {Math.floor((day.grand_total.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (day.grand_total.total_seconds / highest) * 100 +
              "px; background-color:" +
              lerpToAccent(day.grand_total.total_seconds / highest)}
            class="w-full opacity-50"
          ></div>
          <p class="text-sm mt-1">
            {new Date(
              new Date().setDate(new Date().getDate() + i + 1),
            ).toLocaleDateString("en-US", { weekday: "short" })}
          </p>
        </div>
      {/each}
    </div>
  </div>
  {/if}
</div>


<style>
  * {
    @apply !text-yellow-100;
  }
</style>