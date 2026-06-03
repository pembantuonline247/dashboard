import type { Client, SystemStats, Invoice, User } from "./types";

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
  }
};
