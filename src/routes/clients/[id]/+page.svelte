<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { Client } from "$lib/types";
  import { api } from "$lib/api";

  let client: Client | null = $state(null);
  let loading = $state(true);
  let qrCode = $state("");

  onMount(async () => {
    try {
      client = await api.getClient($page.params.id);
    } catch {}
    loading = false;
  });

  async function linkWhatsApp() {
    try {
      const res = await api.getWhatsAppQR(client!.id);
      qrCode = res.qr;
    } catch {}
  }

  async function deleteClient() {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    await api.deleteClient(client!.id);
    goto("/clients");
  }
</script>

<div class="page">
  {#if loading}
    <p style="color:#64748b">Loading...</p>
  {:else if client}
    <header class="page-header">
      <div>
        <a href="/clients" class="back">← Clients</a>
        <h1>{client.name}</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" onclick={linkWhatsApp}>
          📱 Link WhatsApp
        </button>
        <a href="/clients/{$page.params.id}/website" class="btn btn-primary">🌐 Website</a>
        <button class="btn btn-danger" onclick={deleteClient}>Delete</button>
      </div>
    </header>

    <div class="detail-grid">
      <div class="card">
        <h3>Status</h3>
        <div class="status-row">
          <span class="badge {client.whatsappConnected ? badge-online : badge-offline}">
            WhatsApp: {client.whatsappConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div class="info-row"><span>Plan:</span><span>{client.plan}</span></div>
        <div class="info-row"><span>Created:</span><span>{new Date(client.createdAt).toLocaleDateString()}</span></div>
      </div>

      <div class="card">
        <h3>Usage</h3>
        <div class="usage-grid">
          <div class="metric">
            <span class="metric-value">{client.usage.messages}</span>
            <span class="metric-label">Messages</span>
          </div>
          <div class="metric">
            <span class="metric-value">{client.usage.sessions}</span>
            <span class="metric-label">Sessions</span>
          </div>
        </div>
      </div>

      {#if qrCode}
        <div class="card qr-card">
          <h3>Scan to Link WhatsApp</h3>
          <div class="qr-container">
            <img src={qrCode} alt="WhatsApp QR" />
          </div>
          <p class="qr-hint">Scan this QR code with WhatsApp on your phone</p>
        </div>
      {/if}
    </div>
  {:else}
    <p style="color:#ef4444">Client not found</p>
  {/if}
</div>

<style>
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
  .page-header h1 { margin: 0.5rem 0 0; font-size: 1.5rem; font-weight: 700; }
  .back { color: #38bdf8; font-size: 0.875rem; text-decoration: none; }
  .back:hover { text-decoration: underline; }
  .header-actions { display: flex; gap: 0.5rem; }
  .detail-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .card h3 { margin: 0 0 1rem; font-size: 0.875rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .status-row { margin-bottom: 1rem; }
  .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.875rem; border-bottom: 1px solid #334155; }
  .info-row:last-child { border-bottom: none; }
  .info-row span:last-child { color: #e2e8f0; font-weight: 500; }
  .usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .metric { text-align: center; padding: 1rem; background: #0f172a; border-radius: 8px; }
  .metric-value { display: block; font-size: 1.5rem; font-weight: 700; color: #38bdf8; }
  .metric-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
  .qr-card { text-align: center; }
  .qr-container { margin: 1rem auto; max-width: 250px; }
  .qr-container img { width: 100%; border-radius: 8px; }
  .qr-hint { font-size: 0.8rem; color: #64748b; }
</style>
