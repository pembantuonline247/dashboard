+++
export const ssr = false;
+++

<script lang="ts">
  import { goto } from "$app/navigation";

  const API = "/api";

  let step = $state(1);
  let loading = $state(false);
  let error = $state("");

  // Step 1 - Plans
  let plans = $state<any[]>([]);
  let selectedPlan = $state<any>(null);
  let plansLoading = $state(true);

  // Step 2 - Form
  let businessName = $state("");
  let email = $state("");
  let whatsapp = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let formErrors = $state<Record<string, string>>({});

  // Step 3 - Success
  let successData = $state<{ name: string; credits: number } | null>(null);

  async function loadPlans() {
    plansLoading = true;
    try {
      const res = await fetch(`${API}/products/public`);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      plans = Array.isArray(data) ? data : data.products || data.data || [];
      if (plans.length > 0) {
        selectedPlan = plans[0];
      }
    } catch (e: any) {
      error = e.message || "Could not load pricing plans";
    } finally {
      plansLoading = false;
    }
  }

  $effect(() => {
    loadPlans();
  });

  function continueToForm() {
    if (!selectedPlan) {
      error = "Please select a plan";
      return;
    }
    error = "";
    step = 2;
  }

  function goBack() {
    step = 1;
    error = "";
    formErrors = {};
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = "Business name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (whatsapp && !/^\+?[\d\s\-()]{7,20}$/.test(whatsapp)) errs.whatsapp = "Invalid phone number";
    formErrors = errs;
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    if (!validateForm()) return;
    loading = true;
    error = "";
    try {
      const payload: Record<string, any> = {
        name: businessName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        plan_id: selectedPlan.id,
      };
      if (whatsapp.trim()) {
        payload.whatsapp = whatsapp.trim();
      }
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Registration failed");
      }
      const data = await res.json();
      successData = {
        name: data.user?.name || payload.name,
        credits: data.user?.credits || data.credits || 0,
      };
      step = 3;
    } catch (e: any) {
      error = e.message || "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }

  function goToDashboard() {
    goto("/login");
  }

  function selectPlan(plan: any) {
    selectedPlan = plan;
    error = "";
  }

  function getTagline(): string {
    if (step === 1) return "Choose your plan";
    if (step === 2) return "Create your account";
    return "Welcome!";
  }
</script>

<div class="signup-page">
  <div class="signup-card">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1>Pembantu<span>.online</span></h1>
      <p class="tagline">{getTagline()}</p>
    </div>

    <!-- Step Indicator -->
    <div class="steps">
      <div class="step-indicator">
        {#each [1, 2, 3] as s}
          <div class="step-dot {s <= step ? 'active' : ''} {s < step ? 'done' : ''}"></div>
          {#if s < 3}
            <div class="step-line {s < step ? 'done' : ''}"></div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Step 1: Plan Selection -->
    {#if step === 1}
      <div class="step-content">
        <h2 class="step-title">Select a Plan</h2>
        <p class="step-desc">Choose a plan that suits your business needs</p>

        {#if plansLoading}
          <div class="plans-loading">Loading plans...</div>
        {:else if plans.length === 0}
          <div class="empty-plans">
            <p>No plans available at the moment.</p>
            <p class="contact-msg">Contact support for assistance.</p>
          </div>
        {:else}
          <div class="plans-grid">
            {#each plans as plan, i}
              <button
                class="plan-card"
                class:selected={selectedPlan?.id === plan.id}
                onclick={() => selectPlan(plan)}
                type="button"
              >
                <div class="plan-name">{plan.name || plan.plan_name || "Plan " + (i + 1)}</div>
                <div class="plan-price">
                  <span class="currency">Rp</span>
                  <span class="amount">{(plan.price || 0).toLocaleString("id-ID")}</span>
                  <span class="period">/month</span>
                </div>
                {#if plan.credits}
                  <div class="plan-credits">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {plan.credits.toLocaleString("id-ID")} credits
                  </div>
                {/if}
                <div class="plan-desc">{(plan.description || plan.deskripsi || "").slice(0, 80)}</div>
              </button>
            {/each}
          </div>
        {/if}

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <button
          class="btn-primary"
          onclick={continueToForm}
          disabled={!selectedPlan || plansLoading}
        >
          Continue
        </button>
      </div>
    {/if}

    <!-- Step 2: Registration Form -->
    {#if step === 2}
      <div class="step-content">
        <h2 class="step-title">Create Your Account</h2>
        <p class="step-desc">
          You selected: <strong class="selected-plan-name">{selectedPlan?.name || selectedPlan?.plan_name}</strong>
        </p>

        <form onsubmit={handleRegister}>
          <div class="field">
            <label for="businessName">Business Name</label>
            <input
              id="businessName"
              type="text"
              bind:value={businessName}
              placeholder="Your business name"
              class:error-input={formErrors.businessName}
            />
            {#if formErrors.businessName}
              <span class="field-error">{formErrors.businessName}</span>
            {/if}
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              autocomplete="email"
              class:error-input={formErrors.email}
            />
            {#if formErrors.email}
              <span class="field-error">{formErrors.email}</span>
            {/if}
          </div>

          <div class="field">
            <label for="whatsapp">WhatsApp <span class="optional">(optional)</span></label>
            <input
              id="whatsapp"
              type="tel"
              bind:value={whatsapp}
              placeholder="+628123456789"
              class:error-input={formErrors.whatsapp}
            />
            {#if formErrors.whatsapp}
              <span class="field-error">{formErrors.whatsapp}</span>
            {/if}
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="Min. 6 characters"
              autocomplete="new-password"
              class:error-input={formErrors.password}
            />
            {#if formErrors.password}
              <span class="field-error">{formErrors.password}</span>
            {/if}
          </div>

          <div class="field">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              placeholder="Repeat your password"
              autocomplete="new-password"
              class:error-input={formErrors.confirmPassword}
            />
            {#if formErrors.confirmPassword}
              <span class="field-error">{formErrors.confirmPassword}</span>
            {/if}
          </div>

          {#if error}
            <div class="error">{error}</div>
          {/if}

          <div class="btn-group">
            <button type="button" class="btn-secondary" onclick={goBack}>
              Back
            </button>
            <button type="submit" class="btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Step 3: Success -->
    {#if step === 3}
      <div class="step-content success-step">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h2 class="success-title">Welcome, {successData?.name || "Business"}!</h2>
        <p class="success-desc">Your account has been created successfully.</p>

        <div class="success-card">
          <div class="success-card-item">
            <span class="success-card-label">Business</span>
            <span class="success-card-value">{successData?.name || "\u2014"}</span>
          </div>
          <div class="success-card-item">
            <span class="success-card-label">Credits</span>
            <span class="success-card-value credits">{(successData?.credits || 0).toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button class="btn-primary btn-dashboard" onclick={goToDashboard}>
          Go to Dashboard
        </button>
      </div>
    {/if}

    <div class="login-link">
      <p>Already have an account? <a href="/login">Sign In</a></p>
    </div>
  </div>
</div>

<style>
  .signup-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    padding: 2rem;
  }

  .signup-card {
    background: #1e293b;
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .logo { text-align: center; margin-bottom: 1.5rem; }
  .logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
  }
  .logo-icon svg { width: 24px; height: 24px; }
  .logo h1 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
  .logo h1 span { color: #ec4899; }
  .tagline { color: #64748b; font-size: 0.8rem; margin-top: 0.25rem; }

  .steps { margin-bottom: 1.5rem; }
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }
  .step-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #334155;
    transition: all 0.3s;
  }
  .step-dot.active { background: #38bdf8; box-shadow: 0 0 6px rgba(56, 189, 248, 0.5); }
  .step-dot.done { background: #22c55e; }
  .step-line {
    width: 48px; height: 2px;
    background: #334155;
    transition: background 0.3s;
  }
  .step-line.done { background: #22c55e; }

  .step-content { margin-bottom: 1rem; }
  .step-title { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin: 0 0 0.25rem; text-align: center; }
  .step-desc { color: #64748b; font-size: 0.85rem; text-align: center; margin-bottom: 1.5rem; }
  .selected-plan-name { color: #38bdf8; }

  .plans-loading {
    text-align: center;
    color: #64748b;
    padding: 2rem;
  }
  .empty-plans {
    text-align: center;
    padding: 2rem;
    color: #64748b;
  }
  .empty-plans .contact-msg {
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }
  .plans-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .plan-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
    color: inherit;
    font-family: inherit;
  }
  .plan-card:hover { border-color: #475569; }
  .plan-card.selected { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
  .plan-name { font-weight: 700; color: #f1f5f9; font-size: 1rem; margin-bottom: 0.25rem; }
  .plan-price { margin-bottom: 0.25rem; }
  .plan-price .currency { color: #94a3b8; font-size: 0.75rem; font-weight: 600; }
  .plan-price .amount { color: #f1f5f9; font-size: 1.25rem; font-weight: 700; }
  .plan-price .period { color: #64748b; font-size: 0.75rem; }
  .plan-credits {
    color: #38bdf8; font-size: 0.8rem; font-weight: 600;
    display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.25rem;
  }
  .plan-desc { color: #64748b; font-size: 0.75rem; margin-top: 0.25rem; }

  .field { margin-bottom: 1rem; }
  label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.5rem; }
  .optional { color: #64748b; font-weight: 400; text-transform: none; letter-spacing: 0; }
  input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  input:focus { border-color: #38bdf8; }
  input.error-input { border-color: #ef4444; }
  .field-error {
    display: block;
    color: #ef4444;
    font-size: 0.7rem;
    margin-top: 0.3rem;
  }

  .btn-group {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .btn-group .btn-primary,
  .btn-group .btn-secondary { flex: 1; }

  .btn-primary {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 0.5rem;
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.9; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    padding: 0.75rem;
    border: 1px solid #334155;
    border-radius: 8px;
    background: transparent;
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: #475569; color: #e2e8f0; }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    text-align: center;
    margin-top: 1rem;
  }

  .success-step { text-align: center; }
  .success-icon {
    width: 56px; height: 56px;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: #22c55e;
  }
  .success-icon svg { width: 28px; height: 28px; }
  .success-title { color: #22c55e; font-size: 1.3rem; margin-bottom: 0.25rem; }
  .success-desc { color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .success-card {
    background: #0f172a;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }
  .success-card-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }
  .success-card-item:not(:last-child) { border-bottom: 1px solid #1e293b; }
  .success-card-label { color: #94a3b8; font-size: 0.8rem; }
  .success-card-value { color: #f1f5f9; font-weight: 600; }
  .success-card-value.credits { color: #38bdf8; }
  .btn-dashboard { margin-top: 0; }

  .login-link { text-align: center; margin-top: 1.5rem; }
  .login-link p { color: #64748b; font-size: 0.85rem; }
  .login-link a { color: #38bdf8; text-decoration: none; font-weight: 600; }
  .login-link a:hover { text-decoration: underline; }
</style>
