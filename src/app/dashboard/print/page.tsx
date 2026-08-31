"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface LetterheadSettings {
  pemda: string | null;
  hospitalName: string | null;
  hospitalAddress: string | null;
  hospitalEmail: string | null;
  hospitalPhone: string | null;
  logoLeft: string | null;
  logoRight: string | null;
}

interface Order {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  status: string;
  priority: string;
  createdAt: string;
  patientName: string;
  patientMrn: string;
}

interface OrderDetail {
  id: number;
  orderNo: string;
  noPermintaan: string | null;
  noLab: string | null;
  room: string | null;
  age: string | null;
  status: string;
  createdAt: string;
  requestDate: string | null;
  resultDate: string | null;
  patientName: string;
  patientMrn: string;
  patientGender: string;
  patientDob: string;
  patientBloodType: string | null;
  patientAge: string | null;
  patientRoom: string | null;
  doctorId: number | null;
  doctorName: string | null;
  doctorSpecialization: string | null;
  diagnosis: string | null;
  clinicalNotes: string | null;
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
}

function LabResultDocument({
  order,
  items,
  letterhead,
}: {
  order: OrderDetail;
  items: OrderItem[];
  letterhead: LetterheadSettings | null;
}) {
  // Group items by category
  const groupedItems: Record<string, OrderItem[]> = {};
  items.forEach((item) => {
    const cat = item.categoryName || "Pemeriksaan Lainnya";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  const displayAge = order.age || order.patientAge || "-";
  const displayRoom = order.room || order.patientRoom || "Poli Umum";
  const displayNoLab = order.noLab || order.orderNo;
  const displayNoPermintaan = order.noPermintaan || order.orderNo;

  const tglPermintaan = order.requestDate || order.createdAt;
  const tglHasil = order.resultDate || order.createdAt;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#000", lineHeight: 1.4 }}>
      {/* KOP SURAT */}
      <table style={{ width: "100%", marginBottom: "12px", borderBottom: "3px double #333", paddingBottom: "10px" }}>
        <tbody>
          <tr>
            <td style={{ width: "80px", verticalAlign: "middle" }}>
              {letterhead?.logoLeft ? (
                <img src={letterhead.logoLeft} alt="Logo Kiri" style={{ maxHeight: "65px", maxWidth: "70px", objectFit: "contain" }} />
              ) : (
                <div style={{ width: "60px", height: "60px", background: "#eee", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#888" }}>
                  LOGO
                </div>
              )}
            </td>
            <td style={{ textAlign: "center", verticalAlign: "middle", padding: "0 10px" }}>
              {letterhead?.pemda && (
                <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {letterhead.pemda}
                </div>
              )}
              <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "1px" }}>
                {letterhead?.hospitalName || "LABORATORIUM KLINIK RUMAH SAKIT"}
              </div>
              {letterhead?.hospitalAddress && (
                <div style={{ fontSize: "9px", color: "#333", marginBottom: "2px" }}>{letterhead.hospitalAddress}</div>
              )}
              <div style={{ fontSize: "9px", color: "#333" }}>
                {letterhead?.hospitalEmail && `Email: ${letterhead.hospitalEmail}`}
                {letterhead?.hospitalEmail && letterhead?.hospitalPhone && " | "}
                {letterhead?.hospitalPhone && `Telp: ${letterhead.hospitalPhone}`}
              </div>
            </td>
            <td style={{ width: "80px", verticalAlign: "middle", textAlign: "right" }}>
              {letterhead?.logoRight ? (
                <img src={letterhead.logoRight} alt="Logo Kanan" style={{ maxHeight: "65px", maxWidth: "70px", objectFit: "contain", marginLeft: "auto" }} />
              ) : (
                <div style={{ width: "60px", height: "60px", background: "#eee", borderRadius: "6px", marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#888" }}>
                  LOGO
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* JUDUL HASIL */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", textDecoration: "underline", letterSpacing: "1px" }}>
          HASIL PEMERIKSAAN LABORATORIUM
        </div>
      </div>

      {/* TABEL IDENTITAS LENGKAP */}
      <table style={{ width: "100%", fontSize: "10px", marginBottom: "14px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "135px", padding: "2.5px 0", verticalAlign: "top" }}>No. Lab</td>
            <td style={{ width: "8px", verticalAlign: "top" }}>:</td>
            <td style={{ fontWeight: "bold", fontFamily: "monospace", verticalAlign: "top" }}>{displayNoLab}</td>
            
            <td style={{ width: "135px", padding: "2.5px 0", verticalAlign: "top" }}>Tgl / Jam Permintaan</td>
            <td style={{ width: "8px", verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top" }}>
              {tglPermintaan ? format(new Date(tglPermintaan), "dd/MM/yyyy HH:mm:ss", { locale: idLocale }) : "-"}
            </td>
          </tr>

          <tr>
            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>No. Permintaan Lab</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ fontWeight: "bold", fontFamily: "monospace", verticalAlign: "top" }}>{displayNoPermintaan}</td>

            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Tgl / Jam Keluar Hasil</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top", fontWeight: "bold", color: "#047857" }}>
              {tglHasil ? format(new Date(tglHasil), "dd/MM/yyyy HH:mm:ss", { locale: idLocale }) : "-"}
            </td>
          </tr>

          <tr>
            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>No. Rekam Medis (RM)</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ fontWeight: "bold", fontFamily: "monospace", verticalAlign: "top" }}>{order.patientMrn}</td>

            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Ruang / Unit Perawatan</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top" }}>{displayRoom}</td>
          </tr>

          <tr>
            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Nama Pasien</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ fontWeight: "bold", verticalAlign: "top" }}>{order.patientName}</td>

            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Dokter Pengirim</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top" }}>
              {order.doctorName ? `${order.doctorName}${order.doctorSpecialization ? ` (${order.doctorSpecialization})` : ""}` : "-"}
            </td>
          </tr>

          <tr>
            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Jenis Kelamin / Umur</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top" }}>
              {order.patientGender === "male" ? "Laki-laki" : "Perempuan"} / {displayAge}
            </td>

            <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Golongan Darah</td>
            <td style={{ verticalAlign: "top" }}>:</td>
            <td style={{ verticalAlign: "top" }}>{order.patientBloodType || "-"}</td>
          </tr>

          {(order.diagnosis || order.clinicalNotes) && (
            <tr>
              <td style={{ padding: "2.5px 0", verticalAlign: "top" }}>Diagnosis / Ket. Klinis</td>
              <td style={{ verticalAlign: "top" }}>:</td>
              <td colSpan={4} style={{ verticalAlign: "top", fontStyle: "italic" }}>
                {order.diagnosis || order.clinicalNotes || "-"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* HASIL PEMERIKSAAN PER KATEGORI */}
      {Object.entries(groupedItems).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", background: "#e2e8f0", padding: "5px 8px", borderLeft: "3px solid #2563eb", marginBottom: "4px", textTransform: "uppercase" }}>
            {category}
          </div>
          <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse", border: "1px solid #cbd5e1" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #cbd5e1", fontWeight: 600, width: "35%" }}>Parameter Pemeriksaan</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #cbd5e1", fontWeight: 600, width: "18%" }}>Hasil</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #cbd5e1", fontWeight: 600, width: "12%" }}>Satuan</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #cbd5e1", fontWeight: 600, width: "25%" }}>Nilai Rujukan</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #cbd5e1", fontWeight: 600, width: "10%" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {catItems.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 8px", borderBottom: "1px solid #e2e8f0" }}>{item.testName}</td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "5px 8px",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight: item.flag ? "bold" : "normal",
                      color: item.flag === "H" ? "#dc2626" : item.flag === "L" ? "#2563eb" : "#000000",
                    }}
                  >
                    {item.result}
                  </td>
                  <td style={{ textAlign: "center", padding: "5px 8px", borderBottom: "1px solid #e2e8f0" }}>{item.unit || "-"}</td>
                  <td style={{ textAlign: "center", padding: "5px 8px", borderBottom: "1px solid #e2e8f0" }}>
                    {item.referenceText || (item.referenceMin && item.referenceMax ? `${item.referenceMin} - ${item.referenceMax}` : "-")}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "5px 8px",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight: "bold",
                      color: item.flag === "H" ? "#dc2626" : item.flag === "L" ? "#2563eb" : "#000000",
                      fontSize: "12px",
                    }}
                  >
                    {item.flag === "H" ? "↑ High" : item.flag === "L" ? "↓ Low" : "Normal"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* TANDA TANGAN */}
      <div style={{ marginTop: "35px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ marginBottom: "50px", fontSize: "10px" }}>
            {format(new Date(), "'Tanggal' dd MMMM yyyy", { locale: idLocale })}
          </div>
          <div style={{ borderTop: "1px solid #000", paddingTop: "5px", fontSize: "10px", fontWeight: 600 }}>
            Penanggung Jawab Laboratorium
          </div>
        </div>
      </div>

      {/* FOOTER KETERANGAN & CATATAN */}
      <div style={{ marginTop: "25px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "8px", color: "#64748b" }}>
        <div><strong>Keterangan Flag:</strong> ↑ High = Nilai di atas batas normal &nbsp;&nbsp;|&nbsp;&nbsp; ↓ Low = Nilai di bawah batas normal</div>
        <div style={{ marginTop: "2px" }}>Hasil pemeriksaan laboratorium ini telah tervalidasi secara sistem informasi laboratorium (LIS).</div>
        <div style={{ marginTop: "2px", fontStyle: "italic" }}>
          Dicetak pada: {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: idLocale })}
        </div>
      </div>
    </div>
  );
}

function PrintContent() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    preselectedOrderId ? parseInt(preselectedOrderId) : null
  );
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [letterhead, setLetterhead] = useState<LetterheadSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=100").then((r) => r.json()),
      fetch("/api/settings/letterhead").then((r) => r.json()),
    ]).then(([ordersData, lh]) => {
      setOrders(ordersData.orders || []);
      setLetterhead(lh.settings);
      setLoading(false);

      if (preselectedOrderId) {
        loadOrderDetail(parseInt(preselectedOrderId));
      }
    });
  }, [preselectedOrderId]);

  const loadOrderDetail = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setLoadingOrder(true);
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    setOrder(data.order);
    setItems(data.items.filter((i: OrderItem) => i.result));
    setLoadingOrder(false);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      (o.noPermintaan && o.noPermintaan.toLowerCase().includes(search.toLowerCase())) ||
      (o.noLab && o.noLab.toLowerCase().includes(search.toLowerCase())) ||
      o.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* SCREEN CONTENT */}
      <div className="no-print p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cetak Hasil Laboratorium</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pilih order pemeriksaan untuk mencetak hasil atau menyimpannya sebagai PDF
            </p>
          </div>
          {order && items.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                🖨️ Cetak Hasil
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                📄 Simpan PDF
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Order List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-6">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Cari No. Lab / Pasien..."
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
                  <div className="p-8 text-center text-sm text-gray-500">Tidak ada order ditemukan</div>
                ) : (
                  filteredOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => loadOrderDetail(o.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                        selectedOrderId === o.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-blue-600">
                          {o.noLab || o.orderNo}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            o.status === "validated"
                              ? "bg-green-100 text-green-800"
                              : o.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.status === "validated" ? "Valid" : o.status === "completed" ? "Selesai" : "Proses"}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">{o.patientName}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        {o.patientMrn} {o.noPermintaan ? `· ${o.noPermintaan}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-3">
            {!selectedOrderId ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-5xl mb-4">🖨️</p>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Pilih Order Pemeriksaan</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Pilih order dari daftar di sebelah kiri untuk melihat dokumen hasil laboratorium lengkap dengan kop surat dan identitas pasien.
                </p>
              </div>
            ) : loadingOrder ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Memuat dokumen hasil laboratorium...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-5xl mb-4">📋</p>
                <h3 className="font-semibold text-gray-900 mb-2">Hasil Belum Diinput</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Order ini belum memiliki nilai hasil pemeriksaan yang tersimpan.
                </p>
                <a
                  href={`/dashboard/results?orderId=${selectedOrderId}`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  📝 Input Hasil Sekarang →
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
                  <span>📄 Preview Dokumen Hasil Lab (Format Cetak A4)</span>
                  <span>Siap Dicetak / Disimpan sebagai PDF</span>
                </div>
                <div className="p-4 bg-gray-200/70 overflow-auto" style={{ maxHeight: "75vh" }}>
                  <div
                    className="bg-white mx-auto shadow-2xl rounded-sm"
                    style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm" }}
                  >
                    {order && <LabResultDocument order={order} items={items} letterhead={letterhead} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT AREA - Active during window.print() */}
      <div className="print-area">
        {order && items.length > 0 && (
          <LabResultDocument order={order} items={items} letterhead={letterhead} />
        )}
      </div>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="skeleton h-96 rounded-xl" /></div>}>
      <PrintContent />
    </Suspense>
  );
}
