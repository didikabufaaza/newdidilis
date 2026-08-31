"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface OrderDetail {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  room: string | null;
  age: string | null;
  status: string;
  priority: string;
  clinicalNotes: string | null;
  diagnosis: string | null;
  totalPrice: string | null;
  createdAt: string;
  updatedAt: string;
  requestDate: string | null;
  resultDate: string | null;
  collectedAt: string | null;
  completedAt: string | null;
  validatedAt: string | null;
  patientId: number;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientDob: string;
  patientPhone: string | null;
  patientBloodType: string | null;
  patientAge: string | null;
  patientRoom: string | null;
  doctorId: number | null;
  doctorName: string | null;
  doctorSpecialization: string | null;
  doctorHospital: string | null;
}

interface OrderItem {
  id: number;
  testId: number;
  testCode: string;
  testName: string;
  categoryName: string | null;
  result: string | null;
  resultNumeric: string | null;
  resultStatus: string;
  unit: string | null;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  flag: string | null;
  notes: string | null;
}

interface Test {
  id: number;
  code: string;
  name: string;
  categoryName: string | null;
  sampleType: string;
  price: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  registered: { label: "Terdaftar", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  sample_collected: { label: "Sampel Diambil", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  in_progress: { label: "Dalam Proses", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  completed: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  validated: { label: "Tervalidasi", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  reported: { label: "Dilaporkan", color: "text-gray-700", bg: "bg-gray-100 border-gray-200" },
};

const statusFlow = ["registered", "sample_collected", "in_progress", "completed", "validated", "reported"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Tambah Parameter modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [selectedNewTests, setSelectedNewTests] = useState<Test[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [addingTests, setAddingTests] = useState(false);

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) {
      router.push("/dashboard/orders");
      return;
    }
    const data = await res.json();
    setOrder(data.order);
    setItems(data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchOrder();
    setUpdating(false);
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setSelectedNewTests([]);
    setTestSearch("");

    const res = await fetch("/api/tests?all=true");
    const data = await res.json();
    setAvailableTests(data.tests || []);
  };

  const handleAddTests = async () => {
    if (selectedNewTests.length === 0) return;
    setAddingTests(true);

    try {
      const res = await fetch(`/api/orders/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testIds: selectedNewTests.map((t) => t.id),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setSelectedNewTests([]);
        await fetchOrder();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menambah pemeriksaan");
      }
    } catch {
      alert("Gagal menambah pemeriksaan");
    }

    setAddingTests(false);
  };

  const existingTestIds = new Set(items.map((i) => i.testId));
  const filteredAvailableTests = availableTests.filter(
    (t) =>
      !existingTestIds.has(t.id) &&
      !selectedNewTests.find((st) => st.id === t.id) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
        (t.categoryName || "").toLowerCase().includes(testSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-48 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-96 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const sc = statusConfig[order.status];
  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
  const nextLabel = nextStatus ? statusConfig[nextStatus]?.label : null;

  const groupedItems: Record<string, OrderItem[]> = {};
  items.forEach((item) => {
    const cat = item.categoryName || "Pemeriksaan Lainnya";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  const displayAge = order.age || order.patientAge || "-";
  const displayRoom = order.room || order.patientRoom || "Poli Umum";
  const tglPermintaan = order.requestDate || order.createdAt;
  const tglHasil = order.resultDate || (order.status === "completed" || order.status === "validated" ? order.updatedAt : null);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{order.noLab || order.orderNo}</h1>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${sc?.bg} ${sc?.color}`}>
                {sc?.label}
              </span>
              {order.priority !== "normal" && (
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    order.priority === "cito"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}
                >
                  {order.priority === "cito" ? "CITO" : "URGENT"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex gap-3">
              <span>No. Permintaan: <strong>{order.noPermintaan || order.orderNo}</strong></span>
              <span>·</span>
              <span>Pasien: <strong>{order.patientName}</strong> ({order.patientMrn})</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            ➕ Tambah Parameter
          </button>
          {nextStatus && (
            <button
              onClick={() => updateStatus(nextStatus)}
              disabled={updating}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {updating ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "→"
              )}{" "}
              {nextLabel}
            </button>
          )}
          <Link
            href={`/dashboard/print?orderId=${order.id}`}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm bg-white"
          >
            🖨️ Cetak / PDF
          </Link>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {statusFlow.map((s, i) => {
            const cfg = statusConfig[s];
            const done = i <= currentIdx;
            const current = s === order.status;
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      done ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    } ${current ? "ring-4 ring-blue-100" : ""}`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1.5 text-center truncate max-w-[80px] ${
                      current ? "font-semibold text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {cfg.label}
                  </span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-20px] min-w-[20px] ${
                      i < currentIdx ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                Hasil Pemeriksaan ({items.length} parameter)
              </h3>
              {(order.status === "sample_collected" || order.status === "in_progress") && (
                <Link
                  href={`/dashboard/results?orderId=${order.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Input Hasil →
                </Link>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-500 text-sm mb-4">Belum ada pemeriksaan pada order ini</p>
                <button
                  onClick={openAddModal}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  ➕ Tambah Parameter Pemeriksaan
                </button>
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, catItems]) => (
                <div key={category}>
                  <div className="px-6 py-2.5 bg-gray-100/70 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{category}</span>
                    <span className="text-xs text-gray-400">{catItems.length} item</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500">
                        <th className="text-left py-2 px-6 font-medium">Parameter</th>
                        <th className="text-center py-2 px-4 font-medium">Hasil</th>
                        <th className="text-center py-2 px-4 font-medium">Satuan</th>
                        <th className="text-center py-2 px-4 font-medium">Nilai Rujukan</th>
                        <th className="text-center py-2 px-4 font-medium">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5 px-6">
                            <p className="font-medium text-gray-900">{item.testName}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.testCode}</p>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {item.result ? (
                              <span
                                className={`font-bold ${
                                  item.flag === "H"
                                    ? "text-red-600"
                                    : item.flag === "L"
                                    ? "text-blue-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {item.result}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs italic">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center text-gray-500 text-xs">{item.unit || "-"}</td>
                          <td className="py-2.5 px-4 text-center text-gray-500 text-xs">
                            {item.referenceText ||
                              (item.referenceMin && item.referenceMax
                                ? `${item.referenceMin} - ${item.referenceMax}`
                                : "-")}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {item.flag ? (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                  item.flag === "H"
                                    ? "bg-red-100 text-red-700"
                                    : item.flag === "L"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.flag === "H" ? "↑ High" : item.flag === "L" ? "↓ Low" : item.flag}
                              </span>
                            ) : item.result ? (
                              <span className="text-emerald-600 text-xs font-medium">Normal</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Complete Patient & Clinical Details */}
        <div className="space-y-6">
          {/* Identitas Pasien */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>👤 Data Identitas Pasien</span>
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Nama Pasien</dt>
                <dd className="font-bold text-gray-900">{order.patientName}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">No. RM</dt>
                <dd className="font-mono font-medium text-blue-600">{order.patientMrn}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">No. Lab</dt>
                <dd className="font-mono font-medium text-blue-600">{order.noLab || order.orderNo}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">No. Permintaan</dt>
                <dd className="font-mono text-gray-700">{order.noPermintaan || order.orderNo}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Jenis Kelamin</dt>
                <dd className="text-gray-800">{order.patientGender === "male" ? "Laki-laki (L)" : "Perempuan (P)"}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Umur Pasien</dt>
                <dd className="font-medium text-emerald-700">{displayAge}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Tanggal Lahir</dt>
                <dd className="text-gray-800">{order.patientDob}</dd>
              </div>
              {order.patientBloodType && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-500">Golongan Darah</dt>
                  <dd className="font-bold text-red-600">{order.patientBloodType}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Pelayanan & Klinis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🏥 Informasi Pelayanan Lab</span>
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Ruang / Unit</dt>
                <dd className="font-medium text-gray-900">{displayRoom}</dd>
              </div>
              <div className="border-b pb-2">
                <dt className="text-gray-500 mb-0.5">Dokter Pengirim</dt>
                <dd className="font-medium text-gray-900">
                  {order.doctorName ? (
                    <>
                      {order.doctorName}
                      {order.doctorSpecialization && (
                        <span className="block text-xs text-gray-500">{order.doctorSpecialization}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </dd>
              </div>
              {(order.diagnosis || order.clinicalNotes) && (
                <div className="border-b pb-2">
                  <dt className="text-gray-500 mb-0.5">Diagnosis / Indikasi</dt>
                  <dd className="text-gray-800 text-xs bg-gray-50 p-2 rounded">
                    {order.diagnosis || order.clinicalNotes}
                  </dd>
                </div>
              )}
              <div className="border-b pb-2">
                <dt className="text-gray-500 text-xs">⏱️ Tgl & Jam Permintaan</dt>
                <dd className="text-xs font-semibold text-blue-700 mt-0.5">
                  {tglPermintaan ? format(new Date(tglPermintaan), "dd/MM/yyyy HH:mm:ss", { locale: idLocale }) : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">🏁 Tgl & Jam Keluar Hasil</dt>
                <dd className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {tglHasil ? format(new Date(tglHasil), "dd/MM/yyyy HH:mm:ss", { locale: idLocale }) : "Menunggu Verifikasi"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Biaya */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Total Biaya Pemeriksaan</span>
              <span className="text-xl font-bold text-gray-900">
                Rp {parseInt(order.totalPrice || "0").toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL TAMBAH PARAMETER ===== */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">➕ Tambah Parameter Pemeriksaan</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Pasien: {order.patientName} ({order.patientMrn}) — No. Lab: {order.noLab || order.orderNo}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white text-2xl font-light leading-none">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-3">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="🔍 Cari pemeriksaan untuk ditambahkan..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                />
              </div>

              {/* Already in order */}
              {items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Sudah ada di order ini ({items.length} item):</p>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {items.map((item) => (
                      <span key={item.id} className="inline-flex px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600">
                        {item.testName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected to Add */}
              {selectedNewTests.length > 0 && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-800 font-bold mb-1">
                    Akan ditambahkan ({selectedNewTests.length} item):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {selectedNewTests.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs bg-white text-emerald-800 border border-emerald-300 font-medium"
                      >
                        {t.name}
                        <button
                          onClick={() => setSelectedNewTests(selectedNewTests.filter((st) => st.id !== t.id))}
                          className="text-emerald-500 hover:text-red-500 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tests List */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                {filteredAvailableTests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    {testSearch ? "Pemeriksaan tidak ditemukan" : "Semua pemeriksaan sudah ada di order"}
                  </div>
                ) : (
                  filteredAvailableTests.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedNewTests([...selectedNewTests, t])}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/50 transition-colors flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                            {t.code}
                          </span>
                          <span className="font-semibold text-gray-900">{t.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.categoryName || "Umum"} · {t.sampleType}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600">
                          Rp {parseInt(t.price || "0").toLocaleString("id-ID")}
                        </span>
                        <span className="text-emerald-600 font-bold text-lg">+</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-600">
                {selectedNewTests.length} parameter dipilih · Tambahan Biaya:{" "}
                <strong>
                  Rp {selectedNewTests.reduce((s, t) => s + parseFloat(t.price || "0"), 0).toLocaleString("id-ID")}
                </strong>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddTests}
                  disabled={selectedNewTests.length === 0 || addingTests}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {addingTests ? "Menambahkan..." : `Tambah ${selectedNewTests.length} Parameter`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
