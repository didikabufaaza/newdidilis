"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardData {
  stats: {
    totalPatients: number;
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    pendingResults: number;
  };
  statusCounts: Record<string, number>;
  recentOrders: Array<{
    id: number;
    orderNo: string;
    status: string;
    priority: string;
    createdAt: string;
    patientName: string;
    patientMrn: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  registered: { label: "Terdaftar", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", bar: "bg-blue-500" },
  sample_collected: { label: "Sampel Diambil", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", bar: "bg-indigo-500" },
  in_progress: { label: "Proses", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", bar: "bg-amber-500" },
  completed: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" },
  validated: { label: "Tervalidasi", color: "text-green-700", bg: "bg-green-50 border-green-200", bar: "bg-green-500" },
  reported: { label: "Dilaporkan", color: "text-gray-700", bg: "bg-gray-100 border-gray-200", bar: "bg-gray-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "text-gray-600" },
  urgent: { label: "Urgent", color: "text-amber-600" },
  cito: { label: "CITO", color: "text-red-600" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(setData)
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="skeleton h-8 w-48 rounded mb-2" />
          <div className="skeleton h-4 w-72 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Ringkasan aktivitas laboratorium hari ini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pasien</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Pasien terdaftar</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Order Hari Ini</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayOrders}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Total: {stats.totalOrders} order</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Proses</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">{stats.pendingResults} hasil pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dalam Proses</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgressOrders}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 0 1-2.133 1.59H8.603a2.25 2.25 0 0 1-2.133-1.59L5 14.5m14 0H5" /></svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">{stats.completedOrders} selesai</p>
        </div>
      </div>

      {/* Status + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Order</h3>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = data.statusCounts[key] || 0;
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{config.label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${config.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Terbaru</h3>
            <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">No. Order</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Pasien</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Prioritas</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.registered;
                  const pc = priorityConfig[order.priority] || priorityConfig.normal;
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-blue-600 hover:text-blue-700 font-mono text-xs">
                          {order.orderNo}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">{order.patientName}</p>
                        <p className="text-xs text-gray-500">{order.patientMrn}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-semibold ${pc.color}`}>{pc.label}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: id })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
