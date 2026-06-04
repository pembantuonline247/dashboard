<script lang="ts">
  import { onMount } from "svelte";

  let { clientId = "" }: { clientId: string } = $props();
  let files = $state<any[]>([]);
  let uploading = $state(false);

  async function loadFiles() {
    try {
      const res = await fetch("/api/media/" + clientId + "/list");
      const data = await res.json();
      files = data.files || [];
    } catch (e) {
      console.error("Failed to load media", e);
    }
  }

  async function handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const selected = input.files;
    if (!selected || !selected.length) return;
    uploading = true;
    const form = new FormData();
    for (const f of selected) {
      form.append("files", f);
    }
    await fetch("/api/media/" + clientId + "/upload", { method: "POST", body: form });
    await loadFiles();
    uploading = false;
  }

  onMount(loadFiles);
</script>

<div class="media-upload">
  <h3 class="section-title">Media Management</h3>
  <input type="file" multiple onchange={handleChange} />
  {#if uploading}<p>Uploading...</p>{/if}
  <ul class="file-list">
    {#each files as f}<li>{f.name} - {(f.size / 1024).toFixed(1)} KB - {f.type}</li>{/each}
  </ul>
</div>

<style>
  .media-upload { margin-top: 1rem; }
  .section-title { font-weight: 600; margin-bottom: 0.5rem; }
  .file-list { list-style: none; padding-left: 0; margin-top: 0.5rem; }
  .file-list li { margin-bottom: 0.3rem; }
</style>
