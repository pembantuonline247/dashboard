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
