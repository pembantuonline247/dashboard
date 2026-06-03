<script lang="ts">
  import { onMount } from "svelte";
  import type { Invoice } from "$lib/types";
  import { api } from "$lib/api";

  let invoices: Invoice[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try { invoices = await api.getInvoices(); } catch {}
    loading = false;
  });
</script>

<div class="page">
  <header class="page-header">
    <h1>Billing</h1>
    <p class="subtitle">Client subscriptions & invoices</p>
  </header>

  <div class="stats-grid">
    <div class="card">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value">RM {invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.amount, 0).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="stat-label">Pending</div>
      <div class="stat-value warn">RM {invoices.filter(i => i.status === "pending").reduce((a, i) => a + i.amount, 0).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="stat-label">Overdue</div>
      <div class="stat-value danger">RM {invoices.filter(i => i.status === "overdue").reduce((a, i) => a + i.amount, 0).toFixed(2)}</div>
    </div>
  </div>

  {#if loading}
    <p style="color:#64748b">Loading...</p>
  {:else if invoices.length === 0}
    <div class="empty">
      <p>No invoices yet. Invoices will appear here once clients are subscribed.</p>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Client</th><th>Amount</th><th>Status</th><th>Due</th></tr>
        </thead>
        <tbody>
          {#each invoices as inv}
            <tr>
              <td>{inv.clientName}</td>
              <td>{inv.currency} {inv.amount.toFixed(2)}</td>
              <td><span class="badge badge-{inv.status === paid ? online : inv.status === pending ? pending : offline}">{inv.status}</span></td>
              <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page-header { margin-bottom: 2rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .stat-value { font-size: 1.5rem; font-weight: 700; }
  .warn { color: #f59e0b; }
  .danger { color: #ef4444; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #334155; }
  td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #1e293b; }
  .empty { text-align: center; padding: 3rem; color: #64748b; }
</style>
