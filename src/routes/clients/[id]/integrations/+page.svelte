<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  const API = "/api";
  const client_id = $page.params.id;

  interface Integration {
    id: string;
    client_id: string;
    platform: string;
    enabled: boolean;
    label: string | null;
    credentials: Record<string, string>;
    created_at: string;
    updated_at: string;
  }

  const platformInfo: Record<string, { icon: string; name: string }> = {
    lazada: { icon: "🛒", name: "Lazada Open API" },
    ebay: { icon: "🏪", name: "eBay Seller API" },
    tiktok: { icon: "📱", name: "TikTok Seller API" },
    shopee: { icon: "🛍️", name: "Shopee Partner API" },
    shopify: { icon: "🛍️", name: "Shopify API" },
    woocommerce: { icon: "🔗", name: "WooCommerce API" },
  };

  const platformFormFields: Record<string, { key: string; label: string; type: string; options?: { value: string; label: string }[] }[]> = {
    lazada: [
      { key: "app_key", label: "App Key", type: "text" },
      { key: "app_secret", label: "App Secret", type: "password" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "region", label: "Region", type: "select", options: [
        { value: "MY", label: "Malaysia (MY)" },
        { value: "SG", label: "Singapore (SG)" },
        { value: "PH", label: "Philippines (PH)" },
        { value: "TH", label: "Thailand (TH)" },
        { value: "ID", label: "Indonesia (ID)" },
        { value: "VN", label: "Vietnam (VN)" },
      ]},
      { key: "label", label: "Label", type: "text" },
    ],
    ebay: [
      { key: "client_id", label: "Client ID", type: "text" },
      { key: "client_secret", label: "Client Secret", type: "password" },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
      { key: "auth_token", label: "Auth Token", type: "password" },
      { key: "site_id", label: "Site ID", type: "text" },
      { key: "environment", label: "Environment", type: "select", options: [
        { value: "production", label: "Production" },
        { value: "sandbox", label: "Sandbox" },
      ]},
    ],
    tiktok: [
      { key: "app_key", label: "App Key", type: "text" },
      { key: "app_secret", label: "App Secret", type: "password" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "shop_id", label: "Shop ID", type: "text" },
      { key: "shop_cipher", label: "Shop Cipher", type: "password" },
      { key: "region", label: "Region", type: "select", options: [
        { value: "MY", label: "Malaysia (MY)" },
        { value: "US", label: "United States (US)" },
        { value: "SG", label: "Singapore (SG)" },
        { value: "TH", label: "Thailand (TH)" },
        { value: "VN", label: "Vietnam (VN)" },
        { value: "PH", label: "Philippines (PH)" },
        { value: "ID", label: "Indonesia (ID)" },
      ]},
    ],
    shopee: [
      { key: "partner_id", label: "Partner ID", type: "text" },
      { key: "partner_key", label: "Partner Key", type: "password" },
      { key: "shop_id", label: "Shop ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "region", label: "Region", type: "select", options: [
        { value: "MY", label: "Malaysia (MY)" },
        { value: "SG", label: "Singapore (SG)" },
        { value: "PH", label: "Philippines (PH)" },
        { value: "TH", label: "Thailand (TH)" },
        { value: "ID", label: "Indonesia (ID)" },
        { value: "VN", label: "Vietnam (VN)" },
        { value: "TW", label: "Taiwan (TW)" },
      ]},
    ],
    shopify: [
      { key: "api_key", label: "API Key", type: "text" },
      { key: "api_secret", label: "API Secret", type: "password" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "shop_url", label: "Shop URL", type: "text" },
    ],
    woocommerce: [
      { key: "consumer_key", label: "Consumer Key", type: "text" },
      { key: "consumer_secret", label: "Consumer Secret", type: "password" },
      { key: "store_url", label: "Store URL", type: "text" },
    ],
  };

  const platforms = Object.keys(platformInfo);

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  let integrations: Record<string, Integration | null> = $state({});
  let loading = $state(true);
  let testingPlatform: string | null = $state(null);
  let testResults: Record<string, { ok: boolean; message: string }> = $state({});

  // Modal state
  let showModal = $state(false);
  let modalPlatform = $state("");
  let modalCredentials: Record<string, string> = $state({});
  let modalLabel = $state("");
  let saving = $state(false);
  let modalError = $state("");

  async function loadIntegrations() {
    loading = true;
    try {
      const res = await fetch(`${API}/integrations/${client_id}`, { headers: getHeaders() });
      if (res.ok) {
        const data: Integration[] = await res.json();
        const map: Record<string, Integration | null> = {};
        for (const p of platforms) map[p] = null;
        for (const integ of data) {
          map[integ.platform] = integ;
        }
        integrations = map;
      }
    } catch (e) {
      console.error("Failed to load integrations", e);
    }
    loading = false;
  }

  function openModal(platform: string) {
    modalPlatform = platform;
    const existing = integrations[platform];
    modalCredentials = {};
    if (existing) {
      modalLabel = existing.label || "";
      // Pre-fill fields that are already set (credentials are masked, but we keep the keys)
      for (const field of platformFormFields[platform]) {
        if (existing.credentials && existing.credentials[field.key]) {
          modalCredentials[field.key] = existing.credentials[field.key];
        } else {
          modalCredentials[field.key] = "";
        }
      }
    } else {
      modalLabel = "";
      for (const field of platformFormFields[platform]) {
        modalCredentials[field.key] = field.type === "select" && field.options ? field.options[0].value : "";
      }
    }
    modalError = "";
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    modalPlatform = "";
    modalCredentials = {};
    modalLabel = "";
    modalError = "";
  }

  async function saveIntegration() {
    saving = true;
    modalError = "";
    try {
      const body: Record<string, any> = {
        platform: modalPlatform,
        credentials: { ...modalCredentials },
      };
      // Remove label from credentials if it was added
      if (modalLabel) body.label = modalLabel;

      // For platforms with label field in credentials, extract it
      if (platformFormFields[modalPlatform].some(f => f.key === "label")) {
        body.label = modalCredentials["label"] || "";
        delete body.credentials["label"];
      }

      const res = await fetch(`${API}/integrations/${client_id}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await loadIntegrations();
        closeModal();
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        modalError = err.error || err.detail || "Failed to save integration";
      }
    } catch (e: any) {
      modalError = e.message || "Network error";
    }
    saving = false;
  }

  async function testConnection(platform: string) {
    testingPlatform = platform;
    testResults[platform] = { ok: false, message: "Testing..." };
    testResults = { ...testResults };
    try {
      const res = await fetch(`${API}/integrations/${client_id}/test`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      testResults[platform] = { ok: res.ok, message: data.message || (res.ok ? "Connected!" : "Failed") };
      testResults = { ...testResults };
    } catch (e: any) {
      testResults[platform] = { ok: false, message: e.message || "Connection failed" };
      testResults = { ...testResults };
    }
    testingPlatform = null;
  }

  async function toggleEnabled(platform: string, current: boolean) {
    const existing = integrations[platform];
    if (!existing) return;
    try {
      await fetch(`${API}/integrations/${client_id}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          platform,
          enabled: !current,
          credentials: existing.credentials,
          label: existing.label,
        }),
      });
      await loadIntegrations();
    } catch (e) {
      console.error("Failed to toggle", e);
    }
  }

  async function deleteIntegration(platform: string) {
    if (!confirm(`Delete ${platformInfo[platform].name} integration?`)) return;
    try {
      await fetch(`${API}/integrations/${client_id}/${platform}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      await loadIntegrations();
    } catch (e) {
      console.error("Failed to delete", e);
    }
  }

  function maskValue(val: string): string {
    if (!val || val.length <= 4) return "****";
    return val.substring(0, 4) + "****" + val.substring(val.length - 4);
  }

  onMount(loadIntegrations);
</script>

<div class="page">
  <header class="page-header">
    <div>
      <a href="/clients/{client_id}" class="back">← Back to Client</a>
      <h1>🔌 Integrations</h1>
    </div>
  </header>

  {#if loading}
    <p style="color:#64748b">Loading integrations...</p>
  {:else}
    <div class="platform-grid">
      {#each platforms as platform}
        {@const info = platformInfo[platform]}
        {@const integ = integrations[platform]}
        <div class="card platform-card">
          <div class="card-header">
            <span class="platform-icon">{info.icon}</span>
            <span class="platform-name">{info.name}</span>
            {#if integ}
              <span class="badge {integ.enabled ? 'badge-online' : 'badge-offline'}">
                {integ.enabled ? "Enabled" : "Disabled"}
              </span>
            {:else}
              <span class="badge badge-not-configured">Not Configured</span>
            {/if}
          </div>

          {#if integ}
            <div class="credential-summary">
              {#each Object.entries(integ.credentials || {}) as [key, val]}
                {#if key !== "label"}
                  <div class="cred-row">
                    <span class="cred-key">{key.replace(/_/g, " ")}</span>
                    <span class="cred-val">{maskValue(val)}</span>
                  </div>
                {/if}
              {/each}
              {#if integ.label}
                <div class="cred-row">
                  <span class="cred-key">Label</span>
                  <span class="cred-val">{integ.label}</span>
                </div>
              {/if}
            </div>
          {/if}

          <div class="card-actions">
            <button class="btn btn-sm btn-primary" onclick={() => openModal(platform)}>
              {integ ? "Edit" : "Configure"}
            </button>

            {#if integ}
              <button class="btn btn-sm btn-secondary" onclick={() => testConnection(platform)} disabled={testingPlatform === platform}>
                {testingPlatform === platform ? "Testing..." : "🔍 Test"}
              </button>

              <label class="toggle-label">
                <input type="checkbox" checked={integ.enabled} onchange={() => toggleEnabled(platform, integ.enabled)} />
                <span class="toggle-slider"></span>
              </label>

              <button class="btn btn-sm btn-danger" onclick={() => deleteIntegration(platform)}>🗑️</button>
            {/if}
          </div>

          {#if testResults[platform]}
            <div class="test-result" class:test-ok={testResults[platform].ok} class:test-fail={!testResults[platform].ok}>
              {testResults[platform].message}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Configuration Modal -->
{#if showModal}
  <div class="modal-overlay" onclick={closeModal} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
      <div class="modal-header">
        <h2>{platformInfo[modalPlatform].icon} Configure {platformInfo[modalPlatform].name}</h2>
        <button class="modal-close" onclick={closeModal}>✕</button>
      </div>

      <div class="modal-body">
        {#each platformFormFields[modalPlatform] as field}
          <div class="form-group">
            <label for="field-{field.key}">{field.label}</label>
            {#if field.type === "select" && field.options}
              <select id="field-{field.key}" bind:value={modalCredentials[field.key]}>
                {#each field.options as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            {:else}
              <input
                id="field-{field.key}"
                type={field.type}
                placeholder={field.label}
                bind:value={modalCredentials[field.key]}
              />
            {/if}
          </div>
        {/each}

        {#if modalError}
          <div class="form-error">{modalError}</div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={closeModal}>Cancel</button>
        <button class="btn btn-primary" onclick={saveIntegration} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
  .page-header h1 { margin: 0.5rem 0 0; font-size: 1.5rem; font-weight: 700; }
  .back { color: #38bdf8; font-size: 0.875rem; text-decoration: none; }
  .back:hover { text-decoration: underline; }

  .platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1rem; }

  .card {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem;
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  .card-header { display: flex; align-items: center; gap: 0.5rem; }
  .platform-icon { font-size: 1.5rem; }
  .platform-name { flex: 1; font-weight: 600; color: #e2e8f0; }

  .badge {
    font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem;
    border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .badge-online { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .badge-offline { background: rgba(250, 204, 21, 0.15); color: #eab308; }
  .badge-not-configured { background: rgba(100, 116, 139, 0.2); color: #64748b; }

  .credential-summary { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem; background: #0f172a; border-radius: 8px; }
  .cred-row { display: flex; justify-content: space-between; font-size: 0.75rem; }
  .cred-key { color: #64748b; text-transform: capitalize; }
  .cred-val { color: #94a3b8; font-family: monospace; }

  .card-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

  .btn {
    padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500;
    border: none; cursor: pointer; transition: all 0.2s;
  }
  .btn-sm { padding: 0.35rem 0.65rem; font-size: 0.75rem; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: #334155; color: #e2e8f0; }
  .btn-secondary:hover { background: #475569; }
  .btn-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .btn-danger:hover { background: rgba(239, 68, 68, 0.3); }

  .toggle-label { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; }
  .toggle-label input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; inset: 0; background: #475569; border-radius: 20px; transition: 0.3s;
  }
  .toggle-slider::before {
    content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px;
    background: #fff; border-radius: 50%; transition: 0.3s;
  }
  .toggle-label input:checked + .toggle-slider { background: #22c55e; }
  .toggle-label input:checked + .toggle-slider::before { transform: translateX(16px); }

  .test-result { font-size: 0.75rem; padding: 0.35rem 0.5rem; border-radius: 6px; }
  .test-ok { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
  .test-fail { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .modal {
    background: #1e293b; border: 1px solid #334155; border-radius: 12px;
    width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.25rem 1.5rem; border-bottom: 1px solid #334155;
  }
  .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
  .modal-close { background: none; border: none; color: #64748b; font-size: 1.25rem; cursor: pointer; }
  .modal-close:hover { color: #e2e8f0; }
  .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .modal-footer {
    display: flex; justify-content: flex-end; gap: 0.5rem;
    padding: 1rem 1.5rem; border-top: 1px solid #334155;
  }

  .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .form-group label { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
  .form-group input, .form-group select {
    padding: 0.6rem 0.75rem; border-radius: 6px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; font-size: 0.875rem;
    outline: none; transition: border-color 0.2s;
  }
  .form-group input:focus, .form-group select:focus { border-color: #38bdf8; }
  .form-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.8rem; padding: 0.5rem; border-radius: 6px; }
</style>
