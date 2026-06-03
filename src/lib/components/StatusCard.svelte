<script lang="ts">
  let { title, value, icon, color = "#38bdf8" }: { title: string; value: string; icon: string; color?: string } = $props();
</script>

<div class="card">
  <div class="card-header">
    <span class="card-icon" style="color: {color}">{icon}</span>
    <span class="card-title">{title}</span>
  </div>
  <div class="card-value" style="color: {color}">{value}</div>
</div>

<style>
  .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .card-icon { font-size: 1.25rem; }
  .card-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
  .card-value { font-size: 1.75rem; font-weight: 700; }
</style>
