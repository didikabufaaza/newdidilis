"use client";

interface AnalysisData {
  analisa_interpretasi?: string;
  kemungkinan_penyebab?: string;
  cross_reaction?: string;
  kemungkinan_penyakit?: string;
  saran_pemeriksaan?: string;
  saran_konsul?: string;
  jenis_obat?: string;
  kesan_hasil?: string;
  raw?: string;
}

const SECTIONS: { key: keyof AnalysisData; title: string; icon: string; tone: string }[] = [
  {
    key: "analisa_interpretasi",
    title: "1. Analisa & Interpretasi Hasil Pemeriksaan",
    icon: "🔬",
    tone: "border-blue-200 bg-blue-50/60",
  },
  {
    key: "kemungkinan_penyebab",
    title: "2. Kemungkinan Penyebab",
    icon: "⚙️",
    tone: "border-amber-200 bg-amber-50/60",
  },
  {
    key: "cross_reaction",
    title: "3. Kemungkinan Cross Reaction (False Positive / False Negative)",
    icon: "⚠️",
    tone: "border-orange-200 bg-orange-50/60",
  },
  {
    key: "kemungkinan_penyakit",
    title: "4. Kemungkinan Penyakit",
    icon: "🦠",
    tone: "border-rose-200 bg-rose-50/60",
  },
  {
    key: "saran_pemeriksaan",
    title: "5. Saran Pemeriksaan Lanjutan",
    icon: "🧪",
    tone: "border-emerald-200 bg-emerald-50/60",
  },
  {
    key: "saran_konsul",
    title: "6. Saran Konsultasi ke Dokter Spesialis",
    icon: "🩺",
    tone: "border-purple-200 bg-purple-50/60",
  },
  {
    key: "jenis_obat",
    title: "7. Jenis Obat (Jika Diperlukan)",
    icon: "💊",
    tone: "border-cyan-200 bg-cyan-50/60",
  },
  {
    key: "kesan_hasil",
    title: "8. Kesan Hasil",
    icon: "📌",
    tone: "border-indigo-200 bg-indigo-50/60",
  },
];

function renderText(text: string | undefined) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    return <p key={i} className="mb-1.5">{line}</p>;
  });
}

export default function AnalysisResultPanel({ analysis }: { analysis: AnalysisData }) {
  if (!analysis) return null;

  return (
    <div className="no-print rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h3 className="text-white font-bold">Hasil Analisa & Interpretasi AI (Patologi Klinik)</h3>
            <p className="text-xs text-indigo-100">
              Dihasilkan otomatis oleh sistem berbasis AI — hanya sebagai alat bantu, bukan pengganti penilaian dokter.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {analysis.raw && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-800">
            {analysis.raw}
          </div>
        )}

        {SECTIONS.map((section) => {
          const value = analysis[section.key];
          if (!value) return null;
          return (
            <div key={section.key} className={`rounded-xl border p-4 ${section.tone}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{section.icon}</span>
                <h4 className="font-semibold text-gray-900 text-sm">{section.title}</h4>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed">{renderText(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
