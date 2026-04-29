import { mockHandler } from "./mock";
import { getSession } from "./auth";

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public data: any = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const RAW_GAS_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_APPS_SCRIPT_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.NEXT_PUBLIC_APPS_SCRIPT_URL) ||
  "";

const REQUEST_TIMEOUT_MS = 20000;

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeAppsScriptUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/macros/")) return `https://script.google.com${trimmed}`;
  return trimmed;
}

const GAS_URL = normalizeAppsScriptUrl(RAW_GAS_URL);

export const USE_MOCK = isLocalHost() && !GAS_URL;
const USE_DIRECT_GAS = isLocalHost() && !!GAS_URL;

async function performRequest<T>(
  action: string,
  _method: "GET" | "POST",
  payload: Record<string, any> = {}
): Promise<T> {
  if (USE_MOCK) {
    return mockHandler(action, "GET", payload) as T;
  }

  try {
    const { token } = getSession() || {};

    let fetchUrl: string;
    let fetchInit: RequestInit;

    if (USE_DIRECT_GAS) {
      const url = new URL(GAS_URL);
      url.searchParams.set("action", action);
      if (token) url.searchParams.set("token", token);

      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }

      fetchUrl = url.toString();
      fetchInit = { method: "GET" };
    } else {
      const proxyUrl = new URL("/api/gas", window.location.origin);
      proxyUrl.searchParams.set("action", action);
      if (token) proxyUrl.searchParams.set("token", token);

      fetchUrl = proxyUrl.toString();
      fetchInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(fetchUrl, { ...fetchInit, signal: controller.signal });
    } catch (fetchError: any) {
      window.clearTimeout(timeoutId);
      const isAbort = fetchError?.name === "AbortError";
      const msg = isAbort
        ? `Koneksi timeout (${REQUEST_TIMEOUT_MS / 1000}s). Server tidak merespons.`
        : `Gagal menghubungi server: ${fetchError?.message || "Unknown network error"}`;
      throw new ApiError(msg, isAbort ? 408 : 500);
    }

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    let data: ApiResponse;
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Server mengembalikan respons yang tidak valid (bukan JSON).", 500);
    }

    if (!data.success) {
      throw new ApiError(data.message || "Operasi gagal.", 400, data);
    }

    return data as T;

  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error?.message || "Terjadi kesalahan tidak terduga.", 500);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: Record<string, any> = {}) =>
  performRequest<T>(action, "POST", body);
