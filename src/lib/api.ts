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

const REQUEST_TIMEOUT_MS = 15000;

function isLocalHost() {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeAppsScriptUrl(rawUrl: string) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/macros/")) return `https://script.google.com${trimmed}`;
  return trimmed;
}

const GAS_URL = normalizeAppsScriptUrl(RAW_GAS_URL);

export const USE_MOCK = isLocalHost() && !GAS_URL;

async function performRequest<T>(
  action: string,
  method: "GET" | "POST",
  payload: Record<string, any> = {}
): Promise<T> {
  if (USE_MOCK) {
    pushLoginDebug(`mock: ${action}`, payload);
    return mockHandler(action, "GET", payload) as T;
  }

  if (!GAS_URL) {
    const msg = "VITE_APPS_SCRIPT_URL tidak dikonfigurasi.";
    pushLoginDebug("error: config", msg);
    throw new ApiError(msg);
  }

  const url = new URL(GAS_URL);
  const { token } = getSession() || {};

  url.searchParams.set("action", action);
  if (token) url.searchParams.set("token", token);

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  pushLoginDebug(`api: direct ${method === "POST" ? "login" : action}`, {
    url: url.toString(),
  });
  pushLoginDebug("api: env check", {
    raw: RAW_GAS_URL,
    resolved: GAS_URL,
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = `HTTP ${response.status}: ${response.statusText}`;
      pushLoginDebug("error: http", msg);
      throw new ApiError(msg, response.status);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      pushLoginDebug("error: logic", data.message || "Operation failed");
      throw new ApiError(data.message || "Operation failed", 400, data);
    }

    pushLoginDebug("success: data received");
    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    const isAbort = error?.name === "AbortError";
    const msg = isAbort
      ? "Koneksi timeout (15 detik). Periksa koneksi atau status Google Apps Script."
      : error?.message || "Koneksi ke server terputus.";

    pushLoginDebug(`error: ${error?.name || "UnknownError"}`, msg);
    throw new ApiError(msg, isAbort ? 408 : 500);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: Record<string, any> = {}) =>
  performRequest<T>(action, "POST", body);
