"use client";

import { useState, useEffect, FormEvent } from "react";

interface UserData {
  id?: number;
  username: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  masaAktif: string | null;
  imgAccess: boolean;
  tenantId: number | null;
  active: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserData) => void;
  user?: UserData | null;
}

export default function UserFormModal({ isOpen, onClose, onSave, user }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserData>({
    username: "",
    name: "",
    email: "",
    role: "admin",
    phone: "",
    masaAktif: null,
    imgAccess: false,
    tenantId: null,
    active: true,
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        masaAktif: user.masaAktif || "",
        imgAccess: user.imgAccess,
        tenantId: user.tenantId,
        active: user.active,
      });
    } else {
      setFormData({
        username: "",
        name: "",
        email: "",
        role: "admin",
        phone: "",
        masaAktif: null,
        imgAccess: false,
        tenantId: null,
        active: true,
      });
    }
    setPassword("");
    setError("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.username) {
      setError("Nama, email, dan username wajib diisi");
      return;
    }

    if (!isEdit && !password) {
      setError("Password wajib diisi");
      return;
    }

    if (!isEdit && password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    try {
      const url = isEdit ? `/api/users/${formData.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        phone: formData.phone || null,
        masaAktif: formData.masaAktif || null,
        imgAccess: formData.imgAccess,
        tenantId: formData.tenantId,
        active: formData.active,
      };

      if (!isEdit) {
        body.password = password;
      } else if (password) {
        body.password = password;
      }

      const token = localStorage.getItem("lis_token");
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan user");
        return;
      }

      onSave(data.user || { ...formData });
      onClose();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit User" : "Tambah User Baru"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {isEdit ? "(kosongkan jika tidak diubah)" : "*"}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required={!isEdit} minLength={6} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="doctor">Dokter</option>
                <option value="analyst">Analis</option>
                <option value="receptionist">Resepsionis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masa Aktif</label>
              <input type="date" value={formData.masaAktif || ""} onChange={(e) => setFormData({ ...formData, masaAktif: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.imgAccess} onChange={(e) => setFormData({ ...formData, imgAccess: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">Akses Analisa AI</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              {isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
