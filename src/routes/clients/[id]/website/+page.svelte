<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { Client } from "$lib/types";
  import type { WebsiteFile, WebsiteDomain, ChatAction } from "$lib/types/website";

  let client: Client | null = $state(null);
  let loading = $state(true);
  let tab = $state<"files" | "editor" | "preview">("files");
  let files = $state<WebsiteFile[]>([]);
  let selectedFile = $state<WebsiteFile | null>(null);
  let fileContent = $state("");
  let fileContentOrig = $state("");
  let domain = $state<WebsiteDomain | null>(null);
  let publishing = $state(false);
  let uploading = $state(false);
  let generating = $state(false);
  let genPrompt = $state("");

  // Chat state
  let chatMessages = $state<{ role: string; text: string }[]>([]);
  let chatInput = $state("");
  let chatSending = $state(false);

  const clientId = $derived($page.params.id);
  const API_BASE = `/api/workspace/${clientId}`;

  function getHeaders() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const t = localStorage.getItem("token");
    if (t) h["Authorization"] = `Bearer ${t}`;
    return h;
  }

  async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(url, { headers: getHeaders(), ...opts });
    if (!res.ok) {
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; }
      throw new Error(`API ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  const fileIcon = (ext: string) => {
    const map: Record<string, string> = {
      ".html": "📄", ".htm": "📄", ".css": "🎨", ".js": "⚡",
      ".json": "📋", ".png": "🖼", ".jpg": "🖼", ".jpeg": "🖼",
      ".gif": "🖼", ".svg": "🖼", ".webp": "🖼", ".ico": "🔷",
      ".pdf": "📕", ".md": "📝", ".txt": "📄", ".xml": "📐",
      ".woff2": "🔤", ".woff": "🔤", ".ttf": "🔤"
    };
    return map[ext] || "📄";
  };

  async function loadFiles() {
    try {
      const res = await apiFetch<{ files: WebsiteFile[] }>(`${API_BASE}/files`);
      files = res.files;
    } catch (e) { console.error("loadFiles error", e); }
  }

  async function loadDomain() {
    try {
      domain = await apiFetch<WebsiteDomain>(`${API_BASE}/domain`);
    } catch {}
  }

  async function openFile(file: WebsiteFile) {
    if (file.isDirectory) return;
    selectedFile = file;
    try {
      const res = await apiFetch<{ content: string }>(`${API_BASE}/files/${file.name}`);
      fileContent = res.content;
      fileContentOrig = res.content;
      tab = "editor";
    } catch (e) { console.error("openFile error", e); }
  }

  async function saveFile() {
    if (!selectedFile) return;
    try {
      await apiFetch(`${API_BASE}/files/write`, {
        method: "POST",
        body: JSON.stringify({ name: selectedFile.name, content: fileContent })
      });
      fileContentOrig = fileContent;
      await loadFiles();
    } catch (e) { console.error("saveFile error", e); }
  }

  async function deleteFile(file: WebsiteFile) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    try {
      await apiFetch(`${API_BASE}/files/delete`, {
        method: "POST",
        body: JSON.stringify({ name: file.name })
      });
      if (selectedFile?.name === file.name) { selectedFile = null; fileContent = ""; }
      await loadFiles();
    } catch (e) { console.error("deleteFile error", e); }
  }

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    uploading = true;
    const formData = new FormData();
    for (const f of Array.from(input.files)) formData.append("files", f);
    try {
      await fetch(`${API_BASE}/files/upload`, {
        method: "POST",
        headers: { Authorization: getHeaders()["Authorization"] || "" },
        body: formData
      });
      await loadFiles();
    } catch (e) { console.error("upload error", e); }
    uploading = false;
    input.value = "";
  }

  async function generateWebsite() {
    if (!genPrompt.trim() || generating) return;
    generating = true;
    try {
      const res = await apiFetch<{ reply: string; files: string[] }>(`${API_BASE}/ai/generate`, {
        method: "POST",
        body: JSON.stringify({ prompt: genPrompt })
      });
      await loadFiles();
      genPrompt = "";
      // auto-open the first file
      if (res.files?.length) {
        const idx = files.findIndex(f => f.name === res.files[0]);
        if (idx >= 0) openFile(files[idx]);
      }
    } catch (e) { console.error("generate error", e); }
    generating = false;
  }

  async function publish() {
    publishing = true;
    try {
      const res = await apiFetch<{ domain: string; previewUrl: string }>(`${API_BASE}/publish`, { method: "POST" });
      domain = { domain: res.domain, subdomain: res.domain?.replace(".pembantu.online", ""), dnsConfigured: true };
    } catch (e) { console.error("publish error", e); }
    publishing = false;
  }

  async function unpublish() {
    if (!confirm("Remove website? DNS and nginx config will be deleted.")) return;
    publishing = true;
    try {
      await apiFetch(`${API_BASE}/unpublish`, { method: "POST" });
      domain = null;
    } catch (e) { console.error("unpublish error", e); }
    publishing = false;
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    chatInput = "";
    chatSending = true;
    chatMessages = [...chatMessages, { role: "user", text }];

    try {
      const res = await apiFetch<ChatAction>(`${API_BASE}/ai/chat`, {
        method: "POST",
        body: JSON.stringify({ message: text, file: selectedFile?.name })
      });

      if (res.action === "write") {
        chatMessages = [...chatMessages, { role: "assistant", text: `✅ Created/updated **${res.file}**: ${res.text}` }];
        await loadFiles();
      } else {
        chatMessages = [...chatMessages, { role: "assistant", text: res.text }];
      }
    } catch (e) {
      chatMessages = [...chatMessages, { role: "assistant", text: `❌ Error: ${e}` }];
    }
    chatSending = false;
  }

  async function publishFromPreview() {
    if (!domain?.dnsConfigured) {
      await publish();
    }
  }

  const hasUnsavedChanges = $derived(fileContent !== fileContentOrig);
  const previewUrl = $derived(domain?.domain ? `https://${domain.domain}` : null);

  onMount(async () => {
    try {
      client = await apiFetch<Client>(`/api/clients/${clientId}`);
    } catch {}
    await Promise.all([loadFiles(), loadDomain()]);
    loading = false;
  });
</script>

<div class="ws-page">
  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <!-- Header -->
    <header class="ws-header">
      <div class="ws-header-left">
        <a href="/clients/{clientId}" class="back-link">← Back to Client</a>
        <h1>{client?.name || "Client"} <span class="ws-badge">Website</span></h1>
      </div>
      <div class="ws-header-right">
        {#if domain?.dnsConfigured}
          <a href={previewUrl} target="_blank" class="domain-badge" rel="noreferrer">
            🌐 {domain.domain}
          </a>
          <button class="btn btn-warning" onclick={unpublish} disabled={publishing}>
            {publishing ? "Unpublishing..." : "Unpublish"}
          </button>
        {:else}
          <button class="btn btn-primary" onclick={publish} disabled={publishing}>
            {publishing ? "Publishing..." : "📡 Publish"}
          </button>
        {/if}
      </div>
    </header>

    <!-- Tabs -->
    <div class="ws-tabs">
      <button class="ws-tab" class:active={tab === "files"} onclick={() => tab = "files"}>
        📁 Files
      </button>
      <button class="ws-tab" class:active={tab === "editor"} onclick={() => tab = "editor"}
        disabled={!selectedFile}>
        ✏️ Editor
      </button>
      <button class="ws-tab" class:active={tab === "preview"} onclick={() => tab = "preview"}>
        👁️ Preview
      </button>
    </div>

    <!-- Tab Content -->
    <div class="ws-content">
      {#if tab === "files"}
        <div class="files-tab">
          <!-- AI Generate Bar -->
          <div class="gen-bar">
            <input
              type="text"
              class="gen-input"
              placeholder="Describe the website you want... (e.g. 'A modern landing page for a cleaning service')"
              bind:value={genPrompt}
              onkeydown={(e) => e.key === "Enter" && generateWebsite()}
            />
            <button class="btn btn-primary gen-btn" onclick={generateWebsite} disabled={generating || !genPrompt.trim()}>
              {generating ? "✨ Generating..." : "✨ Generate"}
            </button>
          </div>

          <!-- File List -->
          <div class="file-list-header">
            <h3>Files ({files.length})</h3>
            <label class="btn btn-ghost upload-btn">
              {uploading ? "Uploading..." : "📤 Upload"}
              <input type="file" multiple hidden onchange={handleUpload} />
            </label>
          </div>

          <div class="file-list">
            {#if files.length === 0}
              <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>No files yet. Generate a website or upload files.</p>
              </div>
            {:else}
              {#each files as file}
                <div
                  class="file-item"
                  class:selected={selectedFile?.name === file.name}
                  onclick={() => !file.isDirectory && openFile(file)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => e.key === "Enter" && !file.isDirectory && openFile(file)}
                >
                  <span class="file-icon">{fileIcon(file.ext)}</span>
                  <span class="file-name">{file.name}</span>
                  <span class="file-size">{file.isDirectory ? "📁" : (file.size / 1024).toFixed(1) + " KB"}</span>
                  {#if !file.isDirectory}
                    <button class="file-delete" onclick={(e) => { e.stopPropagation(); deleteFile(file); }} title="Delete">
                      🗑️
                    </button>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>

      {:else if tab === "editor"}
        <div class="editor-tab">
          {#if selectedFile}
            <div class="editor-header">
              <span class="editor-file-icon">{fileIcon(selectedFile.ext)}</span>
              <span class="editor-file-name">{selectedFile.name}</span>
              <span class="editor-status" class:dirty={hasUnsavedChanges}>
                {hasUnsavedChanges ? "● Unsaved changes" : "✓ Saved"}
              </span>
              <div class="editor-actions">
                <button class="btn btn-primary btn-sm" onclick={saveFile} disabled={!hasUnsavedChanges}>
                  💾 Save
                </button>
                <button class="btn btn-ghost btn-sm" onclick={() => { fileContent = fileContentOrig; }}>
                  ↩️ Reset
                </button>
              </div>
            </div>
            <textarea
              class="editor-textarea"
              bind:value={fileContent}
              spellcheck="false"
            ></textarea>
          {:else}
            <div class="empty-state">
              <div class="empty-icon">✏️</div>
              <p>Select a file from the Files tab to start editing.</p>
            </div>
          {/if}
        </div>

      {:else if tab === "preview"}
        <div class="preview-tab">
          {#if previewUrl}
            <div class="preview-header">
              <a href={previewUrl} target="_blank" rel="noreferrer" class="preview-link">
                🔗 {previewUrl}
              </a>
              <button class="btn btn-ghost btn-sm" onclick={() => window.open(previewUrl!, "_blank")}>
                🖥️ Open in new tab
              </button>
            </div>
            <div class="preview-frame-wrapper">
              <iframe src={previewUrl} class="preview-frame" title="Website Preview" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
          {:else}
            <div class="empty-state">
              <div class="empty-icon">👁️</div>
              <p>This site hasn't been published yet.</p>
              <button class="btn btn-primary" onclick={publishFromPreview} disabled={publishing}>
                {publishing ? "Publishing..." : "📡 Publish Now"}
              </button>
              <p class="publish-hint">Publishing sets up DNS and nginx to make your site live at a subdomain.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- AI Chat - Fixed Bottom Panel -->
    <div class="ws-chat">
      <div class="ws-chat-header" onclick={() => {}}>
        <span>🤖 AI Website Assistant</span>
        <span class="chat-credits">{client ? "💎" : ""}</span>
      </div>
      <div class="ws-chat-messages" id="ws-chat-msgs">
        {#if chatMessages.length === 0}
          <div class="chat-placeholder">
            <p>Ask the AI to create or edit files, add features, or fix issues.</p>
          </div>
        {:else}
          {#each chatMessages as msg}
            <div class="chat-msg" class:user-msg={msg.role === "user"} class:bot-msg={msg.role === "assistant"}>
              <div class="msg-avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
              <div class="msg-text">{msg.text}</div>
            </div>
          {/each}
        {/if}
      </div>
      <div class="ws-chat-input">
        <input
          type="text"
          placeholder="Ask AI to create a page, edit something..."
          bind:value={chatInput}
          onkeydown={(e) => e.key === "Enter" && sendChat()}
          disabled={chatSending}
        />
        <button class="send-btn" onclick={sendChat} disabled={chatSending || !chatInput.trim()}>
          {chatSending ? "..." : "➤"}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .ws-page { display: flex; flex-direction: column; height: calc(100vh - 4rem); overflow: hidden; position: relative; }
  .loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b; font-size: 1.1rem; }

  /* Header */
  .ws-header { display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem; flex-shrink: 0; flex-wrap: wrap; gap: 0.75rem; }
  .ws-header-left { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
  .ws-header-left h1 { margin: 0; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
  .back-link { color: #38bdf8; font-size: 0.8rem; text-decoration: none; }
  .back-link:hover { text-decoration: underline; }
  .ws-badge { font-size: 0.65rem; font-weight: 600; background: #1e3a5f; color: #38bdf8; padding: 0.15rem 0.5rem; border-radius: 999px; }
  .ws-header-right { display: flex; align-items: center; gap: 0.5rem; }
  .domain-badge { display: inline-flex; align-items: center; gap: 0.35rem; background: #064e3b; color: #6ee7b7; padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; text-decoration: none; }
  .domain-badge:hover { background: #065f46; }

  /* Tabs */
  .ws-tabs { display: flex; gap: 0.25rem; padding: 0; flex-shrink: 0; margin-bottom: 0; border-bottom: 1px solid #334155; }
  .ws-tab { padding: 0.6rem 1.25rem; background: none; border: none; color: #64748b; font-size: 0.85rem; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .ws-tab:hover { color: #e2e8f0; }
  .ws-tab.active { color: #38bdf8; border-bottom-color: #38bdf8; }
  .ws-tab:disabled { opacity: 0.4; cursor: default; }

  /* Content area (scrollable, has chat space at bottom) */
  .ws-content { flex: 1; overflow-y: auto; padding: 1rem 0 120px; }

  /* Files Tab */
  .gen-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .gen-input { flex: 1; padding: 0.65rem 1rem; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #e2e8f0; font-size: 0.875rem; outline: none; }
  .gen-input:focus { border-color: #38bdf8; }
  .gen-btn { white-space: nowrap; }
  .file-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .file-list-header h3 { margin: 0; font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
  .upload-btn { font-size: 0.8rem; cursor: pointer; }
  .file-list { display: flex; flex-direction: column; gap: 0.25rem; }
  .file-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
  .file-item:hover { background: #1e293b; }
  .file-item.selected { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); }
  .file-icon { font-size: 1.1rem; width: 1.5rem; text-align: center; }
  .file-name { flex: 1; font-size: 0.85rem; color: #e2e8f0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
  .file-delete { background: none; border: none; font-size: 0.85rem; cursor: pointer; opacity: 0; transition: opacity 0.15s; padding: 2px; }
  .file-item:hover .file-delete { opacity: 1; }
  .file-delete:hover { opacity: 0.8 !important; }

  /* Editor Tab */
  .editor-tab { display: flex; flex-direction: column; height: 100%; }
  .editor-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; flex-shrink: 0; }
  .editor-file-icon { font-size: 1.1rem; }
  .editor-file-name { font-weight: 600; font-size: 0.9rem; color: #e2e8f0; }
  .editor-status { font-size: 0.75rem; color: #22c55e; }
  .editor-status.dirty { color: #f59e0b; }
  .editor-actions { margin-left: auto; display: flex; gap: 0.25rem; }
  .editor-textarea {
    flex: 1; min-height: 300px; padding: 1rem;
    background: #0f172a; color: #e2e8f0;
    font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace;
    font-size: 0.8rem; line-height: 1.6;
    border: 1px solid #334155; border-radius: 8px;
    outline: none; resize: vertical;
    tab-size: 2;
  }
  .editor-textarea:focus { border-color: #38bdf8; }

  /* Preview Tab */
  .preview-tab { display: flex; flex-direction: column; height: 100%; }
  .preview-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; flex-shrink: 0; }
  .preview-link { color: #38bdf8; font-size: 0.85rem; text-decoration: none; }
  .preview-link:hover { text-decoration: underline; }
  .preview-frame-wrapper { flex: 1; border: 1px solid #334155; border-radius: 8px; overflow: hidden; min-height: 200px; }
  .preview-frame { width: 100%; height: 100%; border: none; min-height: 400px; }
  .publish-hint { font-size: 0.75rem; color: #64748b; margin-top: 0.75rem; }

  /* Empty State */
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #64748b; text-align: center; gap: 0.5rem; }
  .empty-icon { font-size: 3rem; }

  /* Chat Panel - Fixed Bottom */
  .ws-chat {
    position: fixed; bottom: 0; right: 0;
    width: calc(100% - 240px); /* sidebar offset */
    background: #1e293b; border-top: 1px solid #334155;
    z-index: 50;
    display: flex; flex-direction: column;
    max-height: 200px;
    transition: max-height 0.2s;
  }
  .ws-chat-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.4rem 1rem;
    font-size: 0.8rem; font-weight: 600; color: #94a3b8;
    background: #0f172a; border-bottom: 1px solid #334155;
    cursor: default;
  }
  .ws-chat-messages {
    flex: 1; overflow-y: auto;
    padding: 0.5rem 1rem;
    display: flex; flex-direction: column; gap: 0.35rem;
  }
  .chat-placeholder { text-align: center; color: #64748b; font-size: 0.8rem; padding: 0.5rem; }
  .chat-msg { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.8rem; }
  .user-msg { justify-content: flex-end; }
  .bot-msg { justify-content: flex-start; }
  .msg-avatar { font-size: 1rem; width: 1.5rem; text-align: center; flex-shrink: 0; }
  .user-msg .msg-avatar { order: 1; }
  .user-msg .msg-text { order: 0; }
  .msg-text { padding: 0.3rem 0.6rem; border-radius: 8px; max-width: 75%; line-height: 1.4; white-space: pre-wrap; }
  .user-msg .msg-text { background: #1e3a5f; color: #e2e8f0; }
  .bot-msg .msg-text { background: #334155; color: #e2e8f0; }
  .ws-chat-input { display: flex; gap: 0.35rem; padding: 0.4rem 1rem; border-top: 1px solid #334155; }
  .ws-chat-input input {
    flex: 1; padding: 0.4rem 0.75rem;
    border: 1px solid #334155; border-radius: 6px;
    background: #0f172a; color: #e2e8f0;
    font-size: 0.8rem; outline: none;
  }
  .ws-chat-input input:focus { border-color: #38bdf8; }
  .send-btn { padding: 0.4rem 0.75rem; border: none; border-radius: 6px; background: #38bdf8; color: #0f172a; font-size: 0.85rem; cursor: pointer; font-weight: 600; transition: background 0.15s; }
  .send-btn:hover { background: #7dd3fc; }
  .send-btn:disabled { opacity: 0.5; cursor: default; }

  /* Shared buttons */
  .btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .btn-primary { background: #38bdf8; color: #0f172a; }
  .btn-primary:hover:not(:disabled) { background: #7dd3fc; }
  .btn-warning { background: #f59e0b; color: #0f172a; }
  .btn-warning:hover:not(:disabled) { background: #fbbf24; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover:not(:disabled) { background: #f87171; }
  .btn-ghost { background: #334155; color: #e2e8f0; }
  .btn-ghost:hover:not(:disabled) { background: #475569; }
  .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.75rem; }
</style>
