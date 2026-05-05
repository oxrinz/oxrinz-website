<script lang="ts">
  import Prism from "prismjs";
  import "prismjs/components/prism-python";

  export let code: string;
  export let lang: string = "python";

  $: trimmed = code.replace(/^\n+|\n+$/g, "");
  $: grammar = Prism.languages[lang] ?? Prism.languages.plain;
  $: highlighted = Prism.highlight(trimmed, grammar, lang);
</script>

<pre class="language-{lang}"><code class="language-{lang}">{@html highlighted}</code></pre>

<style>
  pre {
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
    border: 1px solid rgba(255, 105, 180, 0.15);
  }
</style>
