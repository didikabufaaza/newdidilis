"use client";

import { useEffect, useState, useCallback } from "react";
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
  email: string | null;
  address: string | null;
  bloodType: string | null;
  insuranceNo: string | null;
  paymentStatus: string | null;
  doctorId: number | null;
  doctorName: string | null;
  doctorSpecialization: string | null;
  room: string | null;
  diagnosis: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string | null;
}

const COMMON_ROOMS = [
  "IGD (Instalasi Gawat Darurat)",
  "Poli Umum",
  "Poli Penyakit Dalam",
  "Poli Anak",
  "Poli Kebidanan & Kandungan",
  "Poli Jantung",
  "Poli Bedah",
  "Poli Saraf",
  "Rawat Inap Melati",
  "Rawat Inap Mawar",
  "Rawat Inap Dahlia",
  "Rawat Inap Anggrek",
  "ICU / ICCU",
  "NICU / PICU",
  "Ruang Operasi (OK)",
  "Medical Check Up (MCU)",
  "Rujukan Luar",
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    noLab: "",
    noPermintaan: "",
    medicalRecordNo: "",
    name: "",
    gender: "male",
    dateOfBirth: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    insuranceNo: "",
    paymentStatus: "UMUM",
    customPayment: "",
    doctorId: "",
    room: "",
    diagnosis: "",
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: "15" });
      const token = localStorage.getItem("lis_token");
      const viewAsUserId = localStorage.getItem("viewAsUserId");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

      const res = await fetch(`/api/patients?${params}`, { headers });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPatients(data.patients || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setPatients([]);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const token = localStorage.getItem("lis_token");
    const viewAsUserId = localStorage.getItem("viewAsUserId");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

    fetch("/api/doctors", { headers })
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors || []))
      .catch(() => setDoctors([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Helper function to calculate age from date of birth
  const calculateAgeFromDob = (dobString: string): string => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    if (today.getDate() < dob.getDate()) {
      months--;
    }
    if (years > 0) {
      return `${years} Tahun${months > 0 ? ` ${months} Bulan` : ""}`;
    } else if (months > 0) {
      return `${months} Bulan`;
    } else {
      const days = Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
      return `${Math.max(0, days)} Hari`;
    }
  };

  const handleDobChange = (dob: string) => {
    const autoAge = calculateAgeFromDob(dob);
    setForm((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: autoAge,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    const currentYear = new Date().getFullYear();
    const nextSeq = String(total + 1).padStart(4, "0");

    setForm({
      noLab: `LAB-${currentYear}-${nextSeq} (Otomatis)`,
      noPermintaan: `REQ-${currentYear}-${nextSeq} (Otomatis)`,
      medicalRecordNo: `RM-${currentYear}-${nextSeq}`,
      name: "",
      gender: "male",
      dateOfBirth: "",
      age: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "",
      insuranceNo: "",
      paymentStatus: "UMUM",
      customPayment: "",
      doctorId: doctors[0]?.id?.toString() || "",
      room: "Poli Umum",
      diagnosis: "",
    });
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    const ps = p.paymentStatus || "UMUM";
    const isCustom = !["BPJS", "UMUM"].includes(ps);
    setForm({
      noLab: p.noLab || `LAB-${new Date().getFullYear()}-${String(p.id).padStart(4, "0")}`,
      noPermintaan: p.noPermintaan || `REQ-${new Date().getFullYear()}-${String(p.id).padStart(4, "0")}`,
      medicalRecordNo: p.medicalRecordNo,
      name: p.name,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      age: p.age || calculateAgeFromDob(p.dateOfBirth),
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      bloodType: p.bloodType || "",
      insuranceNo: p.insuranceNo || "",
      paymentStatus: isCustom ? "Jaminan Lainnya" : ps,
      customPayment: isCustom ? ps : "",
      doctorId: p.doctorId?.toString() || "",
      room: p.room || "",
      diagnosis: p.diagnosis || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editing ? `/api/patients/${editing.id}` : "/api/patients";
      const method = editing ? "PUT" : "POST";

      const submitData = {
        ...form,
        paymentStatus: form.paymentStatus === "Jaminan Lainnya" ? form.customPayment : form.paymentStatus,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setShowModal(false);

        // Jika buat pasien baru, langsung masuk ke menu order pemeriksaan lab
        if (!editing) {
          const data = await res.json();
          window.location.href = `/dashboard/orders/new?patientId=${data.patient.id}`;
          return;
        }

        fetchPatients();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan pasien");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data pasien ini?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPatients();
      } else {
        alert("Gagal menghapus pasien. Mungkin masih ada data order terkait.");
      }
    } catch {
      alert("Gagal menghapus pasien");
    }
    setDeleting(null);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pasien</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data identitas pasien laboratorium ({total} pasien terdaftar)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          ➕ Tambah Pasien Baru
        </button>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Cari nama, No. RM, No. Lab, No. Permintaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data pasien...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-5xl mb-3">👥</p>
            <h3 className="font-medium text-gray-900 mb-1 text-lg">Belum Ada Data Pasien</h3>
            <p className="text-gray-500 text-sm mb-4">
              Klik tombol &quot;Tambah Pasien Baru&quot; untuk mendaftarkan pasien
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Tambah Pasien
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-3 px-4">No. RM / No. Lab</th>
                    <th className="text-left py-3 px-4">Nama Pasien & Umur</th>
                    <th className="text-left py-3 px-4">L/P</th>
                    <th className="text-left py-3 px-4">Dokter Pengirim</th>
                    <th className="text-left py-3 px-4">Ruang</th>
                    <th className="text-left py-3 px-4">Diagnosis</th>
                    <th className="text-left py-3 px-4">Tgl Daftar</th>
                    <th className="text-right py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-blue-600">
                          {p.medicalRecordNo}
                        </div>
                        <div className="font-mono text-[11px] text-gray-500 mt-0.5">
                          {p.noLab || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.age || p.dateOfBirth}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            p.gender === "male"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-pink-50 text-pink-700 border border-pink-100"
                          }`}
                        >
                          {p.gender === "male" ? "L" : "P"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.doctorName ? (
                          <div>
                            <div className="text-gray-900 font-medium">{p.doctorName}</div>
                            <div className="text-[11px] text-gray-500">{p.doctorSpecialization || ""}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium">
                          {p.room || "Poli Umum"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-[150px] truncate text-xs" title={p.diagnosis || ""}>
                        {p.diagnosis || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy HH:mm", { locale: idLocale }) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/orders/new?patientId=${p.id}`}
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded text-xs font-medium mr-2 transition-colors"
                          title="Buat Order Lab untuk Pasien Ini"
                        >
                          📋 Order Lab
                        </Link>
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                        >
                          {deleting === p.id ? "..." : "🗑️ Hapus"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT PASIEN ================= */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">
                  {editing ? "✏️ Edit Identitas Pasien" : "➕ Pendaftaran Pasien & Permintaan Lab"}
                </h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  {editing
                    ? "Perbarui informasi identitas pasien laboratorium"
                    : "Lengkapi data identitas pasien lalu lanjutkan ke pemilihan pemeriksaan lab"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-2xl font-light leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Section 1: Nomor Identitas & Registrasi Lab */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-1.5">
                  🏷️ Identitas Registrasi Laboratorium
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. No Lab (Otomatis) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      No. Lab <span className="text-[10px] text-blue-600 font-normal">(Otomatis Sistem)</span>
                    </label>
                    <input
                      type="text"
                      value={form.noLab}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-600 font-mono font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* 2. No Permintaan Lab (Otomatis) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      No. Permintaan Lab <span className="text-[10px] text-blue-600 font-normal">(Otomatis Sistem)</span>
                    </label>
                    <input
                      type="text"
                      value={form.noPermintaan}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-600 font-mono font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* 3. No RM (Bisa Diedit) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      No. Rekam Medis (RM) *
                    </label>
                    <input
                      type="text"
                      value={form.medicalRecordNo}
                      onChange={(e) => setForm({ ...form, medicalRecordNo: e.target.value })}
                      placeholder="RM-2025-0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Data Pribadi Pasien */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  👤 Data Pribadi Pasien
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap Pasien *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Masukkan nama lengkap pasien..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                      required
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    >
                      <option value="male">Laki-laki (L)</option>
                      <option value="female">Perempuan (P)</option>
                    </select>
                  </div>

                  {/* Golongan Darah */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Golongan Darah
                    </label>
                    <select
                      value={form.bloodType}
                      onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">-- Pilih Golongan Darah --</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>

                  {/* Umur (Terhitung Otomatis & Bisa Diinput Manual) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>Umur Pasien</span>
                      <span className="text-[11px] text-emerald-600 font-normal">
                        (Otomatis & Bisa Diedit)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      placeholder="e.g., 35 Tahun / 5 Bulan"
                      className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/40 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-800"
                    />
                  </div>

                  {/* No. Telepon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Telepon / HP
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  {/* No. BPJS / Asuransi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. BPJS / Asuransi
                    </label>
                    <input
                      type="text"
                      value={form.insuranceNo}
                      onChange={(e) => setForm({ ...form, insuranceNo: e.target.value })}
                      placeholder="000123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  {/* Status Pembayaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Pembayaran *
                    </label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value, customPayment: "" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    >
                      <option value="BPJS">BPJS</option>
                      <option value="UMUM">UMUM (Bayar Sendiri)</option>
                      <option value="Jaminan Lainnya">Jaminan Lainnya</option>
                    </select>
                    {form.paymentStatus === "Jaminan Lainnya" && (
                      <input
                        type="text"
                        value={form.customPayment}
                        onChange={(e) => setForm({ ...form, customPayment: e.target.value })}
                        placeholder="Sebutkan jenis jaminan..."
                        className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required
                      />
                    )}
                  </div>

                  {/* Alamat */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Pasien
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Alamat lengkap pasien..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Informasi Klinis & Permintaan Lab */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  🩺 Informasi Permintaan & Pelayanan Lab
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dokter Pengirim */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dokter Pengirim
                    </label>
                    <select
                      value={form.doctorId}
                      onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">-- Pilih Dokter Pengirim --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.specialization ? `(${d.specialization})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ruang / Unit Pelayanan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ruang / Unit Perawatan
                    </label>
                    <div className="space-y-1">
                      <input
                        type="text"
                        list="rooms-list"
                        value={form.room}
                        onChange={(e) => setForm({ ...form, room: e.target.value })}
                        placeholder="Pilih atau ketik nama ruangan/poli..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                      <datalist id="rooms-list">
                        {COMMON_ROOMS.map((r) => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Diagnosis / Keterangan Klinis */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosis / Keterangan Klinis
                    </label>
                    <input
                      type="text"
                      value={form.diagnosis}
                      onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                      placeholder="e.g., Febris H-3, Suspek Demam Tifoid, Kontrol DM Tipe 2..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Timestamp Info Otomatis */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">⏱️ Tanggal & Jam Permintaan:</span>
                  <span className="text-blue-700 font-medium">
                    {editing
                      ? format(new Date(editing.createdAt), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })
                      : `${format(new Date(), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })} (Otomatis tercatat saat Simpan)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">🏁 Tanggal & Jam Keluar Hasil:</span>
                  <span className="text-gray-500 italic">
                    Otomatis terisi lengkap tanggal & timestamp ketika hasil telah diverifikasi
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Menyimpan...
                    </>
                  ) : editing ? (
                    "💾 Simpan Perubahan"
                  ) : (
                    "💾 Simpan & Lanjut Order Lab →"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
