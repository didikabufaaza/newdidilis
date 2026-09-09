"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, clearApiCache } from "@/lib/api-client";

interface Doctor {
  id: number;
  name: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  hospital: string | null;
  licenseNo: string | null;
  active: boolean;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    email: "",
    hospital: "",
    licenseNo: "",
  });

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const data = await apiGet<{ doctors?: Doctor[] }>(`/api/doctors?${params}`, 10_000);
      setDoctors(data.doctors || []);
    } catch {
      setDoctors([]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      specialization: "",
      phone: "",
      email: "",
      hospital: "",
      licenseNo: "",
    });
    setShowModal(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.name,
      specialization: d.specialization || "",
      phone: d.phone || "",
      email: d.email || "",
      hospital: d.hospital || "",
      licenseNo: d.licenseNo || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editing ? `/api/doctors/${editing.id}` : "/api/doctors";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        clearApiCache();
        setShowModal(false);
        fetchDoctors();
      }
    } catch (err) {
      console.error(err);
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data dokter ini?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      if (res.ok) {
        clearApiCache();
        fetchDoctors();
      } else {
        alert("Gagal menghapus dokter");
      }
    } catch {
      alert("Gagal menghapus dokter");
    }
    setDeleting(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokter Pengirim</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data dokter pengirim ({doctors.length} dokter)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          + Tambah Dokter
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Cari nama dokter atau spesialisasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🩺</p>
          <h3 className="font-medium text-gray-900 mb-1">Belum ada data dokter</h3>
          <p className="text-gray-500 text-sm">Klik &quot;Tambah Dokter&quot; untuk memulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.name}</h3>
                    {d.specialization && <p className="text-sm text-blue-600">{d.specialization}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                {d.hospital && <p className="text-gray-600">🏥 {d.hospital}</p>}
                {d.phone && <p className="text-gray-600">📞 {d.phone}</p>}
                {d.email && <p className="text-gray-600 truncate">✉️ {d.email}</p>}
                {d.licenseNo && <p className="text-xs text-gray-400">SIP: {d.licenseNo}</p>}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(d)}
                  className="flex-1 text-center py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting === d.id}
                  className="flex-1 text-center py-1.5 text-red-500 hover:bg-red-50 rounded text-sm font-medium disabled:opacity-50"
                >
                  {deleting === d.id ? "..." : "🗑️ Hapus"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editing ? "Edit Dokter" : "Tambah Dokter Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  placeholder="Dr. ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Penyakit Dalam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. SIP</label>
                  <input
                    type="text"
                    value={form.licenseNo}
                    onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rumah Sakit / Klinik</label>
                <input
                  type="text"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Dokter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
