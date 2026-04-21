const REQUEST_TIMEOUT_MS = 15000;

function normalizeAppsScriptUrl() {
  const url =
    process.env.VITE_APPS_SCRIPT_URL ||
    process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
    "";

  return String(url || "").trim();
}

function withAction(urlString, action, extraSearchParams = []) {
  const url = new URL(urlString);
  if (action) url.searchParams.set("action", action);

  for (const [key, value] of extraSearchParams) {
    if (key === "action" || value == null) continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      if (typeof req.body === "string") {
        resolve(req.body);
        return;
      }

      resolve(JSON.stringify(req.body));
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw || "{}"));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const appsScriptUrl = normalizeAppsScriptUrl();
  if (!appsScriptUrl) {
    res.status(500).json({
      success: false,
      message: "VITE_APPS_SCRIPT_URL is not configured on the server.",
    });
    return;
  }

  const action = req.query?.action || "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const method = req.method || "GET";
    let upstreamResponse;

    if (method === "GET") {
      const searchParams = Object.entries(req.query || {});
      const url = withAction(appsScriptUrl, action, searchParams);

      upstreamResponse = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
    } else if (method === "POST") {
      const body = await readBody(req);
      const url = withAction(appsScriptUrl, action);

      upstreamResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body,
        signal: controller.signal,
      });
    } else {
      res.status(405).json({
        success: false,
        message: `Method ${method} is not allowed.`,
      });
      return;
    }

    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8";

    res.status(upstreamResponse.status || 200);
    res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (error) {
    if (error?.name === "AbortError") {
      res.status(504).json({
        success: false,
        message: "Proxy timeout while contacting Google Apps Script.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error?.message || "Unexpected proxy error.",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
