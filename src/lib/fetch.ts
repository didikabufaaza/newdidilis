export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("lis_token") : null;
  const viewAsUserId = typeof window !== "undefined" ? localStorage.getItem("viewAsUserId") : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (viewAsUserId) {
    headers.set("X-View-As", viewAsUserId);
  }
  return fetch(url, { ...options, headers });
}
