"use client";

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api-client";

interface ReportData {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  patientName: string;
  patientMrn: string;
  paymentStatus: string;
  doctorName: string | null;
  status: string;
  priority: string;
  totalPrice: string;
  tests: { testName: string; testCode: string }[];
  createdAt: string;
  resultDate: string | null;
}

interface Summary {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
}

interface TopTest {
  testName: string;
  testCode: string;
  count: number;
}

interface Doctor {
  id: number;
  name: string;
}

interface TestCatalog {
  id: number;
  name: string;
  code: string;
}

const statusLabels: Record<string, string> = {
  registered: "Terdaftar",
  sample_collected: "Sampel Diambil",
  in_progress: "Dalam Proses",
  completed: "Selesai",
  validated: "Tervalidasi",
  reported: "Dilaporkan",
};

const statusColors: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  sample_collected: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  validated: "bg-emerald-100 text-emerald-700",
  reported: "bg-purple-100 text-purple-700",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalOrders: 0, totalRevenue: 0, completedOrders: 0, pendingOrders: 0 });
  const [topTests, setTopTests] = useState<TopTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<TestCatalog[]>([]);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<{ doctors?: any[] }>("/api/doctors", 60_000),
      apiGet<{ tests?: any[] }>("/api/tests?limit=200", 60_000),
    ]).then(([d, t]) => {
      setDoctors(d.doctors || []);
      setTests(t.tests || []);
    }).catch(() => {});
  }, []);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (status) params.set("status", status);
    if (doctorId) params.set("doctorId", doctorId);
    if (search) params.set("search", search);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    if (testFilter) params.set("testId", testFilter);

    try {
      const result = await apiGet<{ data?: any[]; summary?: any; topTests?: any[] }>(`/api/reports?${params}`, 10_000);
      setData(result.data || []);
      setSummary(result.summary || { totalOrders: 0, totalRevenue: 0, completedOrders: 0, pendingOrders: 0 });
      setTopTests(result.topTests || []);
    } catch {
      setData([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReport();
  }, []);

  function exportExcel() {
    import("xlsx").then((XLSX) => {
      const wsData = [
        ["No. Lab", "No. Permintaan", "No. RM", "Pasien", "Dokter", "Pemeriksaan", "Status Pembayaran", "Status", "Prioritas", "Total", "Tgl Order", "Tgl Hasil"],
        ...data.map((d) => [
          d.noLab || d.orderNo,
          d.noPermintaan || "-",
          d.patientMrn,
          d.patientName,
          d.doctorName || "-",
          (d.tests || []).map((t) => t.testName).join(", ") || "-",
          d.paymentStatus || "UMUM",
          statusLabels[d.status] || d.status,
          d.priority === "cito" ? "CITO" : d.priority === "urgent" ? "Urgent" : "Normal",
          parseFloat(d.totalPrice).toLocaleString("id-ID"),
          d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-",
          d.resultDate ? new Date(d.resultDate).toLocaleDateString("id-ID") : "-",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 15 }, { wch: 14 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `Laporan_Order_${dateFrom}_sd_${dateTo}.xlsx`);
    });
  }

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = data
      .map(
        (d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.noLab || d.orderNo}</td>
        <td>${d.patientMrn}</td>
        <td>${d.patientName}</td>
        <td>${d.doctorName || "-"}</td>
        <td>${(d.tests || []).map((t) => t.testName).join(", ") || "-"}</td>
        <td>${d.paymentStatus || "UMUM"}</td>
        <td>${statusLabels[d.status] || d.status}</td>
        <td style="text-align:right">Rp ${parseFloat(d.totalPrice).toLocaleString("id-ID")}</td>
        <td>${d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-"}</td>
      </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html><head><title>Laporan Order</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
        h2 { margin-bottom: 5px; }
        .info { color: #666; margin-bottom: 15px; font-size: 10px; }
        .summary { display: flex; gap: 20px; margin-bottom: 15px; }
        .summary-box { background: #f3f4f6; padding: 10px 15px; border-radius: 6px; }
        .summary-box .label { font-size: 10px; color: #666; }
        .summary-box .value { font-size: 18px; font-weight: bold; color: #111; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 10px; }
        td { padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; }
        tr:nth-child(even) { background: #fafafa; }
      </style></head><body>
      <h2>Laporan Order Pemeriksaan</h2>
      <div class="info">Periode: ${dateFrom} s/d ${dateTo} | Dicetak: ${new Date().toLocaleString("id-ID")}</div>
      <div class="summary">
        <div class="summary-box"><div class="label">Total Order</div><div class="value">${summary.totalOrders}</div></div>
        <div class="summary-box"><div class="label">Selesai</div><div class="value">${summary.completedOrders}</div></div>
        <div class="summary-box"><div class="label">Dalam Proses</div><div class="value">${summary.pendingOrders}</div></div>
        <div class="summary-box"><div class="label">Total Pendapatan</div><div class="value">Rp ${summary.totalRevenue.toLocaleString("id-ID")}</div></div>
      </div>
      <table>
        <thead><tr><th>No</th><th>No. Lab</th><th>No. RM</th><th>Pasien</th><th>Dokter</th><th>Pemeriksaan</th><th>Pembayaran</th><th>Status</th><th>Total</th><th>Tanggal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-500 text-sm mt-1">Lihat dan ekspor laporan order pemeriksaan laboratorium</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Order</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Selesai</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.completedOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Dalam Proses</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{summary.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Pendapatan</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">Rp {summary.totalRevenue.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Top Tests Card */}
      {topTests.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Pemeriksaan Paling Banyak
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {topTests.map((t, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-indigo-100 text-center">
                <p className="text-lg font-bold text-indigo-700">{t.count}</p>
                <p className="text-[11px] font-medium text-gray-700 mt-0.5">{t.testName}</p>
                <p className="text-[10px] text-gray-400 font-mono">{t.testCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Status</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status Pembayaran</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Pembayaran</option>
              <option value="BPJS">BPJS</option>
              <option value="UMUM">UMUM</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dokter</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Dokter</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parameter Pemeriksaan</label>
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Pemeriksaan</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="No. Lab / Pasien..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Tampilkan
          </button>
          <button onClick={() => {
            const d = new Date(); d.setDate(1);
            setDateFrom(d.toISOString().split("T")[0]);
            setDateTo(new Date().toISOString().split("T")[0]);
            setStatus(""); setDoctorId(""); setSearch(""); setPaymentFilter(""); setTestFilter("");
          }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Reset
          </button>
          <div className="flex-1" />
          <button onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Excel
          </button>
          <button onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Tidak ada data laporan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <th className="text-left py-3 px-4 w-12">No</th>
                  <th className="text-left py-3 px-4">No. Lab</th>
                  <th className="text-left py-3 px-4">No. RM</th>
                  <th className="text-left py-3 px-4">Pasien</th>
                  <th className="text-left py-3 px-4">Dokter</th>
                  <th className="text-left py-3 px-4">Pemeriksaan</th>
                  <th className="text-center py-3 px-4">Pembayaran</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Tgl Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((d, i) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-600">{d.noLab || d.orderNo}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{d.patientMrn}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{d.patientName}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{d.doctorName || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {(d.tests || []).length > 0 ? (
                          d.tests.slice(0, 3).map((t, ti) => (
                            <span key={ti} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {t.testName}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                        {(d.tests || []).length > 3 && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                            +{d.tests.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${
                        d.paymentStatus === "BPJS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {d.paymentStatus || "UMUM"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${statusColors[d.status] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">Rp {parseFloat(d.totalPrice).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
