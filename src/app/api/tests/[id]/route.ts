import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { testCatalog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockTestCatalog } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await isDbAvailable())) {
    const test = mockTestCatalog.find((t) => t.id === parseInt(id));
    if (!test) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ test });
  }

  try {
    const [test] = await db
      .select()
      .from(testCatalog)
      .where(eq(testCatalog.id, parseInt(id)))
      .limit(1);

    if (!test) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Get test error:", error);
    const test = mockTestCatalog.find((t) => t.id === parseInt(id));
    if (!test) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ test });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const testId = parseInt(id);

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const idx = mockTestCatalog.findIndex((t) => t.id === testId);
    if (idx === -1) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }
    mockTestCatalog[idx] = {
      ...mockTestCatalog[idx],
      code: body.code || mockTestCatalog[idx].code,
      name: body.name || mockTestCatalog[idx].name,
      categoryId: body.categoryId || mockTestCatalog[idx].categoryId,
      sampleType: body.sampleType || mockTestCatalog[idx].sampleType,
      unit: body.unit || mockTestCatalog[idx].unit,
      referenceMin: body.referenceMin || mockTestCatalog[idx].referenceMin,
      referenceMax: body.referenceMax || mockTestCatalog[idx].referenceMax,
      referenceText: body.referenceText || mockTestCatalog[idx].referenceText,
      price: body.price || mockTestCatalog[idx].price,
      turnaroundHours: body.turnaroundHours || mockTestCatalog[idx].turnaroundHours,
      active: body.active !== false,
    };
    return NextResponse.json({ test: mockTestCatalog[idx] });
  }

  try {
    const body = await request.json();

    const turnaroundHours = body.turnaroundMinutes
      ? Math.ceil(body.turnaroundMinutes / 60)
      : (body.turnaroundHours || null);

    const [test] = await db
      .update(testCatalog)
      .set({
        code: body.code,
        name: body.name,
        categoryId: body.categoryId || null,
        sampleType: body.sampleType,
        unit: body.unit || null,
        referenceMin: body.referenceMin || null,
        referenceMax: body.referenceMax || null,
        referenceText: body.referenceText || null,
        price: body.price || "0",
        turnaroundHours,
        active: body.active !== false,
      })
      .where(eq(testCatalog.id, testId))
      .returning();

    if (!test) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Update test error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate pemeriksaan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const testId = parseInt(id);

  if (!(await isDbAvailable())) {
    const idx = mockTestCatalog.findIndex((t) => t.id === testId);
    if (idx === -1) {
      return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
    }
    mockTestCatalog.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    await db.delete(testCatalog).where(eq(testCatalog.id, testId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus. Mungkin masih ada order yang menggunakan tes ini." },
      { status: 400 }
    );
  }
}
