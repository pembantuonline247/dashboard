<script lang="ts">
  import { api } from "$lib/api";

  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);
  let isClient = $state(false);

  async function handleLogin() {
    error = "";
    if (!email || !password) {
      error = "Email and password required";
      return;
    }
    loading = true;
    try {
      // Try admin login first, then client login
      let data;
      if (!isClient) {
        data = await api.login(email, password);
      } else {
        data = await api.clientLogin(email, password);
      }
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (e) {
      // If admin login fails and email isn't admin, try client login
      if (!isClient && email !== "admin@pembantu.online") {
        try {
          const data = await api.clientLogin(email, password);
          localStorage.setItem("token", data.token);
          window.location.href = "/";
          return;
        } catch {}
      }
      error = (e as Error).message;
    }
    loading = false;
  }
</script>

<div class="login-page">
  <div class="login-card">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1>Pembantu<span>.Online</span></h1>
      <p class="tagline">Dashboard</p>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          autocomplete="email"
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Enter your password"
          autocomplete="current-password"
        />
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>

    <div class="signup-link">
      <p>Don't have an account? <a href="/signup">Get Started →</a></p>
    </div>

    <div class="whatsapp-signup">
      <p>Or sign up via WhatsApp</p>
      <a href="https://wa.me/60175797694?text=Hi%21%20I%27d%20like%20to%20sign%20up%20for%20Pembantu.Online" target="_blank" class="wa-btn">
        📱 Chat on WhatsApp
      </a>
    </div>
  </div>
</div>

<style>
  .login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; }
  .login-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
  .logo { text-align: center; margin-bottom: 2rem; }
  .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #ec4899); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; }
  .logo-icon svg { width: 24px; height: 24px; }
  .logo h1 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
  .logo h1 span { color: #ec4899; }
  .tagline { color: #64748b; font-size: 0.8rem; margin-top: 0.25rem; }
  .field { margin-bottom: 1rem; }
  label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.5rem; }
  input { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem; color: #f1f5f9; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
  input:focus { border-color: #6366f1; }
  input::placeholder { color: #475569; }
  .error { background: #7f1d1d; color: #fecaca; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 1rem; }
  button { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; padding: 0.75rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
  button:hover { opacity: 0.9; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .signup-link { text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #334155; }
  .signup-link p { color: #64748b; font-size: 0.85rem; }
  .signup-link a { color: #38bdf8; text-decoration: none; font-weight: 600; }
  .signup-link a:hover { text-decoration: underline; }
  .whatsapp-signup { text-align: center; margin-top: 1rem; }
  .whatsapp-signup p { color: #64748b; font-size: 0.8rem; margin-bottom: 0.5rem; }
  .wa-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; background: #25D366; color: white; font-size: 0.8rem; font-weight: 600; text-decoration: none; }
  .wa-btn:hover { opacity: 0.9; }
</style>
