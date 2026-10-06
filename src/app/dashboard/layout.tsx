"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";
import ViewAsDropdown from "@/components/ViewAsDropdown";
import { prefetchApi } from "@/lib/api-client";

function decodeJwtPayload(token: string): { id: number; name: string; email: string; role: string } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json);
    if (!payload || typeof payload.id !== "number") return null;
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lis_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Decode JWT locally for instant render (API requests still re-verify).
    try {
      const payload = decodeJwtPayload(token);
      if (!payload || !payload.id) throw new Error("invalid token");
      setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role });
      setChecking(false);
    } catch {
      window.location.href = "/login";
      return;
    }

    // Prefetch the data most menus need - served instantly from the API cache.
    prefetchApi([
      "/api/orders?recent24=1&limit=30",
      "/api/orders?limit=100",
      "/api/dashboard",
      "/api/tests?all=true",
      "/api/doctors",
      "/api/packages",
      "/api/tests/categories",
      "/api/settings/letterhead",
    ]).catch(() => {});

    // Background re-validation + canAnalyze/imgAccess refresh.
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        localStorage.setItem("canAnalyze", data.user?.canAnalyze ? "true" : "false");
        if (data.user?.role && data.user.role !== user?.role) {
          setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role });
        }
      })
      .catch(() => {
        localStorage.removeItem("lis_token");
        window.location.href = "/login";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-gray-50 print:overflow-visible">
          <div className="lg:hidden print:hidden h-14" />
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-end items-center min-h-[44px] print:hidden">
            {user.role === "superadmin" && <ViewAsDropdown currentUserId={user.id} />}
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
