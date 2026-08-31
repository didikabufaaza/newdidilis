"use client";

import { useState, useEffect } from "react";

interface ParameterRow {
  id: number;
  orderNo: string;
  noLab: string | null;
  orderDate: string;
  patientName: string;
  patientMrn: string;
  doctorName: string | null;
  testCode: string;
  testName: string;
  categoryName: string | null;
  result: string | null;
  resultNumeric: number | null;
  unit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  referenceText: string | null;
  flag: string | null;
  resultStatus: string;
}

interface TestCategory {
  id: number;
  name: string;
}

interface TestCatalog {
  id: number;
  name: string;
  code: string;
  categoryId: number | null;
}

const resultStatusLabels: Record<string, string> = {
  pending: "Pending",
  entered: "Terinput",
  validated: "Tervalidasi",
  abnormal: "Abnormal",
};

const resultStatusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  entered: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  abnormal: "bg-red-100 text-red-700",
};

function getFlagDisplay(flag: string | null, result: string | null, refMin: number | null, refMax: number | null) {
  if (flag) return { label: flag === "H" ? "Tinggi" : "Rendah", color: flag === "H" ? "text-red-600" : "text-blue-600" };
  if (result && refMin !== null && refMax !== null) {
    const num = parseFloat(result);
    if (!isNaN(num)) {
      if (num > refMax) return { label: "Tinggi", color: "text-red-600" };
      if (num < refMin) return { label: "Rendah", color: "text-blue-600" };
    }
  }
  return null;
}

