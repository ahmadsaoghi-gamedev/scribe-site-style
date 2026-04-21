const STORAGE_KEY = "login-debug-log";
const EVENT_NAME = "login-debug-update";
const MAX_ENTRIES = 40;

export type LoginDebugEntry = {
  at: string;
  message: string;
  detail?: string;
};

function stringifyDetail(detail: unknown) {
  if (detail == null) return undefined;
  if (typeof detail === "string") return detail;

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export function readLoginDebugEntries(): LoginDebugEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushLoginDebug(message: string, detail?: unknown) {
  if (typeof window === "undefined") return;

  const nextEntries = [
    ...readLoginDebugEntries(),
    {
      at: new Date().toISOString(),
      message,
      detail: stringifyDetail(detail),
    },
  ].slice(-MAX_ENTRIES);

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextEntries }));
}

export function clearLoginDebugEntries() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
}

export function subscribeLoginDebug(listener: (entries: LoginDebugEntry[]) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<LoginDebugEntry[]>;
    listener(customEvent.detail || []);
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
