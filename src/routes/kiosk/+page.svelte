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

  async function getSummaries(): Promise<Summary[]> {
    const now = new Date();
    const end = now.toISOString().split("T")[0]; 
    const start = new Date(now);
    start.setDate(start.getDate() - 10);
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
    const intervalId = setInterval(updateStats, 900000);
  });
</script>

<div
  class="top-0 left-0 w-screen h-screen flex justify-between overflow-hidden absolute"
>
  <img
    src="/kiosk.png"
    alt="Kiosk display"
    class="max-w-full max-h-full object-contain"
  />
</div>
<div class="h-full w-full flex flex-col justify-end absolute">
  <!-- Recent activity -->
  <div class="flex w-full justify-between gap-2">
    {#each summaries as day, i}
      <div class="w-full h-full text-center flex flex-col justify-end">
        <p class="text-xs">
          {day.grand_total.text}
        </p>
        <div
          style={"height: " +
            (day.grand_total.total_seconds / highest) * 100 +
            "px"}
          class="bg-primary w-full"
        ></div>
        <p>
          {Math.abs(i - 8)}
        </p>
      </div>
    {/each}
  </div>
</div>
