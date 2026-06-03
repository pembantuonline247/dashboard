<script lang="ts">
  import { onMount } from "svelte";
  import StatusCard from "$lib/components/StatusCard.svelte";
  import ClientCard from "$lib/components/ClientCard.svelte";
  import type { Client, SystemStats } from "$lib/types";
  import { api } from "$lib/api";

  let stats: SystemStats | null = $state(null);
  let clients: Client[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      [stats, clients] = await Promise.all([
        api.getStats(),
        api.getClients()
      ]);
    } catch { /* offline */ }
    loading = false;
  });
</script>

<div class="page">
  <header class="page-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Multi-Client Bot Infrastructure Overview</p>
  </header>

  {#if loading}
    <p style="color:#64748b">Loading...</p>
  {:else}
    <div class="stats-grid">
      <StatusCard title="Active Clients" value={String(clients.length)} icon="👥" />
      <StatusCard title="WhatsApp Connected" value={String(clients.filter(c => c.whatsappConnected).length)} icon="📱" color="#22c55e" />
      <StatusCard title="Messages Today" value={String(clients.reduce((a, c) => a + c.usage.messages, 0))} icon="💬" color="#f59e0b" />
      <StatusCard title="Server RAM" value={stats ? `${(stats.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB` : "N/A"} icon="🧠" color="#a78bfa" />
    </div>

    <section class="section">
      <div class="section-header">
        <h2>Recent Clients</h2>
        <a href="/clients" class="btn btn-secondary">View All</a>
      </div>
      <div class="client-list">
        {#each clients.slice(0, 4) as client}
          <ClientCard {client} />
        {/each}
        {#if clients.length === 0}
          <p class="empty">No clients yet. <a href="/clients">Add your first client</a></p>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .page-header { margin-bottom: 2rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .section-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
  .client-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .empty { color: #64748b; padding: 2rem; text-align: center; }
  .empty a { color: #38bdf8; }
</style>
