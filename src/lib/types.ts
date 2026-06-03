export interface User {
  role: "admin" | "client";
  sub: string;
  name?: string;
}

export interface Client {
  id: string;
  name: string;
  subdomain: string;
  status: "online" | "offline" | "pending";
  whatsapp: string | null;
  whatsappConnected: boolean;
  createdAt: string;
  plan: string;
  usage: {
    messages: number;
    sessions: number;
  };
}

export interface SystemStats {
  cpu: number;
  memory: { total: number; used: number; free: number };
  uptime: number;
  gateways: { id: string; port: number; status: string }[];
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  credits_included: number;
  features: string[];
  category: string;
  sort_order: number;
  active: boolean;
  stripe_price_id?: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  product_id: string;
  product_name: string;
  plan_type: string;
  price: number;
  billing_interval: string;
  credits_included: number;
  features: string[];
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UsageData {
  ai_used: number;
  ai_remaining: number;
}

export interface WhatsAppConfig {
  whatsapp: string | null;
  whatsapp_connected: boolean;
  status: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}
