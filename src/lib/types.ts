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

export interface UsageData {
  ai_used: string;
  ai_remaining: string;
}

export interface UsageLogEntry {
  id: string;
  client_id: string;
  model: string;
  session_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  credits_consumed: string;
  endpoint: string;
  tier: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  type: "plan" | "addon";
  description: string;
  price: string;
  currency: string;
  billing_interval: string;
  credits_included: number;
  features: Record<string, any>;
  sort_order: number;
  active: boolean;
}

export interface Subscription {
  id: string;
  client_id: string;
  product_id: string;
  plan_type: string;
  status: string;
  product_name: string;
  price: string;
  billing_interval: string;
  credits_included: number;
  start_date: string;
  end_date: string;
}

export interface WhatsAppConfig {
  whatsapp: string;
  whatsapp_connected: boolean;
  status: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
