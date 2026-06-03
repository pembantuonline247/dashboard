import { writable } from "svelte/store";

export interface User {
  role: "admin" | "client";
  sub: string;
  name?: string;
}

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);

// Check existing session on load
export async function checkAuth(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      user.set(null);
      isAuthenticated.set(false);
      return null;
    }
    const data = await res.json();
    user.set(data.user);
    isAuthenticated.set(true);
    return data.user;
  } catch {
    user.set(null);
    isAuthenticated.set(false);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  const data = await res.json();
  // Store token in localStorage for API calls
  if (data.token) localStorage.setItem("token", data.token);
  user.set(data.user);
  isAuthenticated.set(true);
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  localStorage.removeItem("token");
  user.set(null);
  isAuthenticated.set(false);
}
