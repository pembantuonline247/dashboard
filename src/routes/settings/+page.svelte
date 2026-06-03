<script lang="ts">
  let stripeKey = $state("");
  let saved = $state(false);

  function save() {
    saved = true;
    setTimeout(() => saved = false, 2000);
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Settings</h1>
    <p class="subtitle">Platform configuration</p>
  </header>

  <div class="settings-grid">
    <div class="card">
      <h3>Stripe FPX</h3>
      <p class="desc">Configure Stripe payment gateway for Malaysian FPX</p>
      <label>Stripe Secret Key</label>
      <input class="input" type="password" bind:value={stripeKey} placeholder="sk_live_..." />
      <button class="btn btn-primary" onclick={save} style="margin-top:1rem">
        {saved ? "✓ Saved" : "Save"}
      </button>
    </div>

    <div class="card">
      <h3>System Info</h3>
      <div class="info-row"><span>Host</span><span>Kamatera SG</span></div>
      <div class="info-row"><span>OpenClaw</span><span>2026.5.6</span></div>
      <div class="info-row"><span>PostgreSQL</span><span>16.14</span></div>
      <div class="info-row"><span>Ubuntu</span><span>24.04 LTS</span></div>
    </div>
  </div>
</div>

<style>
  .page-header { margin-bottom: 2rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .settings-grid { display: grid; gap: 1rem; max-width: 600px; }
  .card h3 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
  .desc { font-size: 0.8rem; color: #64748b; margin-bottom: 1rem; }
  label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.375rem; font-weight: 500; }
  .info-row { display: flex; justify-content: space-between; padding: 0.75rem 0; font-size: 0.875rem; border-bottom: 1px solid #334155; }
  .info-row:last-child { border-bottom: none; }
  .info-row span:last-child { color: #e2e8f0; }
</style>
