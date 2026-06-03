<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { api } from "$lib/api";
  import type { Product, Subscription, Client } from "$lib/types";

  let products: Product[] = $state([]);
  let subscriptions: Subscription[] = $state([]);
  let clients: Client[] = $state([]);
  let selectedClientId = $state<string>("");
  let loading = $state(true);
  let subscribing = $state<string | null>(null);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  $effect(() => {
    if (selectedClientId) {
      loadSubscriptions();
    } else {
      subscriptions = [];
    }
  });

  onMount(async () => {
    try {
      [products, clients] = await Promise.all([
        api.getProducts(),
        api.getClients()
      ]);
      if (clients.length > 0) selectedClientId = clients[0].id;
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function loadSubscriptions() {
    try {
      subscriptions = await api.getSubscriptions(selectedClientId);
    } catch { subscriptions = []; }
  }

  async function selectPlan(productId: string) {
    if (!selectedClientId) return;
    subscribing = productId;
    error = null;
    success = null;
    try {
      await api.createSubscription(selectedClientId, productId);
      success = "Plan activated successfully!";
      await loadSubscriptions();
    } catch (e: any) {
      error = e.message;
    }
    subscribing = null;
  }

  async function buyCredits(product: Product) {
    if (!selectedClientId) return;
    try {
      const result = await api.createCheckoutSession(
        selectedClientId,
        product.price,
        product.name
      );
      if (result.url) window.location.href = result.url;
    } catch (e: any) {
      error = e.message;
    }
  }

  const plans = $derived(products.filter(p => p.category === "plan" || !p.category));
  const addons = $derived(products.filter(p => p.category === "addon" || p.category === "credits"));

  function formatPrice(price: number, currency: string = "MYR") {
    return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(price);
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Products & Subscriptions</h1>
    <p class="subtitle">Browse plans and manage AI Credits</p>
  </header>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}
  {#if success}
    <div class="alert alert-success">{success}</div>
  {/if}

  <div class="client-selector">
    <label for="client-select">Client</label>
    <select id="client-select" bind:value={selectedClientId}>
      {#each clients as c}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
  </div>

  {#if loading}
    <p class="loading-text">Loading products...</p>
  {:else}
    <!-- Subscription Plans -->
    <section class="section">
      <h2>Subscription Plans</h2>
      <div class="plans-grid">
        {#each plans as product}
          <div class="plan-card">
            <div class="plan-header">
              <h3>{product.name}</h3>
              <div class="plan-price">
                <span class="price">{formatPrice(product.price, product.currency)}</span>
                <span class="interval">/{product.billing_interval || "month"}</span>
              </div>
            </div>
            <p class="plan-desc">{product.description}</p>
            <div class="plan-credits">
              🤖 {product.credits_included.toLocaleString()} AI Credits /mo
            </div>
            {#if product.features && product.features.length > 0}
              <ul class="plan-features">
                {#each product.features as feature}
                  <li>✅ {feature}</li>
                {/each}
              </ul>
            {/if}
            <button
              class="btn btn-primary"
              onclick={() => selectPlan(product.id)}
              disabled={subscribing === product.id}
            >
              {subscribing === product.id ? "Activating..." : "Select Plan"}
            </button>
          </div>
        {/each}
        {#if plans.length === 0}
          <p class="empty">No subscription plans available.</p>
        {/if}
      </div>
    </section>

    <!-- AI Credit Add-ons -->
    {#if addons.length > 0}
      <section class="section">
        <h2>AI Credit Packs</h2>
        <div class="plans-grid">
          {#each addons as addon}
            <div class="plan-card addon-card">
              <div class="plan-header">
                <h3>{addon.name}</h3>
                <div class="plan-price">
                  <span class="price">{formatPrice(addon.price, addon.currency)}</span>
                </div>
              </div>
              <p class="plan-desc">{addon.description}</p>
              <div class="plan-credits">
                ⚡ +{addon.credits_included.toLocaleString()} AI Credits
              </div>
              <button
                class="btn btn-accent"
                onclick={() => buyCredits(addon)}
              >
                Buy Now
              </button>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Subscription History -->
    {#if selectedClientId}
      <section class="section">
        <h2>Subscription History</h2>
        {#if subscriptions.length === 0}
          <p class="empty">No subscriptions yet for this client.</p>
        {:else}
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {#each subscriptions as sub}
                  <tr>
                    <td>{sub.product_name || sub.plan_type}</td>
                    <td>{sub.plan_type}</td>
                    <td>
                      <span class="badge" class:badge-active={sub.status === "active"} class:badge-cancelled={sub.status === "cancelled"}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "—"}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .page-header { margin-bottom: 1.5rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .client-selector { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
  .client-selector label { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; }
  .client-selector select {
    padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid #334155;
    background: #1e293b; color: #e2e8f0; font-size: 0.875rem; min-width: 200px;
  }
  .loading-text { color: #64748b; padding: 2rem 0; }
  .section { margin-bottom: 2rem; }
  .section h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; }
  .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .plan-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
    transition: border-color 0.2s;
  }
  .plan-card:hover { border-color: #38bdf8; }
  .plan-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
  .plan-price { margin-top: 0.5rem; }
  .price { font-size: 1.75rem; font-weight: 700; color: #38bdf8; }
  .interval { font-size: 0.875rem; color: #64748b; }
  .plan-desc { color: #94a3b8; font-size: 0.875rem; margin: 0; }
  .plan-credits { font-size: 0.9rem; color: #a78bfa; font-weight: 600; }
  .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .plan-features li { font-size: 0.8rem; color: #cbd5e1; }
  .addon-card { border-color: #7c3aed; }
  .addon-card:hover { border-color: #a78bfa; }
  .btn {
    padding: 0.65rem 1rem; border-radius: 8px; border: none;
    font-size: 0.875rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s; text-align: center;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .btn-accent { background: #7c3aed; color: #fff; }
  .btn-accent:hover:not(:disabled) { background: #6d28d9; }
  .alert {
    padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem;
  }
  .alert-error { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; }
  .alert-success { background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; color: #86efac; }
  .table-wrapper { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .data-table th, .data-table td {
    padding: 0.75rem; text-align: left; border-bottom: 1px solid #334155;
  }
  .data-table th { color: #94a3b8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
  .data-table td { color: #e2e8f0; }
  .badge {
    padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
    background: #334155; color: #94a3b8;
  }
  .badge-active { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
  .badge-cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .empty { color: #64748b; padding: 1.5rem 0; text-align: center; }
</style>
