 <script lang="ts">
  import { onMount } from "svelte";
  import ChatWidget from "./ChatWidget.svelte";

  let { clientId = "" }: { clientId: string } = $props();

  let loading = $state(true);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state("");

  let agentName = $state("Bot");
  let personality = $state("friendly");
  let systemPrompt = $state("You are a helpful assistant.");
  let showChat = $state(false);
  let chatOpen = $state(false);

  const personalities = [
    { value: "friendly", label: "Friendly 😊" },
    { value: "professional", label: "Professional 💼" },
    { value: "witty", label: "Witty 😄" },
    { value: "formal", label: "Formal 🎩" },
    { value: "casual", label: "Casual ✌️" },
  ];

  onMount(async () => {
    try {
      const config = await fetch(`/api/agent/${clientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
      });
      if (config.ok) {
        const data = await config.json();
        agentName = data.agent_name || "Bot";
        personality = data.personality || "friendly";
        systemPrompt = data.system_prompt || "You are a helpful assistant.";
      }
    } catch (e) {
      // Use defaults
    } finally {
      loading = false;
    }
  });

  async function save() {
    saving = true;
    saved = false;
    error = "";
    try {
      const res = await fetch(`/api/agent/${clientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          agent_name: agentName,
          personality,
          system_prompt: systemPrompt,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.text()) || "Save failed");
      saved = true;
      setTimeout(() => (saved = false), 3000);
    } catch (e: any) {
      error = e.message || "Failed to save bot configuration";
    } finally {
      saving = false;
    }
  }
</script>

<div class="bot-config-card">
  <div class="card-header">
    <h3>🤖 Bot Configuration</h3>
    <p class="card-desc">Customize your client's AI assistant personality and behavior</p>
  </div>

  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <div class="form-group">
      <label for="agent-name">Bot Name</label>
      <input
        id="agent-name"
        type="text"
        bind:value={agentName}
        placeholder="e.g., Sales Bot, Support Assistant"
      />
    </div>

    <div class="form-group">
      <label for="personality">Personality</label>
      <select id="personality" bind:value={personality}>
        {#each personalities as p}
          <option value={p.value}>{p.label}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label for="system-prompt">System Prompt</label>
      <textarea
        id="system-prompt"
        bind:value={systemPrompt}
        placeholder="Instructions for how the bot should behave..."
        rows={5}
      ></textarea>
    </div>

    <div class="bot-actions">
      <button class="btn btn-primary" onclick={save} disabled={saving}>
        {saving ? "Saving..." : "💾 Save Configuration"}
      </button>
      <button class="btn btn-secondary" onclick={() => (chatOpen = !chatOpen)}>
        {chatOpen ? "✕ Close Chat" : "💬 Chat with Bot"}
      </button>
    </div>

    {#if saved}
      <p class="success-msg">✅ Configuration saved successfully!</p>
    {/if}
    {#if error}
      <p class="error-msg">❌ {error}</p>
    {/if}
  {/if}
</div>

{#if chatOpen}
  <ChatWidget {clientId} />
{/if}

<style>
  .bot-config-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }
  .card-header { margin-bottom: 1.5rem; }
  .card-header h3 { margin: 0 0 0.25rem; font-size: 1.1rem; color: #f1f5f9; }
  .card-desc { margin: 0; font-size: 0.8rem; color: #64748b; }
  .loading { color: #64748b; padding: 1rem 0; text-align: center; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.375rem; font-weight: 500; }
  input, select, textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    color: #f1f5f9;
    font-size: 0.875rem;
    box-sizing: border-box;
  }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
  }
  select { cursor: pointer; }
  textarea { resize: vertical; font-family: inherit; }
  .bot-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s, opacity 0.2s;
    white-space: nowrap;
  }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: #334155; color: #e2e8f0; }
  .btn-secondary:hover { background: #475569; }
  .success-msg { color: #4ade80; font-size: 0.8rem; margin-top: 0.75rem; }
  .error-msg { color: #f87171; font-size: 0.8rem; margin-top: 0.75rem; }
</style>
