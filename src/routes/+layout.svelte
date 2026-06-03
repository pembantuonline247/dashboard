<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { checkAuth } from "$lib/auth";
  import type { User } from "$lib/types";
  import "../app.css";
  import Sidebar from "$lib/components/Sidebar.svelte";

  let { children }: { children: import("svelte").Snippet } = $props();
  let currentUser = $state<User | null>(null);
  let checking = $state(true);
  let isLoginPage = $state(false);

  onMount(async () => {
    // Check if on login page
    const unsub = page.subscribe(p => {
      isLoginPage = p.url.pathname === "/login";
    });
    unsub();

    if (isLoginPage) {
      checking = false;
      return;
    }

    const u = await checkAuth();
    if (!u) {
      window.location.href = "/login";
      return;
    }
    currentUser = u;
    checking = false;
  });
</script>

{#if checking}
  <div class="loading-screen">
    <div class="spinner"></div>
  </div>
{:else if isLoginPage}
  {@render children()}
{:else}
  <div class="app-layout">
    <Sidebar user={currentUser} />
    <main class="main">
      <div class="content">
        {@render children()}
      </div>
    </main>
  </div>
{/if}

<style>
  .loading-screen {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; background: #0f172a;
  }
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid #334155;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .app-layout { display: flex; }
  .main { margin-left: 240px; min-height: 100vh; width: 100%; }
  .content { padding: 2rem; max-width: 1200px; }
</style>
