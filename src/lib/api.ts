import { mockHandler } from "./mock";
import { getSession } from "./auth";

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

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

export const APPS_SCRIPT_URL =
  (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  "";

const PROXY_API_PATH = "/api/gas";
const REQUEST_TIMEOUT_MS = 15000;

function isLocalHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function getApiBaseUrl() {
  if (APPS_SCRIPT_URL) return APPS_SCRIPT_URL;
  if (!isLocalHost()) return PROXY_API_PATH;
  return "";
}

export const USE_MOCK = isLocalHost() && !APPS_SCRIPT_URL;

async function performRequest<T>(
  action: string,
  method: "GET" | "POST",
  payload: any = {}
): Promise<T> {
  if (USE_MOCK) {
    return mockHandler(action, method, payload) as T;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new ApiError("VITE_APPS_SCRIPT_URL is not configured. Check your environment variables.");
  }

  const usingProxy = apiBaseUrl.startsWith("/");
  const url = usingProxy
    ? new URL(apiBaseUrl, window.location.origin)
    : new URL(apiBaseUrl);

  const session = getSession();
  const token = session?.token || "";

  const options: RequestInit = {
    method,
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  options.signal = controller.signal;

  if (method === "GET") {
    url.searchParams.set("action", action);
    if (token) url.searchParams.set("token", token);

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  } else {
    url.searchParams.set("action", action);
    options.headers = {
      "Content-Type": usingProxy ? "application/json" : "text/plain",
    };
    options.body = JSON.stringify({
      ...payload,
      token,
      action,
    });
  }

  try {
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      throw new ApiError(`Network Error: ${response.status} ${response.statusText}`, response.status);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new ApiError(data.message || "Operation failed", 400, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    if (error?.name === "AbortError") {
      throw new ApiError(
        "Permintaan ke server terlalu lama. Cek koneksi internet atau backend Google Apps Script Anda.",
        408
      );
    }

    if (error?.name === "TypeError" && /Failed to fetch/i.test(error.message || "")) {
      throw new ApiError(
        "Koneksi backend diblokir atau proxy Vercel gagal menjangkau Google Apps Script.",
        403
      );
    }

    console.error(`[API FAIL] ${method} ${action}:`, error);
    throw new ApiError(error?.message || "Koneksi ke server terputus.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: any = {}) =>
  performRequest<T>(action, "POST", body);
