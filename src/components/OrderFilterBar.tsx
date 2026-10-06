"use client";

export const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "registered", label: "Terdaftar" },
  { value: "sample_collected", label: "Sampel Diambil" },
  { value: "in_progress", label: "Proses" },
  { value: "completed", label: "Selesai" },
  { value: "validated", label: "Tervalidasi" },
  { value: "reported", label: "Dilaporkan" },
];

interface OrderFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  recentOnly: boolean;
  onRecentChange: (v: boolean) => void;
  onReset: () => void;
  searchPlaceholder?: string;
}

export default function OrderFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  recentOnly,
  onRecentChange,
  onReset,
  searchPlaceholder = "Cari No. Lab / No. Permintaan / Nama Pasien / No. RM...",
}: OrderFilterBarProps) {
  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {ORDER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={recentOnly}
            onChange={(e) => onRecentChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600"
          />
          Hanya pasien 24 jam terakhir
        </label>
        {(search || status || !recentOnly) && (
          <button
            onClick={onReset}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ↺ Reset filter
          </button>
        )}
      </div>
    </div>
  );
}