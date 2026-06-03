<script lang="ts">
  import { onMount } from "svelte";
  import StatusCard from "$lib/components/StatusCard.svelte";
  import ClientCard from "$lib/components/ClientCard.svelte";
  import type { Client, SystemStats, UsageData } from "$lib/types";
  import { api } from "$lib/api";

  let stats: SystemStats | null = $state(null);
  let clients: Client[] = $state([]);
  let loading = $state(true);
  let usageData: Map<string, UsageData> = $state(new Map());

  onMount(async () => {
    try {
      [stats, clients] = await Promise.all([
        api.getStats(),
        api.getClients()
      ]);
      // Load AI Credits usage for all clients
      const usagePromises = clients.map(async (c) => {
        try {
          const u = await api.getUsage(c.id);
          usageData.set(c.id, u);
        } catch { /* no usage data */ }
      });
      await Promise.all(usagePromises);
      usageData = new Map(usageData);
    } catch { /* offline */ }
    loading = false;
  });

  function usagePercent(used: number, remaining: number): number {
    const total = used + remaining;
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }
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

    <!-- AI Credits Usage Section -->
    <section class="section">
      <div class="section-header">
        <h2>AI Credits Usage</h2>
        <a href="/subscriptions" class="btn btn-secondary">Manage Credits</a>
      </div>
      <div class="credits-grid">
        {#each clients as client}
          {@const usage = usageData.get(client.id)}
          {#if usage}
            {@const pct = usagePercent(Number(usage.ai_used), Number(usage.ai_remaining))}
            {@const total = Number(usage.ai_used) + Number(usage.ai_remaining)}
            <div class="credit-card">
              <div class="credit-header">
                <span class="credit-name">{client.name}</span>
                <span class="credit-count">{Number(usage.ai_used).toLocaleString()} / {total.toLocaleString()}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  class:progress-warning={pct > 60 && pct < 85}
                  class:progress-danger={pct >= 85}
                  style="width: {Math.min(pct, 100)}%"
                ></div>
              </div>
              <div class="credit-footer">
                <span class="credit-pct">{pct}% consumed</span>
                <span class="credit-remaining">{Number(usage.ai_remaining).toLocaleString()} remaining</span>
              </div>
            </div>
          {:else}
            <div class="credit-card credit-empty">
              <div class="credit-header">
                <span class="credit-name">{client.name}</span>
              </div>
              <p class="credit-no-data">No active subscription</p>
              <a href="/subscriptions" class="credit-link">Subscribe →</a>
            </div>
          {/if}
        {/each}
      </div>
    </section>

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
  .section { margin-bottom: 2rem; }
  .btn-secondary {
    padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155;
    background: #1e293b; color: #94a3b8; font-size: 0.8rem; cursor: pointer;
    text-decoration: none; transition: all 0.2s;
  }
  .btn-secondary:hover { background: #334155; color: #e2e8f0; }
  .credits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .credit-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
  }
  .credit-empty { border-style: dashed; align-items: center; text-align: center; }
  .credit-header { display: flex; justify-content: space-between; align-items: center; }
  .credit-name { font-weight: 600; font-size: 0.9rem; color: #f1f5f9; }
  .credit-count { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
  .credit-footer { display: flex; justify-content: space-between; font-size: 0.75rem; }
  .credit-pct { color: #38bdf8; font-weight: 600; }
  .credit-remaining { color: #64748b; }
  .credit-no-data { color: #64748b; font-size: 0.8rem; margin: 0; }
  .credit-link { color: #38bdf8; font-size: 0.8rem; text-decoration: none; }
  .credit-link:hover { text-decoration: underline; }
  .progress-bar {
    height: 8px; background: #334155; border-radius: 999px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #22c55e, #38bdf8);
    transition: width 0.5s ease;
  }
  .progress-warning { background: linear-gradient(90deg, #f59e0b, #eab308); }
  .progress-danger { background: linear-gradient(90deg, #ef4444, #dc2626); }
  .client-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .empty { color: #64748b; padding: 2rem; text-align: center; }
  .empty a { color: #38bdf8; }
</style>