export default function ParameterReportPage() {
  const [data, setData] = useState<ParameterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [tests, setTests] = useState<TestCatalog[]>([]);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [testId, setTestId] = useState("");
  const [search, setSearch] = useState("");
  const [resultStatus, setResultStatus] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tests/categories").then((r) => r.json()),
      fetch("/api/tests?limit=500").then((r) => r.json()),
    ]).then(([c, t]) => {
      setCategories(c.categories || []);
      setTests(t.tests || []);
    }).catch(() => {});
  }, []);

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (categoryId) params.set("categoryId", categoryId);
    if (testId) params.set("testId", testId);
    if (search) params.set("search", search);
    if (resultStatus) params.set("resultStatus", resultStatus);

    try {
      const token = localStorage.getItem("lis_token");
      const viewAsUserId = localStorage.getItem("viewAsUserId");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

      const res = await fetch(`/api/reports/parameters?${params}`, { headers });
      const result = await res.json();
      setData(result.data || []);
    } catch {
      setData([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function exportExcel() {
    import("xlsx").then((XLSX) => {
      const wsData = [
        ["No", "No. Lab", "No. RM", "Pasien", "Dokter", "Tanggal", "Kategori", "Parameter", "Kode", "Hasil", "Satuan", "Referensi Min", "Referensi Max", "Referensi Teks", "Flag", "Status"],
        ...data.map((d, i) => [
          i + 1,
          d.noLab || d.orderNo,
          d.patientMrn,
          d.patientName,
          d.doctorName || "-",
          d.orderDate ? new Date(d.orderDate).toLocaleDateString("id-ID") : "-",
          d.categoryName || "-",
          d.testName,
          d.testCode,
          d.result || "-",
          d.unit || "-",
          d.referenceMin ?? "-",
          d.referenceMax ?? "-",
          d.referenceText || "-",
          d.flag === "H" ? "Tinggi" : d.flag === "L" ? "Rendah" : "-",
          resultStatusLabels[d.resultStatus] || d.resultStatus,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 5 }, { wch: 16 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Parameter");
      XLSX.writeFile(wb, `Laporan_Parameter_${dateFrom}_sd_${dateTo}.xlsx`);
    });
  }

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = data
      .map(
        (d, i) => {
          const flagInfo = getFlagDisplay(d.flag, d.result, d.referenceMin, d.referenceMax);
          return `
      <tr>
        <td>${i + 1}</td>
        <td>${d.noLab || d.orderNo}</td>
        <td>${d.patientMrn}</td>
        <td>${d.patientName}</td>
        <td>${d.categoryName || "-"}</td>
        <td>${d.testName}</td>
        <td style="font-weight:bold">${d.result || "-"}</td>
        <td>${d.unit || "-"}</td>
        <td>${d.referenceMin ?? "-"} - ${d.referenceMax ?? "-"}</td>
        <td style="color:${flagInfo?.color || '#111'};font-weight:bold">${flagInfo?.label || "-"}</td>
        <td>${resultStatusLabels[d.resultStatus] || d.resultStatus}</td>
      </tr>`;
        }
      )
      .join("");

    printWindow.document.write(`
      <html><head><title>Laporan Parameter</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; padding: 15px; }
        h2 { margin-bottom: 3px; font-size: 14px; }
        .info { color: #666; margin-bottom: 10px; font-size: 9px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; text-align: left; padding: 6px; border: 1px solid #ddd; font-size: 9px; }
        td { padding: 5px 6px; border: 1px solid #ddd; font-size: 9px; }
        tr:nth-child(even) { background: #fafafa; }
      </style></head><body>
      <h2>Laporan Hasil Pemeriksaan per Parameter</h2>
      <div class="info">Periode: ${dateFrom} s/d ${dateTo} | Total: ${data.length} parameter | Dicetak: ${new Date().toLocaleString("id-ID")}</div>
      <table>
        <thead><tr><th>No</th><th>No. Lab</th><th>No. RM</th><th>Pasien</th><th>Kategori</th><th>Parameter</th><th>Hasil</th><th>Satuan</th><th>Referensi</th><th>Flag</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  // Summary stats
  const totalParams = data.length;
  const abnormalCount = data.filter((d) => d.resultStatus === "abnormal" || d.flag).length;
  const pendingCount = data.filter((d) => d.resultStatus === "pending").length;
  const validatedCount = data.filter((d) => d.resultStatus === "validated").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Parameter</h1>
        <p className="text-gray-500 text-sm mt-1">Detail hasil pemeriksaan per parameter/kategori</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Parameter</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalParams}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Abnormal</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{abnormalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Tervalidasi</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{validatedCount}</p>
        </div>
      </div>

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
            <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setTestId(""); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parameter</label>
            <select value={testId} onChange={(e) => setTestId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Parameter</option>
              {tests
                .filter((t) => !categoryId || String(t.categoryId) === categoryId)
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status Hasil</label>
            <select value={resultStatus} onChange={(e) => setResultStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="entered">Terinput</option>
              <option value="validated">Tervalidasi</option>
              <option value="abnormal">Abnormal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="No. Lab / Pasien / Parameter..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Tampilkan
            </button>
            <button onClick={() => {
              const d = new Date(); d.setDate(1);
              setDateFrom(d.toISOString().split("T")[0]);
              setDateTo(new Date().toISOString().split("T")[0]);
              setCategoryId(""); setTestId(""); setSearch(""); setResultStatus("");
            }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
              Reset
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
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
          <div className="p-12 text-center text-gray-400">Tidak ada data laporan parameter</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <th className="text-left py-3 px-3 w-10">No</th>
                  <th className="text-left py-3 px-3">No. Lab</th>
                  <th className="text-left py-3 px-3">Pasien</th>
                  <th className="text-left py-3 px-3">Dokter</th>
                  <th className="text-left py-3 px-3">Kategori</th>
                  <th className="text-left py-3 px-3">Parameter</th>
                  <th className="text-center py-3 px-3">Hasil</th>
                  <th className="text-center py-3 px-3">Satuan</th>
                  <th className="text-center py-3 px-3">Referensi</th>
                  <th className="text-center py-3 px-3">Flag</th>
                  <th className="text-center py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((d, i) => {
                  const flagInfo = getFlagDisplay(d.flag, d.result, d.referenceMin, d.referenceMax);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-blue-600">{d.noLab || d.orderNo}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-gray-900 text-xs">{d.patientName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{d.patientMrn}</div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-xs">{d.doctorName || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {d.categoryName || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-gray-900 text-xs">{d.testName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{d.testCode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold text-sm ${flagInfo?.color || "text-gray-900"}`}>
                          {d.result || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-gray-600">{d.unit || "-"}</td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-gray-500">
                        {d.referenceMin ?? "-"} - {d.referenceMax ?? "-"}
                        {d.referenceText && <div className="text-[9px] text-gray-400">{d.referenceText}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {flagInfo ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.flag === "H" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {d.flag === "H" ? "H" : "L"}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${resultStatusColors[d.resultStatus] || "bg-gray-100 text-gray-600"}`}>
                          {resultStatusLabels[d.resultStatus] || d.resultStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
