"use client";

import { useEffect, useState, useRef } from "react";

interface LetterheadSettings {
  id?: number;
  pemda: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalEmail: string;
  hospitalPhone: string;
  logoLeft: string | null;
  logoRight: string | null;
}

export default function LetterheadPage() {
  const [settings, setSettings] = useState<LetterheadSettings>({
    pemda: "",
    hospitalName: "",
    hospitalAddress: "",
    hospitalEmail: "",
    hospitalPhone: "",
    logoLeft: null,
    logoRight: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/letterhead")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            pemda: data.settings.pemda || "",
            hospitalName: data.settings.hospitalName || "",
            hospitalAddress: data.settings.hospitalAddress || "",
            hospitalEmail: data.settings.hospitalEmail || "",
            hospitalPhone: data.settings.hospitalPhone || "",
            logoLeft: data.settings.logoLeft || null,
            logoRight: data.settings.logoRight || null,
          });
        }
        setLoading(false);
      });
  }, []);

  const handleImageUpload = (side: "left" | "right", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSettings((prev) => ({
        ...prev,
        [side === "left" ? "logoLeft" : "logoRight"]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings/letterhead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-48 rounded mb-8" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Kop Surat</h1>
          <p className="text-gray-500 text-sm mt-1">
            Atur kop surat untuk hasil cetak dan PDF laboratorium
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Tersimpan</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informasi Instansi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PEMDA (Pemerintah Daerah)
              </label>
              <input
                type="text"
                value={settings.pemda}
                onChange={(e) => setSettings({ ...settings, pemda: e.target.value })}
                placeholder="PEMERINTAH KABUPATEN CONTOH"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Rumah Sakit / Laboratorium
              </label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                placeholder="RSUD CONTOH"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Rumah Sakit
              </label>
              <textarea
                value={settings.hospitalAddress}
                onChange={(e) => setSettings({ ...settings, hospitalAddress: e.target.value })}
                placeholder="Jl. Contoh No. 123, Kecamatan Contoh, Kabupaten Contoh"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Rumah Sakit
                </label>
                <input
                  type="email"
                  value={settings.hospitalEmail}
                  onChange={(e) => setSettings({ ...settings, hospitalEmail: e.target.value })}
                  placeholder="info@rsud-contoh.go.id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon Rumah Sakit
                </label>
                <input
                  type="tel"
                  value={settings.hospitalPhone}
                  onChange={(e) => setSettings({ ...settings, hospitalPhone: e.target.value })}
                  placeholder="(021) 1234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mt-6 mb-4">Logo Kop Surat</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Logo Kiri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Kiri (Pemda/Instansi)
              </label>
              <input
                type="file"
                ref={leftInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("left", file);
                }}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => leftInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {settings.logoLeft ? (
                  <img
                    src={settings.logoLeft}
                    alt="Logo Kiri"
                    className="max-h-24 mx-auto"
                  />
                ) : (
                  <div className="text-gray-400">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-xs">Klik untuk upload</p>
                  </div>
                )}
              </div>
              {settings.logoLeft && (
                <button
                  onClick={() => setSettings({ ...settings, logoLeft: null })}
                  className="text-xs text-red-500 hover:text-red-700 mt-2"
                >
                  Hapus Logo
                </button>
              )}
            </div>

            {/* Logo Kanan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Kanan (RS/Lab)
              </label>
              <input
                type="file"
                ref={rightInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("right", file);
                }}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => rightInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {settings.logoRight ? (
                  <img
                    src={settings.logoRight}
                    alt="Logo Kanan"
                    className="max-h-24 mx-auto"
                  />
                ) : (
                  <div className="text-gray-400">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-xs">Klik untuk upload</p>
                  </div>
                )}
              </div>
              {settings.logoRight && (
                <button
                  onClick={() => setSettings({ ...settings, logoRight: null })}
                  className="text-xs text-red-500 hover:text-red-700 mt-2"
                >
                  Hapus Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preview Kop Surat</h3>
          <div className="border border-gray-300 rounded-lg p-6 bg-white">
            {/* Letterhead */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-800">
              {/* Logo kiri */}
              <div className="w-20 h-20 flex items-center justify-center">
                {settings.logoLeft ? (
                  <img src={settings.logoLeft} alt="Logo" className="max-h-full max-w-full" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Logo
                  </div>
                )}
              </div>

              {/* Teks tengah */}
              <div className="flex-1 text-center px-4">
                {settings.pemda && (
                  <p className="text-sm font-semibold text-gray-800">{settings.pemda}</p>
                )}
                <p className="text-lg font-bold text-gray-900">
                  {settings.hospitalName || "NAMA RUMAH SAKIT"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {settings.hospitalAddress || "Alamat Rumah Sakit"}
                </p>
                <p className="text-xs text-gray-600">
                  {settings.hospitalEmail && `Email: ${settings.hospitalEmail}`}
                  {settings.hospitalEmail && settings.hospitalPhone && " | "}
                  {settings.hospitalPhone && `Telp: ${settings.hospitalPhone}`}
                </p>
              </div>

              {/* Logo kanan */}
              <div className="w-20 h-20 flex items-center justify-center">
                {settings.logoRight ? (
                  <img src={settings.logoRight} alt="Logo" className="max-h-full max-w-full" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Logo
                  </div>
                )}
              </div>
            </div>

            {/* Sample content */}
            <div className="text-center mb-4">
              <p className="text-sm font-bold underline">HASIL PEMERIKSAAN LABORATORIUM</p>
              <p className="text-xs text-gray-500 mt-1">No. LAB-2024-0001</p>
            </div>
            <div className="bg-gray-50 rounded p-3 text-xs text-gray-500">
              <p>Nama Pasien: Ahmad Hidayat</p>
              <p>No. RM: RM-2024-0001</p>
              <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
