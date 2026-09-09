"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, clearApiCache } from "@/lib/api-client";

interface Test {
  id: number;
  code: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  sampleType: string;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  price: string | null;
  turnaroundHours: number | null;
  active: boolean;
}

interface Category {
  id: number;
  name: string;
}

const sampleLabels: Record<string, string> = {
  blood: "Darah",
  urine: "Urine",
  serum: "Serum",
  plasma: "Plasma",
  csf: "CSF",
  stool: "Feses",
  swab: "Swab",
  other: "Lainnya",
};

const sampleTypes = ["blood", "serum", "plasma", "urine", "csf", "stool", "swab", "other"];

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    categoryId: "",
    sampleType: "blood",
    unit: "",
    referenceMin: "",
    referenceMax: "",
    referenceText: "",
    price: "",
    turnaroundMinutes: "",
  });

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const [testsData, catsData] = await Promise.all([
        apiGet<{ tests?: Test[] }>("/api/tests?all=true", 60_000),
        apiGet<{ categories?: Category[] }>("/api/tests/categories", 60_000),
      ]);
      setTests(testsData.tests || []);
      setCategories(catsData.categories || []);
    } catch {
      setTests([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const filtered = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      (t.categoryName || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped: Record<string, Test[]> = {};
  filtered.forEach((t) => {
    const c = t.categoryName || "Lainnya";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(t);
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      categoryId: "",
      sampleType: "blood",
      unit: "",
      referenceMin: "",
      referenceMax: "",
      referenceText: "",
      price: "",
      turnaroundMinutes: "",
    });
    setShowModal(true);
  };

  const openEdit = (t: Test) => {
    setEditing(t);
    const tatMinutes = t.turnaroundHours ? (t.turnaroundHours * 60).toString() : "";
    setForm({
      code: t.code,
      name: t.name,
      categoryId: t.categoryId?.toString() || "",
      sampleType: t.sampleType,
      unit: t.unit || "",
      referenceMin: t.referenceMin || "",
      referenceMax: t.referenceMax || "",
      referenceText: t.referenceText || "",
      price: t.price || "",
      turnaroundMinutes: tatMinutes,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editing ? `/api/tests/${editing.id}` : "/api/tests";
      const method = editing ? "PUT" : "POST";

      const payload = {
        code: form.code,
        name: form.name,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        sampleType: form.sampleType,
        unit: form.unit || null,
        referenceMin: form.referenceMin || null,
        referenceMax: form.referenceMax || null,
        referenceText: form.referenceText || null,
        price: form.price || "0",
        turnaroundMinutes: form.turnaroundMinutes ? parseInt(form.turnaroundMinutes) : null,
      };

      const token = localStorage.getItem("lis_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearApiCache();
        setShowModal(false);
        fetchTests();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan");
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus tes ini?")) return;

    setDeleting(id);
    try {
      const token = localStorage.getItem("lis_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/tests/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        clearApiCache();
        fetchTests();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus");
      }
    } catch {
      alert("Gagal menghapus");
    }
    setDeleting(null);
  };

  const formatTat = (hours: number | null) => {
    if (!hours) return "-";
    const minutes = hours * 60;
    if (minutes < 60) return `${minutes} mnt`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} j ${m} mnt` : `${h} jam`;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Pemeriksaan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Daftar pemeriksaan laboratorium yang tersedia ({tests.length} tes)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Tambah Tes
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Cari pemeriksaan (nama atau kode)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🧪</p>
          <h3 className="font-medium text-gray-900 mb-1">Tidak ditemukan</h3>
          <p className="text-gray-500 text-sm">Coba ubah kata kunci pencarian atau tambah tes baru</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catTests]) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">🧪 {category}</h3>
                <span className="text-xs text-gray-500">{catTests.length} tes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Kode</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nama</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Sampel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Satuan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nilai Rujukan</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Harga</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">TAT</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catTests.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-blue-600 font-medium">{t.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {sampleLabels[t.sampleType] || t.sampleType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{t.unit || "-"}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {t.referenceText ||
                            (t.referenceMin && t.referenceMax
                              ? `${t.referenceMin} - ${t.referenceMax}`
                              : "-")}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          Rp {parseInt(t.price || "0").toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500 text-xs">
                          {formatTat(t.turnaroundHours)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEdit(t)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting === t.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                          >
                            {deleting === t.id ? "..." : "🗑️ Hapus"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Pemeriksaan" : "Tambah Pemeriksaan Baru"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Tes</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Otomatis jika kosong"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-blue-500 mt-1">Kosongkan untuk kode otomatis</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemeriksaan *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Hemoglobin (Hb)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Sampel *</label>
                  <select
                    value={form.sampleType}
                    onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    {sampleTypes.map((st) => (
                      <option key={st} value={st}>
                        {sampleLabels[st]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g., g/dL, mg/dL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Rujukan Min</label>
                  <input
                    type="text"
                    value={form.referenceMin}
                    onChange={(e) => setForm({ ...form, referenceMin: e.target.value })}
                    placeholder="e.g., 12.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Rujukan Max</label>
                  <input
                    type="text"
                    value={form.referenceMax}
                    onChange={(e) => setForm({ ...form, referenceMax: e.target.value })}
                    placeholder="e.g., 16.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teks Rujukan (opsional)</label>
                <input
                  type="text"
                  value={form.referenceText}
                  onChange={(e) => setForm({ ...form, referenceText: e.target.value })}
                  placeholder="e.g., Negatif, Non-Reaktif"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Gunakan jika nilai rujukan bukan angka</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g., 50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TAT (menit)</label>
                  <input
                    type="number"
                    value={form.turnaroundMinutes}
                    onChange={(e) => setForm({ ...form, turnaroundMinutes: e.target.value })}
                    placeholder="e.g., 120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Turnaround Time dalam menit (120 = 2 jam)</p>
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
                  {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Tes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
