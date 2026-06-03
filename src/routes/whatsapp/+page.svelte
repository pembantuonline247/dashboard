<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import type { Client, WhatsAppConfig } from "$lib/types";

  let clients: Client[] = $state([]);
  let selectedClientId = $state<string>("");
  let config: WhatsAppConfig = $state({ whatsapp: null, whatsapp_connected: false, status: null });
  let whatsappNumber = $state("");
  let autoReconnect = $state(false);
  let reconnectInterval = $state(5);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  $effect(() => {
    if (selectedClientId) {
      loadConfig();
    }
  });

  onMount(async () => {
    try {
      clients = await api.getClients();
      if (clients.length > 0) selectedClientId = clients[0].id;
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function loadConfig() {
    try {
      const c = await api.getWhatsAppConfig(selectedClientId);
      config = c;
      whatsappNumber = c.whatsapp || "";
    } catch {
      config = { whatsapp: null, whatsapp_connected: false, status: null };
      whatsappNumber = "";
    }
  }

  async function saveConfig() {
    if (!selectedClientId || !whatsappNumber.trim()) {
      error = "WhatsApp number is required";
      return;
    }
    saving = true;
    error = null;
    success = null;
    try {
      await api.saveWhatsAppConfig(selectedClientId, {
        whatsapp: whatsappNumber.trim(),
        auto_reconnect: autoReconnect,
        reconnect_interval_minutes: reconnectInterval,
      });
      success = "WhatsApp configuration saved!";
      await loadConfig();
    } catch (e: any) {
      error = e.message;
    }
    saving = false;
  }

  function statusBadgeClass(status: string | boolean | null): string {
    if (status === true || status === "connected") return "status-connected";
    if (status === "pending" || status === "connecting") return "status-pending";
    return "status-disconnected";
  }

  function statusLabel(status: string | boolean | null): string {
    if (status === true || status === "connected") return "Connected";
    if (status === "pending" || status === "connecting") return "Connecting";
    return "Disconnected";
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>WhatsApp Configuration</h1>
    <p class="subtitle">Manage WhatsApp connections for your clients</p>
  </header>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}
  {#if success}
    <div class="alert alert-success">{success}</div>
  {/if}

  {#if loading}
    <p class="loading-text">Loading...</p>
  {:else}
    <div class="config-card">
      <div class="form-group">
        <label for="client-select">Client</label>
        <select id="client-select" bind:value={selectedClientId}>
          {#each clients as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="wa-number">WhatsApp Number</label>
        <input
          id="wa-number"
          type="text"
          bind:value={whatsappNumber}
          placeholder="e.g. 60123456789"
        />
        <span class="form-hint">Include country code without + sign</span>
      </div>

      <div class="form-group">
        <label>Connection Status</label>
        <div class="status-row">
          <span class="status-badge {statusBadgeClass(config.whatsapp_connected || config.status)}">
            <span class="status-dot"></span>
            {statusLabel(config.whatsapp_connected || config.status)}
          </span>
          {#if config.status === "pending" || config.status === "connecting"}
            <span class="status-hint">Waiting for QR scan...</span>
          {/if}
        </div>
      </div>

      <!-- QR Code Placeholder -->
      <div class="form-group">
        <label>QR Code</label>
        <div class="qr-placeholder">
          <div class="qr-icon">📱</div>
          <p>QR code will appear here when connecting</p>
          <span class="qr-hint">Scan with WhatsApp to link the device</span>
        </div>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={autoReconnect} />
          <span>Auto-Reconnect</span>
        </label>
        <span class="form-hint">Automatically reconnect if connection drops</span>
      </div>

      {#if autoReconnect}
        <div class="form-group">
          <label for="reconnect-interval">Reconnect Interval (minutes)</label>
          <input
            id="reconnect-interval"
            type="number"
            bind:value={reconnectInterval}
            min="1"
            max="60"
          />
        </div>
      {/if}

      <button class="btn btn-primary" onclick={saveConfig} disabled={saving}>
        {saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  {/if}
</div>

<style>
  .page-header { margin-bottom: 1.5rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .loading-text { color: #64748b; padding: 2rem 0; }
  .config-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    padding: 1.5rem; max-width: 560px; display: flex; flex-direction: column; gap: 1.25rem;
  }
  .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .form-group label { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; }
  .form-group select,
  .form-group input[type="text"],
  .form-group input[type="number"] {
    padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; font-size: 0.875rem;
  }
  .form-group select:focus,
  .form-group input:focus { outline: none; border-color: #38bdf8; }
  .form-hint { font-size: 0.75rem; color: #64748b; }
  .status-row { display: flex; align-items: center; gap: 1rem; }
  .status-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.35rem 0.75rem; border-radius: 999px;
    font-size: 0.8rem; font-weight: 600;
  }
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%; display: inline-block;
  }
  .status-connected { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
  .status-connected .status-dot { background: #22c55e; }
  .status-pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
  .status-pending .status-dot { background: #eab308; animation: pulse 1.5s infinite; }
  .status-disconnected { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .status-disconnected .status-dot { background: #ef4444; }
  .status-hint { font-size: 0.8rem; color: #94a3b8; }
  .qr-placeholder {
    border: 2px dashed #334155; border-radius: 12px;
    padding: 2rem; text-align: center; display: flex;
    flex-direction: column; align-items: center; gap: 0.5rem;
  }
  .qr-icon { font-size: 3rem; opacity: 0.5; }
  .qr-placeholder p { color: #94a3b8; font-size: 0.875rem; margin: 0; }
  .qr-hint { color: #64748b; font-size: 0.75rem; }
  .toggle-label {
    display: flex; align-items: center; gap: 0.75rem;
    cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #e2e8f0;
  }
  .toggle-label input[type="checkbox"] {
    width: 18px; height: 18px; accent-color: #38bdf8;
  }
  .btn {
    padding: 0.65rem 1.5rem; border-radius: 8px; border: none;
    font-size: 0.875rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s; text-align: center; align-self: flex-start;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .alert {
    padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem;
  }
  .alert-error { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; }
  .alert-success { background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; color: #86efac; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
