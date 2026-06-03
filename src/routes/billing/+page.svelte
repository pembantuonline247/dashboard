<script lang="ts">
  import { onMount } from "svelte";
  import type { Invoice } from "$lib/types";
  import { api } from "$lib/api";

  let invoices: Invoice[] = $state([]);
  let loading = $state(true);
  let paying = $state<string | null>(null);

  onMount(async () => {
    try { invoices = await api.getInvoices(); } catch {}
    loading = false;
  });

  async function payNow(inv: Invoice) {
    paying = inv.id;
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: inv.clientId,
          amount: inv.amount,
          description: `Pembantu.Online - ${inv.clientName} Subscription`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error: " + (e as Error).message);
    }
    paying = null;
  }
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
          <tr>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each invoices as inv}
            <tr>
              <td>{inv.clientName}</td>
              <td>{inv.currency} {inv.amount.toFixed(2)}</td>
              <td>
                {#if inv.status === "paid"}
                  <span class="badge badge-online">paid</span>
                {:else if inv.status === "pending"}
                  <span class="badge badge-pending">pending</span>
                {:else}
                  <span class="badge badge-offline">{inv.status}</span>
                {/if}
              </td>
              <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
              <td>
                {#if inv.status === "pending"}
                  <button
                    class="pay-btn"
                    onclick={() => payNow(inv)}
                    disabled={paying === inv.id}
                  >
                    {paying === inv.id ? "Processing..." : "Pay Now"}
                  </button>
                {/if}
              </td>
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
  
  .pay-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .pay-btn:hover { background: #10b981; }
  .pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
