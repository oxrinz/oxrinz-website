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

  var range: "last_7_days" | "last_30_days" | "last_6_months" | "last_year" =
    "last_7_days";

  var summaries: Summary[] = [];
  var highest = 0;

  function lerpToLightPurple(t: number) {
    t = Math.max(0, Math.min(1, t));
    const white = { r: 255, g: 255, b: 255 };
    const lightPurple = { r: 190, g: 190, b: 220 };
    const r = Math.round(white.r + (lightPurple.r - white.r) * t);
    const g = Math.round(white.g + (lightPurple.g - white.g) * t);
    const b = Math.round(white.b + (lightPurple.b - white.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  async function getSummaries(): Promise<Summary[]> {
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().split("T")[0];

    const response = await fetch(`api/summary?start=${startDate}&end=${end}`);
    var handled_data = await response.json();
    return handled_data.data.data;
  }

  function updateStats() {
    getSummaries().then((summary_data) => {
      highest = 0;
      console.log(summary_data);
      summaries = summary_data;

      summaries.forEach((summary) => {
        if (summary.grand_total.total_seconds > highest) {
          highest = summary.grand_total.total_seconds;
        }
      });
    });
  }

  onMount(() => {
    updateStats();
    const intervalId = setInterval(updateStats, 9000);
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
  <div class="h-full flex-grow flex flex-col justify-end px-4 pb-2">
    <!-- Dominant projects -->
    <div class="flex w-full justify-between gap-2">

    </div>
    <!-- Hours spent working -->
    <div class="flex w-full justify-between gap-2">
      {#each summaries as day, i}
        <div class="w-full h-full text-center flex flex-col justify-end">
          <p class="text-xs">
            {Math.floor((day.grand_total.total_seconds / 60 / 60) * 10) / 10}hrs
          </p>
          <div
            style={"height: " +
              (day.grand_total.total_seconds / highest) * 100 +
              "px; background-color:" +
              lerpToLightPurple(day.grand_total.total_seconds / highest)}
            class="w-full"
          ></div>
          <p>
            {Math.abs(i - 8)}
          </p>
        </div>
      {/each}
    </div>
  </div>
</div>
