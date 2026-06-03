<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/Sidebar.svelte";
  let { children }: { children: import("svelte").Snippet } = $props();
</script>

<Sidebar />
<main class="main">
  <div class="content">
    {@render children()}
  </div>
</main>

<style>
  .main { margin-left: 240px; min-height: 100vh; }
  .content { padding: 2rem; max-width: 1200px; }
</style>
