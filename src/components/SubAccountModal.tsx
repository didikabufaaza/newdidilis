"use client";

import { useState, useEffect, FormEvent } from "react";

interface SubAccount {
  id: number;
  parentId: number;
  username: string;
  name: string;
  email: string;
  password: string;
  notes: string;
  createdAt: Date;
}

interface SubAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: number;
  parentName: string;
}

export default function SubAccountModal({ isOpen, onClose, parentId, parentName }: SubAccountModalProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", name: "", notes: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && parentId) {
      fetchSubAccounts();
    }
  }, [isOpen, parentId]);

  async function fetchSubAccounts() {
    setLoading(true);
    try {
      const token = localStorage.getItem("lis_token");
      const res = await fetch(`/api/users/${parentId}/sub-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubAccounts(data.subAccounts || []);
    } catch {
      setSubAccounts([]);
    }
    setLoading(false);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password || !formData.name) {
      setError("Username, password, dan nama wajib diisi");
      return;
    }

    try {
      const token = localStorage.getItem("lis_token");
      const res = await fetch(`/api/users/${parentId}/sub-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal membuat sub-account");
        return;
      }

      setFormData({ username: "", password: "", name: "", notes: "" });
      setShowForm(false);
      fetchSubAccounts();
    } catch {
      setError("Terjadi kesalahan");
    }
  }

  async function handleDelete(subAccountId: number) {
    if (!confirm("Yakin ingin menghapus sub-account ini?")) return;

    try {
      const token = localStorage.getItem("lis_token");
      await fetch(`/api/users/${parentId}/sub-accounts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subAccountId }),
      });
      fetchSubAccounts();
    } catch {
      alert("Gagal menghapus sub-account");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Kelola Password Tambahan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <strong>User: {parentName}</strong> — Semua password di bawah sah untuk login.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru *</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required minLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Simpan
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Password
            </button>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : subAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Belum ada password tambahan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Username</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Password</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Nama</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Catatan</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Tanggal</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subAccounts.map((sa) => (
                    <tr key={sa.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-medium text-gray-900">{sa.username}</td>
                      <td className="py-3 px-2 text-gray-600 font-mono text-xs">{sa.password}</td>
                      <td className="py-3 px-2 text-gray-600">{sa.name}</td>
                      <td className="py-3 px-2 text-gray-500">{sa.notes || "-"}</td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {new Date(sa.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => handleDelete(sa.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
