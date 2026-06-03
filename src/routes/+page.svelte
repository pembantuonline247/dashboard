<script lang="ts">
  import { onMount } from "svelte";
  import StatusCard from "$lib/components/StatusCard.svelte";
  import ClientCard from "$lib/components/ClientCard.svelte";
  import type { Client, SystemStats, UsageData } from "$lib/types";
  import { api } from "$lib/api";

  let stats: SystemStats | null = $state(null);
  let clients: Client[] = $state([]);
  let loading = $state(true);
  let usageData = $state<Map<string, UsageData>>(new Map());
  let usageLogs = $state<Map<string, any[]>>(new Map());
  let expandedClient = $state<string | null>(null);
  let logLoading = $state(false);

  onMount(async () => {
    try {
      [stats, clients] = await Promise.all([
        api.getStats(),
        api.getClients()
      ]);
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

  async function toggleLogs(clientId: string) {
    if (expandedClient === clientId) {
      expandedClient = null;
      return;
    }
    expandedClient = clientId;
    if (!usageLogs.has(clientId)) {
      logLoading = true;
      try {
        const data = await api.getUsageLogs(clientId);
        usageLogs.set(clientId, data.logs || []);
        usageLogs = new Map(usageLogs);
      } catch {}
      logLoading = false;
    }
  }

  function usagePercent(used: number, remaining: number): number {
    const total = used + remaining;
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }

  function formatTokens(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Multi-Client Bot Infrastructure</p>
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
        <a href="/subscriptions" class="btn btn-secondary">Buy Credits</a>
      </div>
      <div class="credits-grid">
        {#each clients as client}
          {@const usage = usageData.get(client.id)}
          {#if usage}
            {@const pct = usagePercent(Number(usage.ai_used), Number(usage.ai_remaining))}
            {@const total = Number(usage.ai_used) + Number(usage.ai_remaining)}
            {@const avgTokensPerSession = 5000}
            {@const estSessions = Math.floor(Number(usage.ai_remaining) * 50000 / avgTokensPerSession)}
            <div class="credit-card" class:expanded={expandedClient === client.id}>
              <button class="credit-main" onclick={() => toggleLogs(client.id)}>
                <div class="credit-header">
                  <span class="credit-name">{client.name}</span>
                  <span class="credit-badge">{Number(usage.ai_used).toFixed(1)} / {total.toFixed(1)} credits</span>
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
                  <span class="credit-pct">{pct}% used</span>
                  <span class="credit-tokens">~{formatTokens(Number(usage.ai_remaining) * 50000)} tokens left</span>
                  <span class="credit-sessions">~{estSessions} conversations</span>
                </div>
              </button>

              {#if expandedClient === client.id}
                <div class="usage-logs">
                  <h4>Recent Sessions</h4>
                  {#if logLoading}
                    <p class="log-loading">Loading...</p>
                  {:else}
                    {@const logs = usageLogs.get(client.id) || []}
                    {#if logs.length === 0}
                      <p class="log-empty">No sessions recorded yet. Start chatting with the bot.</p>
                    {:else}
                      <div class="log-table-wrap">
                        <table class="log-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Model</th>
                              <th>Input</th>
                              <th>Output</th>
                              <th>Credits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each logs as log}
                              <tr>
                                <td class="log-time">{timeAgo(log.created_at)}</td>
                                <td><span class="model-badge model-{log.tier?.toLowerCase()}">{log.tier || 'Flash'}</span></td>
                                <td>{formatTokens(log.input_tokens)}</td>
                                <td>{formatTokens(log.output_tokens)}</td>
                                <td class="log-credits">{Number(log.credits_consumed).toFixed(3)}</td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                      <div class="log-totals">
                        <span>Total: {formatTokens(logs.reduce((a, l) => a + l.input_tokens, 0))} in / {formatTokens(logs.reduce((a, l) => a + l.output_tokens, 0))} out</span>
                        <span class="log-total-credits">{logs.reduce((a, l) => a + Number(l.credits_consumed), 0).toFixed(2)} credits</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              {/if}
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
  
  .credits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
  .credit-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    overflow: hidden; transition: border-color 0.2s;
  }
  .credit-card.expanded { border-color: #6366f1; }
  .credit-main {
    width: 100%; padding: 1.25rem; background: none; border: none;
    cursor: pointer; text-align: left; color: inherit;
    display: flex; flex-direction: column; gap: 0.75rem;
  }
  .credit-main:hover { background: rgba(99,102,241,0.05); }
  .credit-empty { border-style: dashed; padding: 1.25rem; align-items: center; text-align: center; cursor: default; }
  .credit-header { display: flex; justify-content: space-between; align-items: center; }
  .credit-name { font-weight: 600; font-size: 0.9rem; color: #f1f5f9; }
  .credit-badge { font-size: 0.75rem; color: #94a3b8; background: #0f172a; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600; }
  .credit-footer { display: flex; justify-content: space-between; font-size: 0.7rem; }
  .credit-pct { color: #38bdf8; font-weight: 600; }
  .credit-tokens { color: #64748b; }
  .credit-sessions { color: #22c55e; }
  .credit-no-data { color: #64748b; font-size: 0.8rem; margin: 0; }
  .credit-link { color: #38bdf8; font-size: 0.8rem; text-decoration: none; }
  .progress-bar { height: 8px; background: #334155; border-radius: 999px; overflow: hidden; }
  .progress-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #22c55e, #38bdf8);
    transition: width 0.5s ease;
  }
  .progress-warning { background: linear-gradient(90deg, #f59e0b, #eab308); }
  .progress-danger { background: linear-gradient(90deg, #ef4444, #dc2626); }

  .usage-logs { border-top: 1px solid #334155; padding: 1rem 1.25rem; }
  .usage-logs h4 { margin: 0 0 0.75rem; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .log-loading, .log-empty { color: #64748b; font-size: 0.8rem; padding: 0.5rem 0; }
  .log-table-wrap { overflow-x: auto; }
  .log-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  .log-table th { text-align: left; padding: 0.4rem 0.5rem; color: #64748b; border-bottom: 1px solid #334155; font-weight: 600; text-transform: uppercase; }
  .log-table td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  .log-time { color: #64748b; white-space: nowrap; }
  .log-credits { font-family: monospace; color: #38bdf8; }
  .model-badge { font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; }
  .model-flash { background: rgba(34,197,94,0.15); color: #22c55e; }
  .model-pro { background: rgba(168,85,247,0.15); color: #a855f7; }
  .log-totals {
    display: flex; justify-content: space-between; padding: 0.5rem;
    font-size: 0.7rem; color: #64748b; border-top: 1px solid #1e293b; margin-top: 0.5rem;
  }
  .log-total-credits { color: #38bdf8; font-weight: 600; }

  .client-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .empty { color: #64748b; padding: 2rem; text-align: center; }
  .empty a { color: #38bdf8; }
</style>
