import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { resolveAnalysisAccess } from "@/lib/analysis";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, doctors, orderItems, testCatalog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mockLabOrders, getMockOrderItems } from "@/lib/mock-data";

export const maxDuration = 120;

interface AnalysisItem {
  testName: string;
  result: string;
  unit: string | null;
  reference: string | null;
  flag: string | null;
}

interface ClientItem {
  testName?: string;
  result?: string | null;
  unit?: string | null;
  referenceMin?: string | null;
  referenceMax?: string | null;
  referenceText?: string | null;
  flag?: string | null;
}

const SYSTEM_PROMPT = `Anda adalah seorang dokter spesialis Patologi Klinik yang sangat berpengalaman. Tugas Anda adalah menganalisis dan menginterpretasi hasil pemeriksaan laboratorium secara lengkap, detail, dan sistematis sesuai standar profesi dokter spesialis patologi klinik.

Instruksi:
- Analisislah hasil pemeriksaan laboratorium yang diberikan beserta data klinis pasien.
- Interpretasi harus ilmiah, hati-hati, dan tidak berlebihan. Tandai hal-hal yang bersifat dugaan dengan kata "kemungkinan".
- Gunakan bahasa Indonesia yang jelas, profesional, dan mudah dipahami dokter pengirim (referring physician).
- Bila data pemeriksaan tidak lengkap, nyatakan keterbatasan/ketidaklengkapan tersebut.

Berikan jawaban dalam format JSON dengan struktur EXACT berikut (hanya SATU objek JSON, tanpa teks lain di luar objek tersebut):
{
  "analisa_interpretasi": "Analisis terperinci per parameter: nilai, satuan, hasil dibanding nilai rujukan, pola kelainan (meningkat/menurun) beserta makna klinisnya, dan interpretasi keseluruhan secara terintegrasi.",
  "kemungkinan_penyebab": "Penjelasan kemungkinan penyebab (fisiologis, patologis, akut/kronis) dari setiap kelainan, dan faktor-faktor yang dapat memengaruhi hasil.",
  "cross_reaction": "Penilaian adanya kemungkinan reaksi silang (cross reaction) pada parameter yang diperiksa, baik kemungkinan false positive maupun false negative, beserta penjelasannya.",
  "kemungkinan_penyakit": "Daftar kemungkinan diagnosis banding (differential diagnosis) yang relevan, ditulis per nomor, sesuai pola kelainan laboratorium dan data klinis.",
  "saran_pemeriksaan": "Rekomendasi pemeriksaan laboratorium dan penunjang lanjutan yang perlu dilakukan untuk konfirmasi diagnosis.",
  "saran_konsul": "Saran untuk berkonsultasi / dirujuk ke dokter spesialis terkait lainnya bila diperlukan, beserta jenis dokter spesialisnya.",
  "jenis_obat": "Gambaran umum jenis/kelas obat yang mungkin dipertimbangkan jika memang diperlukan pengobatan. WAJIB diakhiri dengan penegasan bahwa keputusan pengobatan sepenuhnya oleh dokter penanggung jawab pasien.",
  "kesan_hasil": "Kesan akhir hasil pemeriksaan secara ringkas, padat, dan jelas (termasuk kesimpulan normal/abnormal dan urgensi tindak lanjut)."
}

Catatan penting: Hasil ini hanyalah alat bantu analisis dan TIDAK menggantikan penilaian klinis dokter penanggung jawab pasien.`;

