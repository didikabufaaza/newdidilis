"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import AnalysisResultPanel from "@/components/AnalysisResultPanel";
import { getCanAnalyzeClient } from "@/lib/client-analysis";
import Link from "next/link";

interface Order {
  id: number;
  orderNo: string;
  noLab: string | null;
  noPermintaan: string | null;
  status: string;
  patientName: string;
  patientMrn: string;
}

interface OrderItem {
  id: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  result: string | null;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  flag: string | null;
}

interface OrderHeader {
  orderNo: string;
  noLab: string | null;
  noPermintaan: string | null;
  patientName: string;
  patientMrn: string;
  patientAge: string | null;
  patientGender: string | null;
  room: string | null;
  doctorName: string | null;
  diagnosis: string | null;
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    preselectedOrderId ? parseInt(preselectedOrderId) : null
  );
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderHeader, setOrderHeader] = useState<OrderHeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState("");
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanAnalyze(getCanAnalyzeClient());
    const token = localStorage.getItem("lis_token");
    const viewAsUserId = localStorage.getItem("viewAsUserId");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

    fetch("/api/orders?limit=100", { headers })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;
    setLoadingItems(true);
    setAnalysis(null);
    setAnalysisError("");
    const token = localStorage.getItem("lis_token");
    const viewAsUserId = localStorage.getItem("viewAsUserId");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

    fetch(`/api/orders/${selectedOrderId}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setOrderHeader({
          orderNo: data.order.orderNo,
          noLab: data.order.noLab,
          noPermintaan: data.order.noPermintaan,
          patientName: data.order.patientName,
          patientMrn: data.order.patientMrn,
          patientAge: data.order.age || data.order.patientAge,
          patientGender: data.order.patientGender,
          room: data.order.room || data.order.patientRoom,
          doctorName: data.order.doctorName,
          diagnosis: data.order.diagnosis,
        });
        setLoadingItems(false);
      })
      .catch(() => setLoadingItems(false));
  }, [selectedOrderId]);

  const handleAnalyze = async () => {
    if (!selectedOrderId) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisError("");
    try {
      const token = localStorage.getItem("lis_token");
      const viewAsUserId = localStorage.getItem("viewAsUserId");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ orderId: selectedOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalysisError(data.error || "Gagal menganalisis hasil");
        return;
      }
      setAnalysis(data.analysis);
    } catch {
      setAnalysisError("Terjadi kesalahan saat menganalisis hasil");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScreenshot = async () => {
    if (!captureRef.current) return;
    setCapturing(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `analisa-ai-${orderHeader?.noLab || orderHeader?.orderNo || selectedOrderId}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setAnalysisError("Gagal mengambil screenshot");
    } finally {
      setCapturing(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      (o.noLab && o.noLab.toLowerCase().includes(search.toLowerCase())) ||
      (o.noPermintaan && o.noPermintaan.toLowerCase().includes(search.toLowerCase())) ||
      o.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const resultItems = items.filter((i) => i.result);

  if (!canAnalyze) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">🔒</p>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">Akses Terbatas</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Fitur Analisa AI hanya tersedia untuk Superadmin, Admin, atau akun yang telah mendapatkan
            akses (ceklist) dari Superadmin. Hubungi administrator untuk mengaktifkan akses ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisa Hasil Laboratorium (AI)</h1>
          <p className="text-gray-500 text-sm mt-1">
            Analisis dan interpretasi lengkap hasil pemeriksaan sesuai standar dokter spesialis patologi klinik
          </p>
        </div>
        <Link
          href="/dashboard/results"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Input Hasil
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Order List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Cari order / nama pasien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">Tidak ada order ditemukan</div>
              ) : (
                filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors ${
                      selectedOrderId === o.id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-indigo-600">
                      {o.noLab || o.orderNo}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{o.patientName}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {o.patientMrn} {o.noPermintaan ? `· ${o.noPermintaan}` : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3">
          {!selectedOrderId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-5xl mb-4">🤖</p>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">Pilih Order Pemeriksaan</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Pilih order dari daftar di sebelah kiri untuk menganalisa dan menginterpretasi hasil
                pemeriksaan laboratorium dengan AI.
              </p>
            </div>
          ) : loadingItems ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data pemeriksaan...</p>
            </div>
          ) : (
            <div ref={captureRef} className="space-y-6">
              {/* Patient + Results summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">{orderHeader?.patientName}</span>
                        <span className="font-mono text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                          {orderHeader?.patientMrn}
                        </span>
                        <span className="font-mono text-xs bg-white text-gray-700 border px-2 py-0.5 rounded">
                          No. Lab: {orderHeader?.noLab || orderHeader?.orderNo}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1.5 flex gap-4 flex-wrap">
                        {orderHeader?.patientAge && <span>Umur: <strong>{orderHeader.patientAge}</strong></span>}
                        {orderHeader?.patientGender && (
                          <span>L/P: <strong>{orderHeader.patientGender === "male" ? "L" : "P"}</strong></span>
                        )}
                        {orderHeader?.room && <span>Ruang: <strong>{orderHeader.room}</strong></span>}
                        {orderHeader?.doctorName && <span>Dokter: <strong>{orderHeader.doctorName}</strong></span>}
                      </div>
                      {orderHeader?.diagnosis && (
                        <p className="text-xs text-gray-500 mt-1 italic">Diagnosis: {orderHeader.diagnosis}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleScreenshot}
                        disabled={capturing || resultItems.length === 0}
                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {capturing ? (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                            Memproses...
                          </>
                        ) : (
                          <>📸 Screenshot</>
                        )}
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing || resultItems.length === 0}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {analyzing ? (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Menganalisa...
                          </>
                        ) : (
                          <>🤖 Analisa Hasil Sekarang</>
                        )}
                      </button>
                    </div>
                  </div>
                  {resultItems.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Order ini belum memiliki hasil yang diinput. Silakan input hasil terlebih dahulu.
                    </p>
                  )}
                </div>

                {/* Result items table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                      <tr>
                        <th className="text-left py-3 px-4">Parameter</th>
                        <th className="text-center py-3 px-4">Hasil</th>
                        <th className="text-center py-3 px-4">Satuan</th>
                        <th className="text-center py-3 px-4">Nilai Rujukan</th>
                        <th className="text-center py-3 px-4">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {resultItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-4 font-medium text-gray-900">{item.testName}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-gray-900">
                            {item.result}
                          </td>
                          <td className="py-2.5 px-4 text-center text-gray-500 text-xs">{item.unit || "-"}</td>
                          <td className="py-2.5 px-4 text-center text-gray-500 text-xs font-mono">
                            {item.referenceText ||
                              (item.referenceMin && item.referenceMax
                                ? `${item.referenceMin} - ${item.referenceMax}`
                                : "-")}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {item.flag === "H" && (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                ↑ High
                              </span>
                            )}
                            {item.flag === "L" && (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                ↓ Low
                              </span>
                            )}
                            {!item.flag && <span className="text-emerald-600 font-bold text-xs">✓ Normal</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analysis results */}
              {analyzing && (
                <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-10 text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="font-semibold text-gray-800">Menganalisa hasil pemeriksaan...</p>
                  <p className="text-gray-500 text-sm mt-1">
                    AI sedang menginterpretasi hasil sesuai standar dokter spesialis patologi klinik
                  </p>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {analysisError}
                </div>
              )}

              {analysis && <AnalysisResultPanel analysis={analysis} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 lg:p-8">
          <div className="skeleton h-96 rounded-xl" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
