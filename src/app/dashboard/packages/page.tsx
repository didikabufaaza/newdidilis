"use client";

import { useEffect, useState, useCallback } from "react";

interface Test {
  id: number;
  code: string;
  name: string;
  categoryName: string | null;
  unit: string | null;
  price: string | null;
}

interface PackageItem {
  id: number;
  testId: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  unit: string | null;
  price: string | null;
}

interface TestPackage {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: string | null;
  active: boolean;
  items: PackageItem[];
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TestPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    price: "",
  });
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [testSearch, setTestSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, testRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/tests?all=true"),
      ]);
      const pkgData = await pkgRes.json();
      const testData = await testRes.json();
      setPackages(pkgData.packages || []);
      setAllTests(testData.tests || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", price: "" });
    setSelectedTestIds([]);
    setTestSearch("");
    setShowModal(true);
  };

  const openEdit = (pkg: TestPackage) => {
    setEditing(pkg);
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price || "",
    });
    setSelectedTestIds(pkg.items.map((i) => i.testId));
    setTestSearch("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      alert("Pilih minimal satu pemeriksaan");
      return;
    }
    setSaving(true);

    try {
      const url = editing ? `/api/packages/${editing.id}` : "/api/packages";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          price: form.price || "0",
          testIds: selectedTestIds,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan");
      }
    } catch {
      alert("Gagal menyimpan");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus paket ini?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/packages/${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
    setDeleting(null);
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const filteredTests = allTests.filter(
    (t) =>
      !selectedTestIds.includes(t.id) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase()))
  );

  const selectedTests = allTests.filter((t) => selectedTestIds.includes(t.id));
  const packageTotal = selectedTests.reduce((s, t) => s + parseFloat(t.price || "0"), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Pemeriksaan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola paket pemeriksaan laboratorium ({packages.length} paket)
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          + Buat Paket Baru
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="font-medium text-gray-900 mb-2">Belum Ada Paket</h3>
          <p className="text-gray-500 text-sm">Klik &quot;Buat Paket Baru&quot; untuk membuat paket pemeriksaan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const isExpanded = expanded.has(pkg.id);
            const pkgTotal = pkg.items.reduce((s, i) => s + parseFloat(i.price || "0"), 0);
            const grouped: Record<string, PackageItem[]> = {};
            pkg.items.forEach((item) => {
              const cat = item.categoryName || "Lainnya";
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(item);
            });

            return (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-600 border border-blue-200 mb-1">{pkg.code}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                      {pkg.description && <p className="text-sm text-gray-500 mt-0.5">{pkg.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="text-gray-600">📋 {pkg.items.length} pemeriksaan</span>
                    <span className="text-gray-400">|</span>
                    <span className="font-semibold text-gray-900">Rp {packageTotal.toLocaleString("id-ID")}</span>
                  </div>

                  {/* Mini test list */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pkg.items.slice(0, 5).map((item) => (
                      <span key={item.id} className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {item.testName}
                      </span>
                    ))}
                    {pkg.items.length > 5 && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                        +{pkg.items.length - 5} lagi
                      </span>
                    )}
                  </div>

                  <button onClick={() => toggleExpand(pkg.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {isExpanded ? "▲ Tutup Detail" : "▼ Lihat Detail"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                      {Object.entries(grouped).map(([cat, catItems]) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{cat}</p>
                          {catItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-gray-700">{item.testName}</span>
                              <span className="text-gray-400">Rp {parseInt(item.price || "0").toLocaleString("id-ID")}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex border-t border-gray-100">
                  <button onClick={() => openEdit(pkg)} className="flex-1 py-2.5 text-center text-blue-600 hover:bg-blue-50 text-sm font-medium transition-colors">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} disabled={deleting === pkg.id} className="flex-1 py-2.5 text-center text-red-500 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50 border-l border-gray-100">
                    {deleting === pkg.id ? "..." : "🗑️ Hapus"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editing ? "Edit Paket" : "Buat Paket Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Paket *</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g., PKT-SC" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., PAKET SC" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g., Paket pemeriksaan stroke/cerebrovascular" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Selected tests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pemeriksaan dalam Paket ({selectedTests.length})
                  {selectedTests.length > 0 && (
                    <span className="ml-2 text-gray-400 font-normal">· Total: Rp {packageTotal.toLocaleString("id-ID")}</span>
                  )}
                </label>
                {selectedTests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTests.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {t.name}
                        <button onClick={() => setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id))} className="text-emerald-400 hover:text-emerald-600 font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 mb-2">⚠️ Belum ada pemeriksaan dipilih</p>
                )}
              </div>

              {/* Search and add tests */}
              <div>
                <input type="text" placeholder="🔍 Cari pemeriksaan untuk ditambahkan..." value={testSearch} onChange={(e) => setTestSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredTests.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">{testSearch ? "Tidak ditemukan" : "Semua pemeriksaan sudah dipilih"}</p>
                ) : (
                  filteredTests.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTestIds([...selectedTestIds, t.id])}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{t.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{t.code} · {t.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rp {parseInt(t.price || "0").toLocaleString("id-ID")}</span>
                        <span className="text-blue-500 font-bold">+</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white">Batal</button>
              <button onClick={handleSubmit} disabled={selectedTestIds.length === 0 || saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Paket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
