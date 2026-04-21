const REQUEST_TIMEOUT_MS = 15000;

/**
 * Normalizes the Spreadsheet URL from Environment Variables.
 * Uses VITE_ prefix as prioritized by the user's config.
 */
function getTargetUrl() {
  const url =
    process.env.VITE_APPS_SCRIPT_URL ||
    process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
    "";
  return String(url).trim();
}

/**
 * Utility to safely get the request data (query + body).
 * Vercel pre-parses JSON and Form bodies into req.body.
 */
function getRequestParams(req) {
  const query = req.query || {};
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
  return { ...query, ...body };
}

/**
 * World-Class Vercel Proxy for Google Apps Script.
 * Handles the characteristic 302 redirects of GAS by converting
 * all interactions into GET requests with encoded query parameters.
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const targetBaseUrl = getTargetUrl();
  
  if (!targetBaseUrl) {
    return res.status(500).json({
      success: false,
      message: "Target API URL not configured. Set VITE_APPS_SCRIPT_URL in Vercel settings.",
    });
  }

  const params = getRequestParams(req);
  const action = params.action || "";
  const method = req.method || "GET";

  try {
    const url = new URL(targetBaseUrl);
    
    // Merge everything into the GAS URL parameters
    // This is the CRITICAL fix for the 'stuck' issue: it ensures data survives
    // the inevitable 302 redirect from script.google.com -> script.googleusercontent.com
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    // Ensure action is always set if present in params
    if (action) url.searchParams.set("action", action);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Upstream Call to GAS via GET (proven to be redirect-safe)
    const upstreamResponse = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      redirect: "follow"
    });

    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get("content-type") || "application/json";
    const bodyText = await upstreamResponse.text();

    // Standardize Response
    res.status(upstreamResponse.status || 200);
    res.setHeader("Content-Type", contentType);
    res.send(bodyText);

  } catch (error) {
    const isTimeout = error.name === "AbortError";
    console.error(`[PROXY ERROR] ${method} ${action}:`, error);

    res.status(isTimeout ? 504 : 500).json({
      success: false,
      message: isTimeout 
        ? "Google Apps Script took too long to respond. Connection timed out." 
        : `Proxy Error: ${error.message}`,
    });
  }
}

