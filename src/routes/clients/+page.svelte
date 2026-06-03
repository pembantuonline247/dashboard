<script lang="ts">
  import { onMount } from "svelte";
  import ClientCard from "$lib/components/ClientCard.svelte";
  import type { Client } from "$lib/types";
  import { api } from "$lib/api";

  let clients: Client[] = $state([]);
  let loading = $state(true);
  let showAdd = $state(false);
  let newName = $state("");
  let newSubdomain = $state("");
  let newWhatsapp = $state("");

  onMount(async () => {
    try { clients = await api.getClients(); } catch {}
    loading = false;
  });

  async function addClient() {
    if (!newName || !newSubdomain) return;
    const client = await api.createClient({
      name: newName,
      subdomain: newSubdomain,
      whatsapp: newWhatsapp || null,
      plan: "starter",
      status: "pending"
    });
    clients = [...clients, client];
    showAdd = false;
    newName = ""; newSubdomain = ""; newWhatsapp = "";
  }
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>Clients</h1>
      <p class="subtitle">{clients.length} client{clients.length !== 1 ? "s" : ""} registered</p>
    </div>
    <button class="btn btn-primary" onclick={() => showAdd = !showAdd}>
      {showAdd ? "Cancel" : "+ Add Client"}
    </button>
  </header>

  {#if showAdd}
    <div class="card add-form">
      <h3>New Client</h3>
      <div class="form-grid">
        <div>
          <label>Client Name</label>
          <input class="input" bind:value={newName} placeholder="e.g. Klinic Studio" />
        </div>
        <div>
          <label>Subdomain</label>
          <div class="subdomain-input">
            <input class="input" bind:value={newSubdomain} placeholder="klinic" />
            <span>.dashboard.pembantu.online</span>
          </div>
        </div>
        <div>
          <label>WhatsApp Number</label>
          <input class="input" bind:value={newWhatsapp} placeholder="+60123456789" />
        </div>
      </div>
      <button class="btn btn-primary" onclick={addClient}>Create Client</button>
    </div>
  {/if}

  {#if loading}
    <p style="color:#64748b">Loading...</p>
  {:else if clients.length === 0}
    <div class="empty">
      <p>No clients yet. Click "Add Client" to onboard your first one.</p>
    </div>
  {:else}
    <div class="client-grid">
      {#each clients as client}
        <ClientCard {client} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
  .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
  .add-form { margin-bottom: 1.5rem; }
  .add-form h3 { margin: 0 0 1rem; font-size: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1rem; }
  label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.375rem; font-weight: 500; }
  .subdomain-input { display: flex; align-items: center; gap: 0.5rem; }
  .subdomain-input span { font-size: 0.8rem; color: #64748b; white-space: nowrap; }
  .client-grid { display: flex; flex-direction: column; gap: 0.75rem; }
  .empty { text-align: center; padding: 3rem; color: #64748b; }
</style>
