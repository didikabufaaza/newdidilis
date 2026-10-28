type CacheEntry = { data: unknown; expires: number; fetchedAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 60_000; // 1 minute fresh
const REFERENCE_TTL_MS = 600_000; // 10 minutes for master reference data

function defaultTtlFor(url: string): number {
  if (
    url.startsWith("/api/doctors") ||
    url.startsWith("/api/tests") ||
    url.startsWith("/api/packages") ||
    url.startsWith("/api/settings/letterhead")
  ) {
    return REFERENCE_TTL_MS;
  }
  return DEFAULT_TTL_MS;
}

export function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("lis_token");
    const viewAsUserId = window.localStorage.getItem("viewAsUserId");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;
  }
  return headers;
}

/**
 * High-performance API client with SWR (Stale-While-Revalidate) & In-Flight Deduplication.
 * Renders instantly from memory cache if available while refreshing in background.
 */
export async function apiGet<T>(url: string, ttlMs?: number): Promise<T> {
  const ttl = ttlMs ?? defaultTtlFor(url);
  if (typeof window === "undefined") {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`GET ${url} failed with status ${res.status}`);
    return res.json();
  }

  const token = window.localStorage.getItem("lis_token") || "anon";
  const viewAs = window.localStorage.getItem("viewAsUserId") || "default";
  const key = `${token}:${viewAs}:${url}`;
  const now = Date.now();

  const hit = cache.get(key);

  // 1. Fresh Cache Hit -> Instant Return
  if (hit && hit.expires > now) {
    return hit.data as T;
  }

  // 2. In-flight Deduplication -> Reuse pending network call
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  // 3. Stale Cache Hit -> Return stale data instantly, revalidate silently in background
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, { headers: buildHeaders() });
      if (!res.ok) {
        if (hit) return hit.data as T;
        throw new Error(`GET ${url} failed with status ${res.status}`);
      }
      const data = (await res.json()) as T;
      cache.set(key, { data, expires: Date.now() + ttl, fetchedAt: Date.now() });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  if (hit && now - hit.fetchedAt < 300_000) {
    // Return stale data immediately for 0ms page switch, trigger background revalidate
    inFlight.set(key, fetchPromise);
    return hit.data as T;
  }

  inFlight.set(key, fetchPromise);
  return fetchPromise as Promise<T>;
}

/**
 * Universal helper for POST, PUT, DELETE with auth headers and automatic cache invalidation
 */
export async function apiMutate<T = any>(
  url: string,
  method: "POST" | "PUT" | "DELETE" | "PATCH",
  body?: unknown
): Promise<T> {
  const headers = buildHeaders();
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  clearApiCache();

  if (!res.ok) {
    let errMsg = `Operasi gagal (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
    } catch {}
    throw new Error(errMsg);
  }

  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export function prefetchApi(urls: string[]): Promise<void> {
  return Promise.allSettled(urls.map((u) => apiGet<unknown>(u))).then(() => {});
}

export function clearApiCache(): void {
  cache.clear();
  inFlight.clear();
}
