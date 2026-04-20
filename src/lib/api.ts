/**
 * API CLIENT — connects to Google Apps Script Web App
 *
 * BACKEND DEV: Set NEXT_PUBLIC_APPS_SCRIPT_URL (or VITE_APPS_SCRIPT_URL) in env.
 * All requests include token from localStorage.
 *
 * To activate the real backend: set USE_MOCK = false and provide APPS_SCRIPT_URL.
 */
export const APPS_SCRIPT_URL =
  (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  "";

export const USE_MOCK = !APPS_SCRIPT_URL;

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export async function apiGet(action: string, params: Record<string, string> = {}) {
  if (USE_MOCK) return mockHandler(action, "GET", params);
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("token", getToken());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

export async function apiPost(action: string, body: any = {}) {
  if (USE_MOCK) return mockHandler(action, "POST", body);
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, token: getToken() }),
  });
  return res.json();
}

// ─────────── MOCK DATA (remove or set USE_MOCK=false when backend ready) ───────────
import { mockHandler } from "./mock";
