<script lang="ts">
  import { api } from "$lib/api";
  import type { ChatMessage } from "$lib/types";

  let { clientId = "" }: { clientId: string } = $props();
  let open = $state(false);
  let messages: ChatMessage[] = $state([]);
  let input = $state("");
  let sending = $state(false);
  let chatContainer: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (open && chatContainer) {
      scrollToBottom();
    }
  });

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    messages = [...messages, { role: "user", content: text }];
    input = "";
    sending = true;

    try {
      const res = await api.sendChat(clientId, text);
      messages = [...messages, { role: "assistant", content: res.reply }];
    } catch {
      messages = [...messages, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }];
    }
    sending = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<button class="chat-toggle" onclick={() => open = !open}>
  {open ? "✕" : "💬"}
</button>

{#if open}
  <div class="chat-panel">
    <div class="chat-header">
      <span>AI Assistant</span>
      <button class="chat-close" onclick={() => open = false}>✕</button>
    </div>
    <div class="chat-messages" bind:this={chatContainer}>
      {#if messages.length === 0}
        <div class="chat-empty">
          <p>Ask me anything about your dashboard</p>
        </div>
      {:else}
        {#each messages as msg}
          <div class="message" class:message-user={msg.role === "user"} class:message-assistant={msg.role === "assistant"}>
            <div class="message-avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
            <div class="message-content">{msg.content}</div>
          </div>
        {/each}
        {#if sending}
          <div class="message message-assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content typing">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    <div class="chat-input">
      <textarea
        bind:value={input}
        onkeydown={handleKeydown}
        placeholder="Type a message..."
        rows="1"
      ></textarea>
      <button class="send-btn" onclick={sendMessage} disabled={!input.trim() || sending}>
        ➤
      </button>
    </div>
  </div>
{/if}

<style>
  .chat-toggle {
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    width: 56px; height: 56px; border-radius: 50%;
    background: #38bdf8; color: #0f172a;
    border: none; font-size: 1.5rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(56, 189, 248, 0.3);
    z-index: 1000; transition: transform 0.2s;
  }
  .chat-toggle:hover { transform: scale(1.1); }

  .chat-panel {
    position: fixed; bottom: 5rem; right: 1.5rem;
    width: 360px; max-width: calc(100vw - 2rem);
    height: 500px; max-height: calc(100vh - 8rem);
    background: #1e293b; border: 1px solid #334155;
    border-radius: 16px; display: flex; flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 1000; overflow: hidden;
  }

  .chat-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem; border-bottom: 1px solid #334155;
    font-weight: 600; font-size: 0.9rem; color: #f1f5f9;
  }
  .chat-close {
    background: none; border: none; color: #64748b;
    font-size: 1rem; cursor: pointer; padding: 0.25rem;
  }
  .chat-close:hover { color: #e2e8f0; }

  .chat-messages {
    flex: 1; overflow-y: auto; padding: 1rem;
    display: flex; flex-direction: column; gap: 0.75rem;
  }
  .chat-empty {
    display: flex; align-items: center; justify-content: center;
    height: 100%; color: #64748b; font-size: 0.85rem;
    text-align: center;
  }

  .message { display: flex; gap: 0.6rem; max-width: 85%; }
  .message-user { align-self: flex-end; flex-direction: row-reverse; }
  .message-assistant { align-self: flex-start; }

  .message-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; flex-shrink: 0;
  }
  .message-content {
    padding: 0.6rem 0.75rem; border-radius: 12px;
    font-size: 0.8rem; line-height: 1.4; color: #e2e8f0;
  }
  .message-user .message-content {
    background: #2563eb; color: #fff;
    border-bottom-right-radius: 4px;
  }
  .message-assistant .message-content {
    background: #334155;
    border-bottom-left-radius: 4px;
  }

  .typing { display: flex; gap: 4px; padding: 0.6rem 0.75rem; align-items: center; }
  .typing-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
    animation: typing 1.4s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }

  .chat-input {
    display: flex; gap: 0.5rem; padding: 0.75rem;
    border-top: 1px solid #334155; align-items: flex-end;
  }
  .chat-input textarea {
    flex: 1; padding: 0.5rem 0.75rem; border-radius: 8px;
    border: 1px solid #334155; background: #0f172a; color: #e2e8f0;
    font-size: 0.8rem; resize: none; outline: none;
    font-family: inherit; max-height: 120px;
  }
  .chat-input textarea:focus { border-color: #38bdf8; }

  .send-btn {
    width: 36px; height: 36px; border-radius: 8px;
    background: #2563eb; color: #fff; border: none;
    font-size: 1rem; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: background 0.2s; flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) { background: #1d4ed8; }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
