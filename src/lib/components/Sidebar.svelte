<script lang="ts">
  import { page } from "$app/stores";
  const links = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/clients", label: "Clients", icon: "👥" },
    { href: "/billing", label: "Billing", icon: "💰" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];
</script>

<aside class="sidebar">
  <div class="logo">
    <span class="logo-icon">🌀</span>
    <span class="logo-text">Pembantu</span>
  </div>
  <nav>
    {#each links as link}
      <a
        href={link.href}
        class="nav-item"
        class:active={$page.url.pathname === link.href}
      >
        <span class="nav-icon">{link.icon}</span>
        <span class="nav-label">{link.label}</span>
      </a>
    {/each}
  </nav>
  <div class="sidebar-footer">
    <div class="server-status">
      <span class="status-dot"></span>
      <span>Kamatera SG</span>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    width: 240px;
    height: 100vh;
    background: #1e293b;
    border-right: 1px solid #334155;
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
  }
  .logo {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid #334155;
  }
  .logo-icon { font-size: 1.5rem; }
  .logo-text { font-size: 1.25rem; font-weight: 700; color: #38bdf8; }
  nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 8px; color: #94a3b8;
    text-decoration: none; font-size: 0.875rem; font-weight: 500;
    transition: all 0.2s;
  }
  .nav-item:hover { background: #334155; color: #e2e8f0; }
  .nav-item.active { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
  .nav-icon { font-size: 1.125rem; width: 1.5rem; text-align: center; }
  .sidebar-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid #334155;
  }
  .server-status {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.75rem; color: #64748b;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
  }
</style>
