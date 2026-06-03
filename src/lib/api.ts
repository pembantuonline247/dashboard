import type { Client, SystemStats, Invoice } from "./types";

const API = "/api";

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // System
  async getStats(): Promise<SystemStats> {
    return fetchJson(`${API}/_openclaw/system/stats`);
  },

  // Clients (stored in local DB via gateway API)
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
    await fetch(`${API}/clients/${id}`, { method: "DELETE" });
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