async function fetchOrderForAnalysis(orderId: number) {
  if (!(await isDbAvailable())) {
    const order = mockLabOrders.find((o) => o.id === orderId);
    if (!order) return null;
    return { order, items: getMockOrderItems(orderId) };
  }

  try {
    const [order] = await db
      .select({
        orderNo: labOrders.orderNo,
        patientName: patients.name,
        patientMrn: patients.medicalRecordNo,
        patientGender: patients.gender,
        patientDob: patients.dateOfBirth,
        patientAge: patients.age,
        age: labOrders.age,
        room: labOrders.room,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        diagnosis: labOrders.diagnosis,
        clinicalNotes: labOrders.clinicalNotes,
      })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .leftJoin(doctors, eq(labOrders.doctorId, doctors.id))
      .where(eq(labOrders.id, orderId))
      .limit(1);

    if (!order) return null;

    const items = await db
      .select({
        testName: testCatalog.name,
        testCode: testCatalog.code,
        result: orderItems.result,
        unit: orderItems.unit,
        referenceMin: orderItems.referenceMin,
        referenceMax: orderItems.referenceMax,
        referenceText: orderItems.referenceText,
        flag: orderItems.flag,
      })
      .from(orderItems)
      .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
      .where(eq(orderItems.orderId, orderId));

    return { order, items };
  } catch (error) {
    console.error("Fetch order for analysis error:", error);
    const order = mockLabOrders.find((o) => o.id === orderId);
    if (!order) return null;
    return { order, items: getMockOrderItems(orderId) };
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await resolveAnalysisAccess(user);
  if (!access.canAnalyze) {
    return NextResponse.json({ error: "Anda tidak memiliki akses fitur Analisa AI" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key AI belum dikonfigurasi" }, { status: 500 });
  }

  const body = await request.json();
  const orderId = parseInt(body.orderId);
  const clientItems: ClientItem[] = Array.isArray(body.items) ? body.items : [];

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Order tidak valid" }, { status: 400 });
  }

  const data = await fetchOrderForAnalysis(orderId);
  if (!data) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  let itemList: AnalysisItem[];

  if (clientItems.length > 0) {
    itemList = clientItems
      .filter((i) => i.result && String(i.result).trim() !== "")
      .map((i) => ({
        testName: i.testName || "Parameter",
        result: String(i.result),
        unit: i.unit || null,
        reference:
          i.referenceText ||
          (i.referenceMin && i.referenceMax
            ? `${i.referenceMin} - ${i.referenceMax}`
            : null),
        flag: i.flag || null,
      }));
  } else {
    itemList = data.items
      .filter((i) => i.result && String(i.result).trim() !== "")
      .map((i) => ({
        testName: i.testName,
        result: String(i.result),
        unit: i.unit || null,
        reference:
          (i as any).referenceText ||
          ((i as any).referenceMin && (i as any).referenceMax
            ? `${i.referenceMin} - ${i.referenceMax}`
            : null),
        flag: i.flag || null,
      }));
  }

  if (itemList.length === 0) {
    return NextResponse.json(
      { error: "Belum ada hasil pemeriksaan yang dapat dianalisis pada order ini" },
      { status: 400 }
    );
  }

  const patientContext = [
    `Nama: ${data.order.patientName}`,
    `No RM: ${data.order.patientMrn}`,
    data.order.patientGender
      ? `Jenis Kelamin: ${data.order.patientGender === "male" ? "Laki-laki" : "Perempuan"}`
      : null,
    `Umur: ${data.order.age || data.order.patientAge || "-"}`,
    data.order.room ? `Ruang: ${data.order.room}` : null,
    data.order.doctorName
      ? `Dokter Pengirim: ${data.order.doctorName}${
          data.order.doctorSpecialization ? ` (${data.order.doctorSpecialization})` : ""
        }`
      : null,
    data.order.diagnosis ? `Diagnosis: ${data.order.diagnosis}` : null,
    data.order.clinicalNotes ? `Ket. Klinis: ${data.order.clinicalNotes}` : null,
  ];

  const userPromptParts = [
    "Berikut adalah data klinis pasien:",
    patientContext.filter(Boolean).map((l) => `- ${l}`).join("\n"),
    "",
    "Berikut adalah hasil pemeriksaan laboratorium:",
    ...itemList.map((p, idx) => {
      const flagTxt = p.flag === "H" ? " [TINGGI]" : p.flag === "L" ? " [RENDAH]" : "";
      const ref = p.reference ? ` | Rujukan: ${p.reference}` : "";
      return `${idx + 1}. ${p.testName}${flagTxt}: ${p.result}${p.unit ? " " + p.unit : ""}${ref}`;
    }),
  ];

  userPromptParts.push(
    "",
    "Silakan berikan analisis dan interpretasi lengkap sesuai 8 poin yang diminta, dalam format JSON.",
    "Gunakan bahasa Indonesia."
  );

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPromptParts.join("\n") }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: `Gagal memanggil layanan AI (status ${geminiRes.status}). Silakan coba lagi.` },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "Layanan AI tidak mengembalikan hasil analisis" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({
      analysis: parsed,
      analyzedAt: new Date().toISOString(),
      order: {
        orderNo: data.order.orderNo,
        patientName: data.order.patientName,
        patientMrn: data.order.patientMrn,
      },
      items: itemList,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat menganalisis hasil" }, { status: 500 });
  }
}
