"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Order {
  id: number;
  orderNo: string;
  status: string;
  priority: string;
  totalPrice: string | null;
  createdAt: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  doctorName: string | null;
  doctorSpecialization: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  registered: { label: "Terdaftar", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  sample_collected: { label: "Sampel Diambil", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  in_progress: { label: "Proses", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  completed: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  validated: { label: "Tervalidasi", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  reported: { label: "Dilaporkan", color: "text-gray-700", bg: "bg-gray-100 border-gray-200" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleDelete = async (oid: number) => {
    if (!confirm("Yakin ingin menghapus order ini?")) return;
    setDeleting(oid);
    try {
      const res = await fetch(`/api/orders/${oid}`, { method: "DELETE" });
      if (res.ok) {
        fetchOrders();
      } else {
        alert("Gagal menghapus order");
      }
    } catch {
      alert("Gagal menghapus order");
    }
    setDeleting(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Pemeriksaan</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola order laboratorium ({total} total)</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Order Baru
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Cari no. order, nama pasien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">Semua Status</option>
          {Object.entries(statusConfig).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="font-medium text-gray-900 mb-1">Belum ada order</h3>
            <p className="text-gray-500 text-sm mb-4">Klik &quot;Order Baru&quot; untuk membuat permintaan pemeriksaan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">No. Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Pasien</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Dokter</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Prioritas</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Biaya</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Waktu</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const sc = statusConfig[o.status] || statusConfig.registered;
                    return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <Link
                            href={`/dashboard/orders/${o.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700 font-mono text-xs"
                          >
                            {o.orderNo}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{o.patientName}</p>
                          <p className="text-xs text-gray-500">{o.patientMrn}</p>
                        </td>
                        <td className="py-3 px-4">
                          {o.doctorName ? (
                            <>
                              <p className="text-gray-900">{o.doctorName}</p>
                              <p className="text-xs text-gray-500">{o.doctorSpecialization}</p>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-semibold ${
                              o.priority === "cito" ? "text-red-600" : o.priority === "urgent" ? "text-amber-600" : "text-gray-600"
                            }`}
                          >
                            {o.priority === "cito" ? "CITO" : o.priority === "urgent" ? "Urgent" : "Normal"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 text-xs">
                          Rp {parseInt(o.totalPrice || "0").toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true, locale: id })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/dashboard/orders/${o.id}`}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                          >
                            Detail
                          </Link>
                          <button
                            onClick={() => handleDelete(o.id)}
                            disabled={deleting === o.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                          >
                            {deleting === o.id ? "..." : "Hapus"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
