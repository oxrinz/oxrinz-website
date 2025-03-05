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

  var summaries: Summary[] = [];
  var daily_average: number = 0;
  var dominant_projects: DominantStat[] = [];
  var dominant_languages: DominantStat[] = [];
  var highest = 0;

  function lerpToLightPurple(t: number) {
    t = Math.max(0, Math.min(1, t));
    const white = { r: 90, g: 90, b: 140 };
    const lightPurple = { r: 220, g: 220, b: 250 };
    const r = Math.round(white.r + (lightPurple.r - white.r) * t);
    const g = Math.round(white.g + (lightPurple.g - white.g) * t);
    const b = Math.round(white.b + (lightPurple.b - white.b) * t);
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
    daily_average = handled_data.data.daily_average.seconds;
  }

  function updateStats() {
    getSummaries().then(() => {
      highest = 0;

      summaries.forEach((summary) => {
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
            (dom_project) => dom_project.name === language.name,
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

        dominant_projects = dominant_projects
          .sort((a, b) => b.total_seconds - a.total_seconds)
          .slice(0, 5);
        dominant_languages = dominant_languages
          .sort((a, b) => b.total_seconds - a.total_seconds)
          .slice(0, 6);
      });
    });
  }

  onMount(() => {
    updateStats();
    const intervalId = setInterval(updateStats, 90000);
  });
</script>

<div class="h-screen w-screen flex">
  <div class="top-0 left-0 h-screen flex justify-between overflow-hidden">
    <img
      src="/kiosk.png"
      alt="Kiosk display"
      class="max-w-full max-h-full object-contain"
    />
  </div>
  <div class="h-full flex-grow flex flex-col justify-evenly px-4 pb-2 gap-12">
    <!-- Quick info-->
    <div class="flex w-full justify-between flex-col gap-2">
      <div class="flex justify-between">
        <h1 class="text-bold text-xl">
          Daily average: {Math.round((daily_average / 60 / 60) * 10) / 10} hrs
        </h1>
        <h1 class="text-bold text-xl">
          6 hrs
        </h1>
      </div>
      <div class="relative">
        <div
          style={"width: " +
            (daily_average / highest) * 100 +
            "%; background-color:" +
            lerpToLightPurple(daily_average / highest)}
          class="h-12 absolute"
        ></div>
        <div class="h-12 w-full bg-indigo-200 opacity-25"></div>
      </div>
    </div>

    <!-- Dominant languages -->
    <div class="flex w-full justify-between gap-2">
      {#each dominant_languages as language, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-sm mt-1">
            {Math.floor((language.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (language.total_seconds / highest) * 100 +
              "px; background-color:" +
              lerpToLightPurple(language.total_seconds / highest)}
            class="w-full"
          ></div>
          <p class="text-sm mt-1">
            {language.name}
          </p>
        </div>
      {/each}
    </div>

    <!-- Dominant projects -->
    <div class="flex w-full justify-between gap-2">
      {#each dominant_projects as project, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-sm mt-1">
            {Math.floor((project.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (project.total_seconds / highest) * 100 +
              "px; background-color:" +
              lerpToLightPurple(project.total_seconds / highest)}
            class="w-full"
          ></div>
          <p class="text-sm mt-1">
            {project.name}
          </p>
        </div>
      {/each}
    </div>

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
              lerpToLightPurple(day.grand_total.total_seconds / highest)}
            class="w-full"
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
</div>
