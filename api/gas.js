import https from "node:https";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

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

function normalizeCookies(setCookieHeader = []) {
  return setCookieHeader.map((cookie) => cookie.split(";")[0]).filter(Boolean);
}

function requestUrl(urlString, options, redirectCount = 0, cookies = []) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const headers = {
      ...(options.headers || {}),
    };

    if (cookies.length > 0) {
      headers.Cookie = cookies.join("; ");
    }

    if (options.body && headers["Content-Length"] == null) {
      headers["Content-Length"] = Buffer.byteLength(options.body);
    }

    const req = https.request(
      url,
      {
        method: options.method,
        headers,
      },
      (res) => {
        const chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", async () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const setCookie = normalizeCookies(res.headers["set-cookie"] || []);
          const nextCookies = [...cookies, ...setCookie];

          if (
            REDIRECT_STATUS_CODES.has(res.statusCode || 0) &&
            res.headers.location &&
            redirectCount < MAX_REDIRECTS
          ) {
            try {
              const nextUrl = new URL(res.headers.location, url).toString();
              const redirected = await requestUrl(nextUrl, options, redirectCount + 1, nextCookies);
              resolve(redirected);
            } catch (error) {
              reject(error);
            }
            return;
          }

          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(Object.assign(new Error("AbortError"), { name: "AbortError" }));
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
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

  try {
    const method = req.method || "GET";
    let upstreamResponse;

    if (method === "GET") {
      const url = withAction(appsScriptUrl, action, Object.entries(req.query || {}));
      upstreamResponse = await requestUrl(url.toString(), {
        method: "GET",
      });
    } else if (method === "POST") {
      const bodyStr = await readBody(req);
      const url = withAction(appsScriptUrl, action, Object.entries(req.query || {}));

      upstreamResponse = await requestUrl(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: bodyStr,
      });
    } else {
      res.status(405).json({
        success: false,
        message: `Method ${method} is not allowed.`,
      });
      return;
    }

    const contentType = upstreamResponse.headers["content-type"] || "application/json; charset=utf-8";

    res.status(upstreamResponse.status || 200);
    res.setHeader("Content-Type", contentType);
    res.send(upstreamResponse.body);
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
  }
}
