import { mockHandler } from "./mock";
import { getSession } from "./auth";

/**
 * Standard API Response Shape.
 * Many GAS endpoints return fields at the top level.
 */
export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Custom error class for API failures.
 * Provides structured access to status and message.
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
 * Backend Endpoint Configuration.
 * Derived from Environment Variables.
 */
export const APPS_SCRIPT_URL =
  (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  "";

/**
 * Development safety switch.
 * Automatically enables mock mode if no backend URL is provided.
 */
export const USE_MOCK = !APPS_SCRIPT_URL;

/**
 * Generic request orchestrator.
 * Handles environment validation, CORS bypass, and error normalization.
 */
async function performRequest<T>(
  action: string,
  method: "GET" | "POST",
  payload: any = {}
): Promise<T> {
  // Developer convenience: use mock data if no backend is reachable
  if (USE_MOCK) {
    return mockHandler(action, method, payload);
  }

  if (!APPS_SCRIPT_URL) {
    throw new ApiError("VITE_APPS_SCRIPT_URL is not configured. Check your environment variables.");
  }

  const url = new URL(APPS_SCRIPT_URL);
  const session = getSession();
  const token = session?.token || "";

  // WORLD-CLASS SOLUTIONS ARCHITECT NOTE:
  // To avoid CORS preflight (OPTIONS), we must trigger a "simple request".
  // 1. Method must be GET, HEAD, or POST.
  // 2. ONLY allowed Content-Type is text/plain, multipart/form-data, or application/x-www-form-urlencoded.
  // 3. No custom headers (like Authorization or X-*).
  // 4. No mode: 'no-cors' if we need to read the JSON response.
  
  const options: RequestInit = {
    method,
  };

  if (method === "GET") {
    url.searchParams.set("token", token);
    url.searchParams.set("action", action);
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
  } else {
    // POST request: Send action in searchParams AND body for redundancy/routing
    url.searchParams.set("action", action);
    
    // We set Content-Type to text/plain manually here to be safe
    options.headers = {
      "Content-Type": "text/plain",
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
    
    // Check if it's a CORS preflight failure (often manifests as TypeError: Failed to fetch)
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new ApiError(
        "Koneksi backend diblokir (CORS). Pastikan Google Apps Script dideploy sebagai Web App dengan akses 'Anyone'.",
        403
      );
    }
    
    console.error(`[API FAIL] ${method} ${action}:`, error);
    throw new ApiError(error.message || "Koneksi ke server terputus.");
  }
}

/**
 * Unified GET handler.
 * Automatically injects session token and URL parameters.
 */
export const apiGet = <T = any>(action: string, params: Record<string, any> = {}) =>
  performRequest<T>(action, "GET", params);

/**
 * Unified POST handler.
 * Bypasses CORS and injects session token into request body.
 */
export const apiPost = <T = any>(action: string, body: any = {}) =>
  performRequest<T>(action, "POST", body);
