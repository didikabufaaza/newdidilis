type CacheEntry = { data: unknown; expires: number };

const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 30_000;

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("lis_token");
    const viewAsUserId = window.localStorage.getItem("viewAsUserId");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;
  }
  return headers;
}

export async function apiGet<T>(url: string, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  if (typeof window === "undefined") {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`GET ${url} failed with status ${res.status}`);
    return res.json();
  }

  const token = window.localStorage.getItem("lis_token") || "anon";
  const key = `${token}:${url}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }

  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    if (hit) return hit.data as T;
    throw new Error(`GET ${url} failed with status ${res.status}`);
  }
  const data = (await res.json()) as T;
  cache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

export function clearApiCache(): void {
  cache.clear();
}