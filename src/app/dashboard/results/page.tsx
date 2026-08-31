"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Order {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  status: string;
  priority: string;
  patientName: string;
  patientMrn: string;
}

interface OrderItem {
  id: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  result: string | null;
  resultStatus: string;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  flag: string | null;
  notes: string | null;
}

interface OrderHeaderInfo {
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

function ResultsContent() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    preselectedOrderId ? parseInt(preselectedOrderId) : null
  );
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderHeader, setOrderHeader] = useState<OrderHeaderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Record<number, { result: string; flag: string; notes: string }>>({});
  const [previousResults, setPreviousResults] = useState<{ orderNo: string; orderDate: Date; items: { testCode: string; testName: string; result: string; unit: string | null; referenceMin: string | null; referenceMax: string | null; flag: string | null }[] }[]>([]);
  const [showDelta, setShowDelta] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  useEffect(() => {
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
        const rMap: Record<number, { result: string; flag: string; notes: string }> = {};
        (data.items || []).forEach((i: OrderItem) => {
          rMap[i.id] = {
            result: i.result || "",
            flag: i.flag || "",
            notes: i.notes || "",
          };
        });
        setResults(rMap);
        setLoadingItems(false);

        if (data.order?.patientMrn) {
          setLoadingPrevious(true);
          fetch(`/api/results/previous?mrn=${data.order.patientMrn}&excludeOrderId=${selectedOrderId}`, { headers })
            .then((r) => r.json())
            .then((prev) => {
              setPreviousResults(prev.previousResults || []);
              setLoadingPrevious(false);
            })
            .catch(() => setLoadingPrevious(false));
        }
      })
      .catch(() => setLoadingItems(false));
  }, [selectedOrderId]);

  const autoFlag = (v: string, min: string | null, max: string | null) => {
    const n = parseFloat(v);
    if (isNaN(n)) return "";
    if (min && n < parseFloat(min)) return "L";
    if (max && n > parseFloat(max)) return "H";
    return "";
  };

  const updateResult = (itemId: number, field: string, value: string, item: OrderItem) => {
    setResults((prev) => {
      const updated = { ...prev[itemId], [field]: value };
      if (field === "result") updated.flag = autoFlag(value, item.referenceMin, item.referenceMax);
      return { ...prev, [itemId]: updated };
    });
    setSaved(false);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedOrderId) return;
    if (!confirm("Yakin ingin menghapus item pemeriksaan ini?")) return;

    try {
      const token = localStorage.getItem("lis_token");
      const res = await fetch(`/api/orders/${selectedOrderId}/items`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setResults((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus item");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus item");
    }
  };

  const handleSave = async (andPrint: boolean = false) => {
    if (!selectedOrderId) return;
    setSaving(true);

    const data = Object.entries(results)
      .filter(([, v]) => v.result)
      .map(([id, v]) => ({
        itemId: parseInt(id),
        result: v.result,
        resultNumeric: isNaN(parseFloat(v.result)) ? undefined : v.result,
        flag: v.flag || undefined,
        notes: v.notes || undefined,
      }));

    const token = localStorage.getItem("lis_token");
    const viewAsUserId = localStorage.getItem("viewAsUserId");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (viewAsUserId) headers["X-View-As"] = viewAsUserId;

    await fetch(`/api/orders/${selectedOrderId}/results`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ results: data }),
    });

    await fetch(`/api/orders/${selectedOrderId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: "completed" }),
    });

    setSaving(false);

    if (andPrint) {
      window.location.href = `/dashboard/print?orderId=${selectedOrderId}`;
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      (o.noLab && o.noLab.toLowerCase().includes(search.toLowerCase())) ||
      (o.noPermintaan && o.noPermintaan.toLowerCase().includes(search.toLowerCase())) ||
      o.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Input Hasil Pemeriksaan Lab</h1>
        <p className="text-gray-500 text-sm mt-1">
          Masukkan nilai hasil pemeriksaan laboratorium pasien dan simpan atau cetak langsung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Order List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Cari order / nama pasien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>
            <div className="max-h-[65vh] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">Tidak ada order yang siap diinput</div>
              ) : (
                filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                      selectedOrderId === o.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {o.noLab || o.orderNo}
                      </span>
                      {o.priority !== "normal" && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            o.priority === "cito" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.priority === "cito" ? "CITO" : "URG"}
                        </span>
                      )}
                    </div>
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

        {/* Right Column: Results Input Form */}
        <div className="lg:col-span-3">
          {!selectedOrderId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-5xl mb-4">📝</p>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">Pilih Order Pemeriksaan</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Pilih salah satu order dari daftar di sebelah kiri untuk mulai memasukkan nilai hasil pemeriksaan laboratorium.
              </p>
            </div>
          ) : loadingItems ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data pemeriksaan...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Order Patient Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-base">{orderHeader?.patientName}</span>
                      <span className="font-mono text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
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
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Diagnosis: {orderHeader.diagnosis}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {saved && <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">✓ Tersimpan</span>}
                    <button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {saving ? "Menyimpan..." : "💾 Simpan"}
                    </button>
                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {saving ? "Memproses..." : "🖨️ Simpan & Cetak Hasil →"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Delta Check - Previous Results */}
              {previousResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => setShowDelta(!showDelta)}
                    className="w-full flex items-center justify-between px-6 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-semibold text-sm">📊 Hasil Pemeriksaan Sebelumnya (Delta Check)</span>
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {previousResults.length} pemeriksaan
                      </span>
                    </div>
                    <span className="text-amber-600 text-lg">{showDelta ? "▲" : "▼"}</span>
                  </button>
                  {showDelta && (
                    <div className="px-6 py-4 bg-amber-50/50 max-h-[40vh] overflow-y-auto">
                      {loadingPrevious ? (
                        <p className="text-amber-600 text-sm">Memuat hasil sebelumnya...</p>
                      ) : (
                        <div className="space-y-4">
                          {previousResults.map((prevOrder, pIdx) => (
                            <div key={pIdx} className="bg-white rounded-lg border border-amber-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-700">
                                  No. Lab: <span className="font-mono">{prevOrder.orderNo}</span>
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(prevOrder.orderDate).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 border-b border-gray-200">
                                    <th className="text-left py-1 font-semibold">Parameter</th>
                                    <th className="text-right py-1 font-semibold">Hasil</th>
                                    <th className="text-center py-1 font-semibold">Flag</th>
                                    <th className="text-center py-1 font-semibold">Rujukan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prevOrder.items.map((pi, iIdx) => (
                                    <tr key={iIdx} className="border-b border-gray-100 last:border-0">
                                      <td className="py-1 text-gray-700">{pi.testName}</td>
                                      <td className="py-1 text-right font-mono font-bold text-gray-900">
                                        {pi.result}
                                        {pi.unit && <span className="text-gray-500 font-normal ml-1">{pi.unit}</span>}
                                      </td>
                                      <td className="py-1 text-center">
                                        {pi.flag === "H" && <span className="text-red-600 font-bold">↑ High</span>}
                                        {pi.flag === "L" && <span className="text-blue-600 font-bold">↓ Low</span>}
                                        {!pi.flag && <span className="text-green-600">✓</span>}
                                      </td>
                                      <td className="py-1 text-center text-gray-500">
                                        {pi.referenceMin && pi.referenceMax
                                          ? `${pi.referenceMin} - ${pi.referenceMax}`
                                          : pi.referenceMin || pi.referenceMax || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="text-left py-3 px-4 w-1/4">Parameter</th>
                      <th className="text-left py-3 px-4 w-1/4">Nilai Hasil</th>
                      <th className="text-center py-3 px-4">Satuan</th>
                      <th className="text-center py-3 px-4">Nilai Rujukan</th>
                      <th className="text-center py-3 px-4 w-20">Flag</th>
                      <th className="text-left py-3 px-4">Catatan</th>
                      <th className="text-center py-3 px-4 w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const r = results[item.id] || { result: "", flag: "", notes: "" };
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{item.testName}</p>
                            <p className="text-xs text-gray-400 font-mono">
                              {item.testCode} · {item.categoryName || "Umum"}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={r.result}
                              onChange={(e) => updateResult(item.id, "result", e.target.value, item)}
                              className={`w-full px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                                r.flag === "H"
                                  ? "border-red-300 bg-red-50/70 text-red-900 font-bold"
                                  : r.flag === "L"
                                  ? "border-blue-300 bg-blue-50/70 text-blue-900 font-bold"
                                  : "border-gray-300 bg-white"
                              }`}
                              placeholder="Masukkan hasil..."
                            />
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500 text-xs">{item.unit || "-"}</td>
                          <td className="py-3 px-4 text-center text-gray-500 text-xs font-mono">
                            {item.referenceText ||
                              (item.referenceMin && item.referenceMax
                                ? `${item.referenceMin} - ${item.referenceMax}`
                                : "-")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.flag ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                  r.flag === "H"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {r.flag === "H" ? "↑ High" : "↓ Low"}
                              </span>
                            ) : r.result ? (
                              <span className="text-emerald-600 font-bold text-xs">✓ Normal</span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={r.notes}
                              onChange={(e) => updateResult(item.id, "notes", e.target.value, item)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="Catatan..."
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 lg:p-8">
          <div className="skeleton h-96 rounded-xl" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
