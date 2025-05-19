<script>
  import Divider from "$lib/components/divider.svelte";
</script>

<svelte:head>
  <title>Anki</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <h1 class="text-2xl font-bold">Anki</h1>
  <p>
    I have a public generalist tech deck <a
      href="https://ankiweb.net/shared/info/1279708453">here</a
    >. It's my only tech deck that includes all domains that I study.
    <br />
    <br />
    A few example cards taken from the deck:
    <br />
    <br />
  </p>
  <h4>What does it mean for a set S⊆D to be effectively decidable?</h4>
  <p>
    A set S⊆D is effectively decidable if there exists a computable procedure
    that, given any x∈D, always halts and answers "yes" if x∈S, and "no" if x∉S
  </p>
  <Divider />
  <h4>What is the primary purpose of Tomasulo's Algorithm?</h4>
  <p>
    To enable out-of-order execution in CPUs, improving instruction-level
    parallelism by dynamically scheduling instructions to reduce data hazard
    delays.
  </p>
  <Divider />
  <h4>How does a reservation station differ from a reorder buffer?</h4>
  <p>
    A reservation station holds instructions before execution, tracking operands
    and dispatching when ready, while a reorder buffer ensures instructions
    commit in program order after execution to maintain correct program
    semantics.
  </p>
  <Divider />
  <h4>
    What happens if a branch instruction is not found in the Branch Target
    Buffer (BTB)?
  </h4>
  <p>
    If a branch is not in the BTB, the CPU may assume it’s not a branch or use a
    default prediction (e.g., not taken), potentially causing a misprediction
    and pipeline stall.
  </p>
</div>
