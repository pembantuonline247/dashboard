<script lang="ts">
  import type { Client } from "$lib/types";
  let { client }: { client: Client } = $props();
  const statusClass = client.whatsappConnected ? "badge-online" : "badge-offline";
</script>

<a href="/clients/{client.id}" class="card client-card">
  <div class="client-top">
    <div class="client-info">
      <h3>{client.name}</h3>
      <span class="client-domain">{client.subdomain}.dashboard.pembantu.online</span>
    </div>
    <span class="badge {statusClass}">
      <span class="dot" class:active={client.whatsappConnected}></span>
      {client.whatsappConnected ? "Connected" : "Disconnected"}
    </span>
  </div>
  <div class="client-meta">
    <span>📱 {client.whatsapp ?? "Not linked"}</span>
    <span>💬 {client.usage.messages} msgs</span>
    <span>📅 {new Date(client.createdAt).toLocaleDateString()}</span>
  </div>
</a>

<style>
  .client-card { text-decoration: none; display: block; cursor: pointer; }
  .client-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
  .client-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #e2e8f0; }
  .client-domain { font-size: 0.75rem; color: #64748b; }
  .client-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: #94a3b8; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
  .dot.active { background: #22c55e; }
</style>
