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
  // In production (non-localhost), always use the Vercel proxy to avoid
  // GAS redirect stripping POST bodies and to hide the GAS URL from clients.
  if (!isLocalHost()) return PROXY_API_PATH;
  // In local dev, go directly to GAS if configured
  return APPS_SCRIPT_URL;
}

export const USE_MOCK = isLocalHost() && !APPS_SCRIPT_URL;

async function performRequest<T>(
  action: string,
  method: "GET" | "POST",
  payload: any = {}
): Promise<T> {
  if (USE_MOCK) {
    pushLoginDebug("api: mock mode", { action, method });
    return mockHandler(action, method, payload) as T;
  }

  const apiBaseUrl = getApiBaseUrl();
  pushLoginDebug("api: request start", {
    action,
    method,
    base: apiBaseUrl || "(empty)",
    localhost: isLocalHost(),
  });
  console.log(`[API] 🚀 ${action} | base=${apiBaseUrl || "(empty)"} | mock=${USE_MOCK} | localhost=${isLocalHost()}`);
  if (!apiBaseUrl) {
    pushLoginDebug("api: missing base url");
    console.error("[API] ❌ No API URL configured!");
    throw new ApiError("VITE_APPS_SCRIPT_URL is not configured. Check your environment variables.");
  }

  const usingProxy = apiBaseUrl.startsWith("/");
  const url = usingProxy
    ? new URL(apiBaseUrl, window.location.origin)
    : new URL(apiBaseUrl);
  pushLoginDebug("api: resolved url", { usingProxy, url: url.toString() });
  console.log(`[API] 🌐 usingProxy=${usingProxy} | fullUrl=${url.toString().slice(0, 80)}`);

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
    console.log(`[API] 📡 fetch → ${url.toString().slice(0, 100)}`);
    pushLoginDebug("api: fetch send", { action, method });
    const response = await fetch(url.toString(), options);
    console.log(`[API] ✅ response status=${response.status} ok=${response.ok}`);

    pushLoginDebug("api: fetch response", { status: response.status, ok: response.ok });
    if (!response.ok) {
      throw new ApiError(`Network Error: ${response.status} ${response.statusText}`, response.status);
    }

    const data: ApiResponse = await response.json();
    pushLoginDebug("api: response body", data);
    console.log(`[API] 📦 data=`, data);

    if (!data.success) {
      throw new ApiError(data.message || "Operation failed", 400, data);
    }

    return data as T;
  } catch (error: any) {
    pushLoginDebug("api: catch", { name: error?.name, message: error?.message });
    console.error(`[API] ❌ CATCH name=${error?.name} message=${error?.message}`);
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
    pushLoginDebug("api: finally");
    console.log(`[API] 🏁 finally — clearing timeout`);
    window.clearTimeout(timeoutId);
  }
}

export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

export const apiPost = <T = any>(action: string, body: any = {}) =>
  performRequest<T>(action, "POST", body);
