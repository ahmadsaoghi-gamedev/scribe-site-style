import { mockHandler } from "./mock";
import { getSession } from "./auth";
import { pushLoginDebug } from "./loginDebug";

/**
 * Standard API Response Shape from Google Apps Script.
 */
export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Production-ready Custom Error for API failures.
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public data: any = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Backend Strategy Configuration.
 */
const APPS_SCRIPT_URL =
  (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  "";

const REQUEST_TIMEOUT_MS = 15000;

function isLocalHost() {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * Decides whether to use the direct GAS URL or the Vercel Proxy.
 * PROD: Always Proxy (to avoid body stripping on 302 and hide URL).
 * DEV: Direct GAS (for speed) or Mock (if no URL set).
 */
function normalizeAppsScriptUrl(rawUrl: string) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/macros/")) {
    return `https://script.google.com${trimmed}`;
  }
  return trimmed;
}

function getApiBaseUrl() {
  return normalizeAppsScriptUrl(APPS_SCRIPT_URL);
}

export const USE_MOCK = isLocalHost() && !normalizeAppsScriptUrl(APPS_SCRIPT_URL);

/**
 * Core Request Orchestrator.
 * Centralizes logging, timeouts, and error normalization.
 */
async function performRequest<T>(
  action: string,
  method: "GET" | "POST",
  payload: any = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  
  if (USE_MOCK) {
    pushLoginDebug(`mock: ${action}`, payload);
    return mockHandler(action, method, payload) as T;
  }

  if (!baseUrl) {
    const error = "API URL is missing. Check your environment variables.";
    pushLoginDebug("error: config", error);
    throw new ApiError(error);
  }

  const isProxy = false;
  const url = new URL(baseUrl);
  
  const { token } = getSession() || {};
  
  // Configure Fetch Options
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  const options: RequestInit = {
    method,
    signal: controller.signal,
  };

  // Preparation: Standardize Payload Delivery
  if (method === "GET") {
    url.searchParams.set("action", action);
    if (token) url.searchParams.set("token", token);
    Object.entries(payload).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  } else {
    url.searchParams.set("action", action);
    options.headers = { "Content-Type": "text/plain" };
    options.body = JSON.stringify({ ...payload, action, token });
  }

  pushLoginDebug(`api: ${method} ${action}`, { url: url.toString() });
  pushLoginDebug("api: env check", {
    raw: APPS_SCRIPT_URL,
    resolved: baseUrl,
  });

  try {
    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      const errorMsg = `Server returned ${response.status}: ${response.statusText}`;
      pushLoginDebug(`error: ${response.status}`, errorMsg);
      throw new ApiError(errorMsg, response.status);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      pushLoginDebug("error: logic", data.message);
      throw new ApiError(data.message || "Operation failed", 400, data);
    }

    pushLoginDebug("success: data received");
    return data as T;

  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    const isAbort = error.name === "AbortError";
    const message = isAbort 
      ? "Koneksi timeout. Server Google Apps Script tidak merespon tepat waktu."
      : error.message || "Koneksi ke server terputus.";
    
    pushLoginDebug(`error: ${error.name}`, message);
    console.error(`[API FAIL] ${method} ${action}:`, error);
    throw new ApiError(message, isAbort ? 408 : 500);

  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: any = {}) =>
  performRequest<T>(action, "POST", body);
