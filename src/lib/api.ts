import { mockHandler } from "./mock";
import { getSession } from "./auth";
import { pushLoginDebug } from "./loginDebug";

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
const BUILD_ID = "20260421-1216"; // Tracking deployment freshness

export const USE_MOCK = isLocalHost() && !GAS_URL;

/**
 * Robust request handler.
 * - Production (Vercel): POST to /api/gas proxy → proxy does GET to GAS
 * - Localhost with GAS_URL: GET directly to GAS (with query params)
 * - Localhost without GAS_URL: mock handler
 */
async function performRequest<T>(
  action: string,
  _method: "GET" | "POST",
  payload: Record<string, any> = {}
): Promise<T> {
  // Step 1: Mock check
  if (USE_MOCK) {
    pushLoginDebug(`mock: ${action}`, payload);
    return mockHandler(action, "GET", payload) as T;
  }

  // Everything from here is in a master try-catch
  try {
    const isLocal = isLocalHost();
    const { token } = getSession() || {};
    
    pushLoginDebug(`perf: [${BUILD_ID}] start ${action}`, {
      isLocal,
      hasGasUrl: !!GAS_URL,
    });

    let fetchUrl: string;
    let fetchInit: RequestInit;

    if (isLocal) {
      // --- LOCALHOST: Direct GET to Google Apps Script ---
      if (!GAS_URL) {
        throw new ApiError("VITE_APPS_SCRIPT_URL tidak dikonfigurasi.");
      }

      const url = new URL(GAS_URL);
      url.searchParams.set("action", action);
      if (token) url.searchParams.set("token", token);

      // Flatten payload into query params (GAS reads from e.parameter)
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }

      fetchUrl = url.toString();
      fetchInit = { method: "GET" };

      pushLoginDebug(`perf: local direct GET`);
    } else {
      // --- PRODUCTION: POST to Vercel proxy /api/gas ---
      const proxyUrl = new URL("/api/gas", window.location.origin);
      proxyUrl.searchParams.set("action", action);
      if (token) proxyUrl.searchParams.set("token", token);

      fetchUrl = proxyUrl.toString();
      fetchInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };

      pushLoginDebug(`perf: prod proxy POST`);
    }

    // Step 3: Fetch with timeout
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      pushLoginDebug("perf: TIMEOUT fired after " + REQUEST_TIMEOUT_MS + "ms");
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    pushLoginDebug("perf: fetching...");

    let response: Response;
    try {
      response = await fetch(fetchUrl, {
        ...fetchInit,
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      window.clearTimeout(timeoutId);

      const isAbort = fetchError?.name === "AbortError";
      const msg = isAbort
        ? `Koneksi timeout (${REQUEST_TIMEOUT_MS / 1000}s). Server tidak merespons.`
        : `Gagal menghubungi server: ${fetchError?.message || "Unknown network error"}`;

      pushLoginDebug(`perf: fetch failed`, { name: fetchError?.name, message: fetchError?.message });
      throw new ApiError(msg, isAbort ? 408 : 500);
    }

    window.clearTimeout(timeoutId);

    pushLoginDebug(`perf: response ${response.status} ${response.statusText}`);

    // Step 4: Parse response
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch { /* ignore */ }
      const msg = `HTTP ${response.status}: ${response.statusText}`;
      pushLoginDebug("perf: HTTP error", { status: response.status, body: errorBody.substring(0, 200) });
      throw new ApiError(msg, response.status);
    }

    let data: ApiResponse;
    try {
      data = await response.json();
    } catch (parseError: any) {
      pushLoginDebug("perf: JSON parse failed", parseError?.message);
      throw new ApiError("Server mengembalikan respons yang tidak valid (bukan JSON).", 500);
    }

    pushLoginDebug("perf: data received", { success: data.success, keys: Object.keys(data) });

    if (!data.success) {
      pushLoginDebug("perf: logic error", data.message);
      throw new ApiError(data.message || "Operasi gagal.", 400, data);
    }

    pushLoginDebug("perf: SUCCESS ✓");
    return data as T;

  } catch (error: any) {
    // Re-throw ApiError as-is (already logged)
    if (error instanceof ApiError) {
      pushLoginDebug(`perf: ApiError thrown → ${error.message}`);
      throw error;
    }

    // Unexpected error
    const msg = error?.message || "Terjadi kesalahan tidak terduga.";
    pushLoginDebug(`perf: UNEXPECTED ERROR`, { name: error?.name, message: msg, stack: error?.stack?.substring(0, 300) });
    throw new ApiError(msg, 500);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: Record<string, any> = {}) =>
  performRequest<T>(action, "POST", body);
