"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Patient {
  id: number;
  medicalRecordNo: string;
  noLab: string | null;
  noPermintaan: string | null;
  name: string;
  gender: string;
  dateOfBirth: string;
  age: string | null;
  phone: string | null;
  bloodType: string | null;
  doctorId: number | null;
  doctorName: string | null;
  room: string | null;
  diagnosis: string | null;
  createdAt: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string | null;
}

interface Test {
  id: number;
  code: string;
  name: string;
  categoryName: string | null;
  sampleType: string;
  price: string | null;
}

interface PackageItem {
  testId: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  price: string | null;
}

interface TestPackage {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: string | null;
  items: PackageItem[];
}

function NewOrderContent() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [priority, setPriority] = useState("normal");
  const [room, setRoom] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [testTab, setTestTab] = useState<"item" | "paket">("item");

  useEffect(() => {
    const token = localStorage.getItem("lis_token");
    const viewAsUserId = localStorage.getItem("viewAsUserId");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

    Promise.all([
      fetch("/api/patients?limit=100", { headers }).then((r) => r.json()),
      fetch("/api/doctors", { headers }).then((r) => r.json()),
      fetch("/api/tests?all=true", { headers }).then((r) => r.json()),
      fetch("/api/packages", { headers }).then((r) => r.json()),
    ]).then(([pData, dData, tData, pkgData]) => {
      const pts: Patient[] = pData.patients || [];
      setPatients(pts);
      setDoctorsList(dData.doctors || []);
      setTests(tData.tests || []);
      setPackages(pkgData.packages || []);

      // Auto-select patient if preselected in query
      if (preselectedPatientId) {
        const pt = pts.find((p) => p.id === parseInt(preselectedPatientId));
        if (pt) {
          setSelectedPatient(pt);
          if (pt.doctorId) setSelectedDoctor(pt.doctorId.toString());
          if (pt.room) setRoom(pt.room);
          if (pt.diagnosis) setDiagnosis(pt.diagnosis);
        }
      }

      setLoading(false);
    });
  }, [preselectedPatientId]);

  const selectPatientHandler = (p: Patient) => {
    setSelectedPatient(p);
    setShowDropdown(false);
    setPatientSearch("");
    if (p.doctorId) setSelectedDoctor(p.doctorId.toString());
    if (p.room) setRoom(p.room);
    if (p.diagnosis) setDiagnosis(p.diagnosis);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.medicalRecordNo.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.noLab && p.noLab.toLowerCase().includes(patientSearch.toLowerCase())) ||
      (p.noPermintaan && p.noPermintaan.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const filteredTests = tests.filter(
    (t) =>
      !selectedTests.find((st) => st.id === t.id) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
        (t.categoryName || "").toLowerCase().includes(testSearch.toLowerCase()))
  );

  const totalPrice = selectedTests.reduce(
    (s, t) => s + parseFloat(t.price || "0"),
    0
  );

  const handleSubmit = async () => {
    if (!selectedPatient || selectedTests.length === 0) return;
    setSaving(true);

    try {
      const token = localStorage.getItem("lis_token");
      const viewAsUserId = localStorage.getItem("viewAsUserId");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: selectedDoctor ? parseInt(selectedDoctor) : null,
          priority,
          room: room || selectedPatient.room || null,
          clinicalNotes: clinicalNotes || null,
          diagnosis: diagnosis || selectedPatient.diagnosis || null,
          testIds: selectedTests.map((t) => t.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/dashboard/orders/${data.order.id}`;
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat order");
      }
    } catch {
      alert("Terjadi kesalahan koneksi");
    }

    setSaving(false);
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedPatient && preselectedPatientId
              ? `Order Pemeriksaan Lab: ${selectedPatient.name}`
              : "Buat Order Pemeriksaan Lab Baru"}
          </h1>
          <p className="text-gray-500 text-sm">
            {selectedPatient
              ? `No. Lab: ${selectedPatient.noLab || "-"} | No. Permintaan: ${selectedPatient.noPermintaan || "-"}`
              : "Pilih pasien dan tentukan parameter pemeriksaan laboratorium"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>👤 Data Identitas Pasien</span>
              {selectedPatient && !preselectedPatientId && (
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ganti Pasien
                </button>
              )}
            </h3>

            {selectedPatient ? (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-gray-900">{selectedPatient.name}</span>
                      <span className="font-mono text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                        {selectedPatient.medicalRecordNo}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-gray-700 border">
                        {selectedPatient.gender === "male" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1">
                      <div>
                        <span className="text-gray-400 block">No. Lab:</span>
                        <span className="font-mono font-medium text-blue-700">{selectedPatient.noLab || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">No. Permintaan:</span>
                        <span className="font-mono font-medium text-blue-700">{selectedPatient.noPermintaan || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Umur:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.age || selectedPatient.dateOfBirth}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Ruang / Poli:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.room || "Poli Umum"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Dokter Pengirim:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.doctorName || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Gol. Darah:</span>
                        <span className="font-medium text-gray-900">{selectedPatient.bloodType || "-"}</span>
                      </div>
                    </div>

                    {selectedPatient.diagnosis && (
                      <div className="text-xs text-gray-700 bg-white/80 p-2 rounded border mt-2">
                        <span className="font-semibold text-gray-600">Diagnosis / Ket:</span> {selectedPatient.diagnosis}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari pasien (Nama, No. RM, No. Lab, No. Permintaan)..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        Pasien tidak ditemukan.{" "}
                        <Link href="/dashboard/patients" className="text-blue-600 font-medium hover:underline">
                          + Daftarkan Pasien Baru
                        </Link>
                      </div>
                    ) : (
                      filteredPatients.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectPatientHandler(p)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                            <span className="font-mono text-xs text-blue-600 font-medium">{p.medicalRecordNo}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                            <span>{p.gender === "male" ? "L" : "P"}</span>
                            <span>{p.age || p.dateOfBirth}</span>
                            {p.room && <span>📍 {p.room}</span>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Details Confirmation */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">🩺 Informasi Permintaan Lab</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dokter Pengirim</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Pilih Dokter Pengirim --</option>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.specialization ? `(${d.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruang / Unit Perawatan</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., IGD, Poli Umum, Rawat Inap Melati..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas Pemeriksaan</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  <option value="normal">Normal / Rutin</option>
                  <option value="urgent">Urgent</option>
                  <option value="cito">CITO (Segera)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis / Indikasi Klinis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g., Suspek Demam Tifoid, Kontrol DM..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Instruksi khusus / catatan spesimen..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Test selection with Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-gray-900">🧪 Pilih Parameter Pemeriksaan</h3>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTestTab("item")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    testTab === "item" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🧪 Per Item
                </button>
                <button
                  type="button"
                  onClick={() => setTestTab("paket")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    testTab === "paket" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📦 Paket Pemeriksaan
                </button>
              </div>
            </div>

            {testTab === "paket" ? (
              /* PAKET TAB */
              <div className="space-y-3">
                {packages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p className="text-3xl mb-2">📦</p>
                    Belum ada paket pemeriksaan.{" "}
                    <Link href="/dashboard/packages" className="text-blue-600 hover:underline font-medium">
                      Buat paket di Menu Paket Pemeriksaan
                    </Link>
                  </div>
                ) : (
                  packages.map((pkg) => {
                    const pkgTotal = pkg.items.reduce((s, i) => s + parseFloat(i.price || "0"), 0);
                    const allSelected =
                      pkg.items.length > 0 &&
                      pkg.items.every((pi) => selectedTests.find((st) => st.id === pi.testId));
                    const someSelected = pkg.items.some((pi) => selectedTests.find((st) => st.id === pi.testId));

                    return (
                      <div
                        key={pkg.id}
                        className={`border rounded-xl p-4 transition-all ${
                          allSelected
                            ? "bg-emerald-50 border-emerald-300 shadow-sm"
                            : "hover:border-blue-300 border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-blue-700 bg-blue-100 font-semibold px-2 py-0.5 rounded">
                                {pkg.code}
                              </span>
                              <span className="font-bold text-gray-900 text-sm">{pkg.name}</span>
                            </div>
                            {pkg.description && (
                              <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                              <span className="font-medium">{pkg.items.length} parameter</span>
                              <span>·</span>
                              <span className="font-semibold text-emerald-700">
                                Rp {pkgTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pkg.items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700 font-medium"
                                >
                                  {item.testName}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (allSelected) {
                                const pkgTestIds = new Set(pkg.items.map((pi) => pi.testId));
                                setSelectedTests(selectedTests.filter((st) => !pkgTestIds.has(st.id)));
                              } else {
                                const existingIds = new Set(selectedTests.map((st) => st.id));
                                const newTests = pkg.items
                                  .filter((pi) => !existingIds.has(pi.testId))
                                  .map((pi) => ({
                                    id: pi.testId,
                                    code: pi.testCode,
                                    name: pi.testName,
                                    categoryName: pi.categoryName,
                                    sampleType: "blood",
                                    price: pi.price,
                                  }));
                                setSelectedTests([...selectedTests, ...newTests]);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shadow-sm ${
                              allSelected
                                ? "bg-emerald-200 text-emerald-900 hover:bg-emerald-300"
                                : someSelected
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {allSelected ? "✓ Terpilih Semua" : someSelected ? "+ Tambah Sisa" : "Pilih Paket"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ITEM TAB */
              <div>
                <input
                  type="text"
                  placeholder="🔍 Cari pemeriksaan (nama atau kode)..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3 bg-white"
                />
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {filteredTests.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">
                      {testSearch ? "Pemeriksaan tidak ditemukan" : "Semua pemeriksaan telah dipilih"}
                    </p>
                  ) : (
                    filteredTests.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setSelectedTests([...selectedTests, t])}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                              {t.code}
                            </span>
                            <span className="font-medium text-gray-900">{t.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t.categoryName || "Umum"} · {t.sampleType}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600">
                            Rp {parseInt(t.price || "0").toLocaleString("id-ID")}
                          </span>
                          <span className="text-blue-600 font-bold text-lg">+</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>📋 Parameter Terpilih</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {selectedTests.length}
              </span>
            </h3>

            {selectedTests.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p className="text-3xl mb-2">🧪</p>
                Belum ada pemeriksaan dipilih.
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-80 overflow-y-auto mb-4 pr-1">
                  {selectedTests.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium text-gray-900 truncate">{t.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{t.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">
                          Rp {parseInt(t.price || "0").toLocaleString("id-ID")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTests(selectedTests.filter((st) => st.id !== t.id))}
                          className="text-gray-400 hover:text-red-500 font-bold p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Jumlah Parameter:</span>
                    <span className="font-semibold text-gray-900">{selectedTests.length} item</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">Total Biaya:</span>
                    <span className="text-base font-bold text-emerald-700">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedPatient || selectedTests.length === 0 || saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Memproses Order...
                </>
              ) : (
                "✓ Simpan & Buat Order Lab"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 lg:p-8">
          <div className="skeleton h-8 w-48 rounded mb-8" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      }
    >
      <NewOrderContent />
    </Suspense>
  );
}
