"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";
import ViewAsDropdown from "@/components/ViewAsDropdown";

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

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("canAnalyze", data.user?.canAnalyze ? "true" : "false");
        setChecking(false);
      })
      .catch(() => {
        localStorage.removeItem("lis_token");
        window.location.href = "/login";
      });
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="lg:hidden h-14" />
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-end items-center min-h-[44px]">
            {user.role === "superadmin" && <ViewAsDropdown currentUserId={user.id} />}
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
