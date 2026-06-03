 <script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { Client } from "$lib/types";
  import { api } from "$lib/api";

  let client: Client | null = $state(null);
  let loading = $state(true);
  let qrCode = $state("");

  // WhatsApp editor state
  let editingWhatsApp = $state(false);
  let whatsappNumber = $state("");
  let whatsappSaving = $state(false);
  let whatsappMessage = $state("");
  let whatsappMessageType = $state<"success" | "error" | "">("");
  let connectingWhatsApp = $state(false);

  onMount(async () => {
    try {
      client = await api.getClient($page.params.id);
      if (client?.whatsapp) {
        whatsappNumber = client.whatsapp;
      }
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

  async function saveWhatsApp() {
    if (!whatsappNumber.trim()) {
      whatsappMessage = "Please enter a WhatsApp number";
      whatsappMessageType = "error";
      return;
    }

    // Basic E.164 validation
    const cleaned = whatsappNumber.replace(/[^0-9+]/g, "");
    if (!cleaned.startsWith("+") || cleaned.length < 10) {
      whatsappMessage = "Number must be in E.164 format (e.g., +60123456789)";
      whatsappMessageType = "error";
      return;
    }

    whatsappSaving = true;
    whatsappMessage = "";
    try {
      const res = await fetch("/api/whatsapp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ client_id: client!.id, whatsapp: cleaned }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      whatsappNumber = cleaned;
      if (client) {
        client = { ...client, whatsapp: cleaned, whatsappConnected: false };
      }
      editingWhatsApp = false;
      whatsappMessage = "WhatsApp number saved!";
      whatsappMessageType = "success";
    } catch (e) {
      whatsappMessage = (e as any)?.message || "Failed to save number";
      whatsappMessageType = "error";
    }
    whatsappSaving = false;
  }

  async function connectWhatsApp() {
    connectingWhatsApp = true;
    whatsappMessage = "";
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ client_id: client!.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");

      if (data.qr) {
        qrCode = data.qr;
      }
      whatsappMessage = data.message || "WhatsApp connection initiated";
      whatsappMessageType = "success";
    } catch (e) {
      whatsappMessage = (e as any)?.message || "Failed to connect";
      whatsappMessageType = "error";
    }
    connectingWhatsApp = false;
  }

  async function testBot() {
    whatsappMessage = "Sending test to bot...";
    whatsappMessageType = "";
    try {
      const res = await fetch(`/api/chat/${client!.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ message: "Hello! This is a test message to confirm the bot is working. Please respond briefly." }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      whatsappMessage = `Bot test successful! Reply: ${data.reply?.slice(0, 100)}...`;
      whatsappMessageType = "success";
    } catch (e) {
      whatsappMessage = (e as any)?.message || "Test failed";
      whatsappMessageType = "error";
    }
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
        <button class="btn btn-primary" onclick={() => editingWhatsApp = !editingWhatsApp}>
          {editingWhatsApp ? "Close" : "✎ WhatsApp"}
        </button>
        <button class="btn btn-primary" onclick={linkWhatsApp}>
          📱 Link WhatsApp
        </button>
        <a href="/clients/{$page.params.id}/website" class="btn btn-primary">🌐 Website</a>
        <a href="/clients/{$page.params.id}/integrations" class="btn btn-primary">🔌 Integrations</a>
        <button class="btn btn-danger" onclick={deleteClient}>Delete</button>
      </div>
    </header>

    <div class="detail-grid">
      <div class="card">
        <h3>Status</h3>
        <div class="status-row">
          <span class="badge" class:badge-online={client.whatsappConnected} class:badge-offline={!client.whatsappConnected}>
            WhatsApp: {client.whatsappConnected ? "Connected" : "Disconnected"}
          </span>
          <span class="badge" class:badge-active={client.status === "online"} class:badge-pending={client.status !== "online"}>
            Status: {client.status}
          </span>
        </div>
        <div class="info-row"><span>WhatsApp:</span><span>{client.whatsapp || "Not set"}</span></div>
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

      {#if editingWhatsApp}
        <div class="card whatsapp-card">
          <h3>Edit WhatsApp Number</h3>
          <div class="whatsapp-form">
            <label for="whatsapp-input">WhatsApp Number (E.164 format)</label>
            <div class="input-group">
              <input
                id="whatsapp-input"
                type="text"
                bind:value={whatsappNumber}
                placeholder="+60123456789"
                class="whatsapp-input"
              />
            </div>
            <p class="hint">Enter number in international format (e.g., +60175797694)</p>
            <div class="whatsapp-actions">
              <button class="btn btn-primary" onclick={saveWhatsApp} disabled={whatsappSaving}>
                {whatsappSaving ? "Saving..." : "💾 Save Number"}
              </button>
              <button class="btn btn-secondary" onclick={connectWhatsApp} disabled={connectingWhatsApp || !client.whatsapp}>
                {connectingWhatsApp ? "Connecting..." : "🔗 Connect WhatsApp"}
              </button>
              <button class="btn btn-secondary" onclick={testBot}>
                🤖 Test Bot
              </button>
            </div>
            {#if whatsappMessage}
              <p class="whatsapp-message" class:success={whatsappMessageType === "success"} class:error={whatsappMessageType === "error"}>
                {whatsappMessage}
              </p>
            {/if}
          </div>
        </div>
      {/if}

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
  .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .detail-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .card h3 { margin: 0 0 1rem; font-size: 0.875rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .status-row { margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
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
  .whatsapp-card { border-color: #25D366; }
  .whatsapp-form { display: flex; flex-direction: column; gap: 0.75rem; }
  .whatsapp-form label { font-size: 0.875rem; color: #e2e8f0; font-weight: 500; }
  .input-group { display: flex; align-items: center; }
  .whatsapp-input {
    width: 100%; padding: 0.6rem 0.75rem; border-radius: 8px;
    border: 1px solid #334155; background: #0f172a; color: #e2e8f0;
    font-size: 0.9rem; outline: none;
    font-family: monospace;
  }
  .whatsapp-input:focus { border-color: #25D366; box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2); }
  .hint { font-size: 0.75rem; color: #64748b; margin: 0; }
  .whatsapp-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .whatsapp-message { font-size: 0.8rem; padding: 0.5rem; border-radius: 6px; margin: 0; }
  .whatsapp-message.success { background: rgba(37, 211, 102, 0.1); color: #4ade80; }
  .whatsapp-message.error { background: rgba(239, 68, 68, 0.1); color: #f87171; }
  .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .badge-online, .badge-active { background: rgba(37, 211, 102, 0.15); color: #4ade80; }
  .badge-offline, .badge-pending { background: rgba(239, 68, 68, 0.1); color: #f87171; }
  .btn { padding: 0.4rem 0.85rem; border-radius: 8px; border: none; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.3rem; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: #334155; color: #e2e8f0; }
  .btn-secondary:hover:not(:disabled) { background: #475569; }
  .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-danger { background: transparent; color: #ef4444; border: 1px solid #ef4444; }
  .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
</style>
