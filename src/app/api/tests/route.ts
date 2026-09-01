import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { testCatalog, testCategories } from "@/db/schema";
import { eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockTestCatalog } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const search = request.nextUrl.searchParams.get("search") || "";
    const all = request.nextUrl.searchParams.get("all") === "true";
    let filtered = mockTestCatalog;
    if (search) {
      const q = search.toLowerCase();
      filtered = mockTestCatalog.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q)
      );
    }
    if (!all) {
      filtered = filtered.slice(0, 50);
    }
    return NextResponse.json({ tests: filtered });
  }

  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const all = request.nextUrl.searchParams.get("all") === "true";

    const conditions = search
      ? or(
          ilike(testCatalog.name, `%${search}%`),
          ilike(testCatalog.code, `%${search}%`)
        )
      : undefined;

    const data = await db
      .select({
        id: testCatalog.id,
        code: testCatalog.code,
        name: testCatalog.name,
        categoryId: testCatalog.categoryId,
        categoryName: testCategories.name,
        sampleType: testCatalog.sampleType,
        unit: testCatalog.unit,
        referenceMin: testCatalog.referenceMin,
        referenceMax: testCatalog.referenceMax,
        referenceText: testCatalog.referenceText,
        price: testCatalog.price,
        turnaroundHours: testCatalog.turnaroundHours,
        active: testCatalog.active,
      })
      .from(testCatalog)
      .leftJoin(testCategories, eq(testCatalog.categoryId, testCategories.id))
      .where(conditions)
      .orderBy(asc(testCategories.sortOrder), asc(testCatalog.code))
      .limit(all ? 1000 : 50);

    return NextResponse.json({ tests: data });
  } catch (error) {
    console.error("Get tests error:", error);
    return NextResponse.json({ tests: mockTestCatalog });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const nextId = Math.max(...mockTestCatalog.map((t) => t.id)) + 1;
    const newTest = {
      id: nextId,
      ...body,
      active: body.active !== false,
      createdAt: new Date(),
    };
    mockTestCatalog.push(newTest);
    return NextResponse.json({ test: newTest }, { status: 201 });
  }

  try {
    const body = await request.json();

    // Auto-generate code if not provided
    let testCode = body.code;
    if (!testCode || testCode.trim() === "") {
      const prefix = body.name
        ? body.name.substring(0, 3).toUpperCase()
        : "TST";
      const lastTest = await db
        .select({ code: testCatalog.code })
        .from(testCatalog)
        .where(sql`${testCatalog.code} LIKE ${prefix + "%"}`)
        .orderBy(sql`${testCatalog.code} DESC`)
        .limit(1);

      let nextNum = 1;
      if (lastTest.length > 0) {
        const lastCode = lastTest[0].code;
        const numPart = lastCode.replace(prefix, "").replace("-", "");
        const parsed = parseInt(numPart);
        if (!isNaN(parsed)) nextNum = parsed + 1;
      }
      testCode = `${prefix}-${String(nextNum).padStart(3, "0")}`;
    }

    const [test] = await db
      .insert(testCatalog)
      .values({
        code: testCode,
        name: body.name,
        categoryId: body.categoryId || null,
        sampleType: body.sampleType || "blood",
        unit: body.unit || null,
        referenceMin: body.referenceMin || null,
        referenceMax: body.referenceMax || null,
        referenceText: body.referenceText || null,
        price: body.price || "0",
        turnaroundHours: body.turnaroundMinutes ? Math.ceil(body.turnaroundMinutes / 60) : (body.turnaroundHours || null),
      })
      .returning();
    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Create test error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data pemeriksaan" },
      { status: 500 }
    );
  }
}
