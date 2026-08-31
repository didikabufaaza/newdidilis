"use client";

import { useEffect } from "react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Monkey-patch fetch to automatically include auth token
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      
      // Only add auth to our own API calls
      if (url.startsWith("/api/")) {
        const token = localStorage.getItem("lis_token");
        if (token) {
          const headers = new Headers(init?.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return originalFetch(input, { ...init, headers });
        }
      }
      
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
