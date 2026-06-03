import type { Client, SystemStats, Invoice, User, Product, Subscription, UsageData, WhatsAppConfig, ChatMessage } from "./types";

const API = "/api";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: getHeaders(),
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).error || "Login failed");
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    return fetchJson(`${API}/auth/me`);
  },

  async logout(): Promise<void> {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
  },

  // System
  async getStats(): Promise<SystemStats> {
    return fetchJson(`${API}/_openclaw/system/stats`);
  },

  // Clients
  async getClients(): Promise<Client[]> {
    return fetchJson(`${API}/clients`);
  },
  async getClient(id: string): Promise<Client> {
    return fetchJson(`${API}/clients/${id}`);
  },
  async createClient(data: Partial<Client>): Promise<Client> {
    return fetchJson(`${API}/clients`, { method: "POST", body: JSON.stringify(data) });
  },
  async deleteClient(id: string): Promise<void> {
    await fetch(`${API}/clients/${id}`, { method: "DELETE", headers: getHeaders(), credentials: "include" });
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return fetchJson(`${API}/invoices`);
  },

  // WhatsApp QR
  async getWhatsAppQR(clientId: string): Promise<{ qr: string }> {
    return fetchJson(`${API}/clients/${clientId}/whatsapp/qr`);
  },

  // Products & Subscriptions
  async getProducts(): Promise<Product[]> {
    return fetchJson(`${API}/products`);
  },
  async getSubscriptions(clientId: string): Promise<Subscription[]> {
    return fetchJson(`${API}/subscriptions/${clientId}`);
  },
  async createSubscription(clientId: string, productId: string, planType?: string): Promise<Subscription> {
    return fetchJson(`${API}/subscriptions`, {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, product_id: productId, plan_type: planType }),
    });
  },

  // Usage
  async getUsage(clientId: string): Promise<UsageData> {
    return fetchJson(`${API}/usage/${clientId}`);
  },

  // WhatsApp Config
  async getWhatsAppConfig(clientId: string): Promise<WhatsAppConfig> {
    return fetchJson(`${API}/whatsapp/config/${clientId}`);
  },
  async saveWhatsAppConfig(clientId: string, config: { whatsapp: string; auto_reconnect?: boolean; reconnect_interval_minutes?: number }): Promise<{ ok: boolean }> {
    return fetchJson(`${API}/whatsapp/config/${clientId}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  // Chat
  async sendChat(message: string, clientId?: string): Promise<ChatMessage> {
    return fetchJson(`${API}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, client_id: clientId }),
    });
  },

  // Stripe
  async getStripeConfig(): Promise<{ publishableKey: string; currency: string; paymentMethods: string[] }> {
    return fetchJson(`${API}/stripe/config`);
  },
  async createCheckoutSession(clientId: string, amount: number, description?: string): Promise<{ url: string }> {
    return fetchJson(`${API}/stripe/create-checkout`, {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, amount, description }),
    });
  }
};
