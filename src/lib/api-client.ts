// Client-side API helper that attaches auth token and view-as header
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("lis_token") : null;
  const viewAsUserId = typeof window !== "undefined" ? localStorage.getItem("viewAsUserId") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (viewAsUserId) {
    headers["X-View-As"] = viewAsUserId;
  }

  return fetch(url, { ...options, headers });
}
