<script lang="ts">
  import { page } from "$app/stores";
  import { logout } from "$lib/auth";
  import type { User } from "$lib/types";

  let { user }: { user: User | null } = $props();

  const adminLinks = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/clients", label: "Clients", icon: "👥" },
    { href: "/subscriptions", label: "AI Credits", icon: "🤖" },
    { href: "/whatsapp", label: "WhatsApp", icon: "📱" },
    { href: "/billing", label: "Billing", icon: "💰" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const clientLinks = [
    { href: "/client", label: "My Bot", icon: "🤖" },
    { href: "/client/invoices", label: "My Invoices", icon: "💰" },
  ];

  const links = user?.role === "admin" ? adminLinks : user?.role === "client" ? clientLinks : [];

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }
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
        class:active={$page.url.pathname === link.href || (link.href !== "/" && $page.url.pathname.startsWith(link.href))}
      >
        <span class="nav-icon">{link.icon}</span>
        <span class="nav-label">{link.label}</span>
      </a>
    {/each}
    {#if $page.url.pathname.startsWith("/clients/") && $page.url.pathname.split("/").length >= 4}
      <div class="nav-divider"></div>
      <a
        href={$page.url.pathname + "/website"}
        class="nav-item sub-nav"
        class:active={$page.url.pathname.endsWith("/website")}
      >
        <span class="nav-icon">🌐</span>
        <span class="nav-label">Website Builder</span>
      </a>
    {/if}
  </nav>
  <div class="sidebar-footer">
    {#if user}
      <div class="user-info">
        <div class="user-avatar">{user.role === "admin" ? "A" : "C"}</div>
        <div class="user-details">
          <span class="user-name">{user.name || user.sub}</span>
          <span class="user-role">{user.role}</span>
        </div>
      </div>
    {/if}
    <button onclick={handleLogout} class="logout-btn">
      <span>🚪</span>
      <span>Sign Out</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 240px; height: 100vh;
    background: #1e293b; border-right: 1px solid #334155;
    display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0;
  }
  .logo {
    padding: 1.5rem; display: flex; align-items: center; gap: 0.75rem;
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
    padding: 0.75rem;
    border-top: 1px solid #334155;
    display: flex; flex-direction: column; gap: 0.5rem;
  }
  .user-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; }
  .user-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: #334155; display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700; color: #38bdf8;
  }
  .user-details { display: flex; flex-direction: column; }
  .user-name { font-size: 0.8rem; color: #e2e8f0; font-weight: 600; }
  .user-role { font-size: 0.7rem; color: #64748b; text-transform: capitalize; }
  .logout-btn {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem; border-radius: 8px;
    background: none; border: none; color: #94a3b8;
    font-size: 0.8rem; cursor: pointer; width: 100%;
    transition: all 0.2s;
  }
  .logout-btn:hover { background: #7f1d1d; color: #fecaca; }
  .nav-divider { height: 1px; background: #334155; margin: 0.25rem 0.75rem; }
  .sub-nav { padding-left: 2rem !important; font-size: 0.8rem !important; color: #94a3b8 !important; }
  .sub-nav.active { color: #38bdf8 !important; background: rgba(56, 189, 248, 0.08) !important; }
</style>
