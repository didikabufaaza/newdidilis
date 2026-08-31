"use client";

import { useState, FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@labklinik.id");
  const [password, setPassword] = useState("password123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Login gagal (${res.status})`);
        setLoading(false);
        return;
      }

      // Store token in localStorage as fallback
      if (data.token) {
        localStorage.setItem("lis_token", data.token);
      }

      // Full page reload to pick up cookie
      window.location.href = "/dashboard";
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-40 right-20 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border-2 border-white rounded-full" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 0 1-2.133 1.59H8.603a2.25 2.25 0 0 1-2.133-1.59L5 14.5m14 0H5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">LabKlinik LIS</h1>
          <p className="text-xl text-blue-100 mb-6">Sistem Informasi Laboratorium Klinik</p>
          <p className="text-blue-200 text-sm leading-relaxed">
            Sistem terintegrasi untuk pengelolaan laboratorium klinik, mulai dari
            pendaftaran pasien, permintaan pemeriksaan, input hasil, hingga
            validasi dan pelaporan hasil laboratorium.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 0 1-2.133 1.59H8.603a2.25 2.25 0 0 1-2.133-1.59L5 14.5m14 0H5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-700">LabKlinik LIS</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Sistem</h2>
          <p className="text-gray-500 mb-8">Silakan masukkan email dan password Anda</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email / Username</label>
              <input id="email" type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email atau username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" required />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 bg-white" required />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1" tabIndex={-1}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Memproses...
                </>
              ) : "Masuk"}
            </button>
          </form>

          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Demo Akun</p>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Admin:</span> admin@labklinik.id</p>
              <p><span className="font-medium text-gray-800">Analis:</span> budi@labklinik.id</p>
              <p><span className="font-medium text-gray-800">Resepsionis:</span> dewi@labklinik.id</p>
              <p className="pt-1 border-t border-gray-100"><span className="font-medium text-gray-800">Password:</span> password123</p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun?{" "}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Daftar Sekarang
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
