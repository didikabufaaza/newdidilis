"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
          phone: phone.trim() || undefined,
        }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Pendaftaran gagal (${res.status})`);
        setLoading(false);
        return;
      }

      setRegistered(true);
      setLoading(false);
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[70%] text-white flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/30 to-transparent" />
        <div className="relative z-10 text-center max-w-md">
          <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 0 1-2.133 1.59H8.603a2.25 2.25 0 0 1-2.133-1.59L5 14.5m14 0H5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">LabKlinik LIS</h1>
          <p className="text-xl text-blue-100 mb-6">Sistem Informasi Laboratorium Klinik</p>
          <p className="text-blue-100/90 text-sm leading-relaxed">
            Daftar untuk membuat akun baru dan mulai menggunakan sistem laboratorium klinik.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:w-[30%] flex flex-col justify-center items-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 0 1-2.133 1.59H8.603a2.25 2.25 0 0 1-2.133-1.59L5 14.5m14 0H5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-700">LabKlinik LIS</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h2>
          <p className="text-gray-500 mb-8">Silakan isi data Anda untuk mendaftar</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {registered ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Pendaftaran Berhasil!</h3>
              <p className="text-emerald-700 text-sm mb-4">
                Akun Anda telah berhasil didaftarkan dan <strong>menunggu persetujuan admin</strong>.
              </p>
              <p className="text-emerald-600 text-xs mb-6">
                Admin akan memverifikasi akun Anda. Setelah disetujui, Anda dapat masuk menggunakan email atau username yang telah didaftarkan.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                ← Kembali ke Halaman Masuk
              </Link>
            </div>
          ) : (
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap *</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" required />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" required />
            </div>

            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
              <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="username Anda"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" required />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password * (minimal 6 karakter)</label>
              <div className="relative">
                <input id="password" type={showPw ? "text" : "password"} autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 bg-white" required minLength={6} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1" tabIndex={-1}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">No. HP (opsional)</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Memproses...
                </>
              ) : "Daftar"}
            </button>
          </form>
          )}

          {!registered && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Masuk
            </Link>
          </p>
          )}
        </div>
      </div>
    </div>
  );
}
