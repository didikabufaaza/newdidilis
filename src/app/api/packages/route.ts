import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { testPackages, testPackageItems, testCatalog, testCategories } from "@/db/schema";
import { eq, sql, ilike, or } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockTestPackages } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isDbAvailable())) {
    const search = request.nextUrl.searchParams.get("search") || "";
    let filtered = mockTestPackages;
    if (search) {
      const q = search.toLowerCase();
      filtered = mockTestPackages.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ packages: filtered });
  }

  try {
    const search = request.nextUrl.searchParams.get("search") || "";

    const conditions = search
      ? or(ilike(testPackages.name, `%${search}%`), ilike(testPackages.code, `%${search}%`))
      : undefined;

    const packages = await db
      .select()
      .from(testPackages)
      .where(conditions)
      .orderBy(sql`${testPackages.name}`);

    const result = [];
    for (const pkg of packages) {
      const items = await db
        .select({
          id: testPackageItems.id,
          testId: testPackageItems.testId,
          testCode: testCatalog.code,
          testName: testCatalog.name,
          categoryName: testCategories.name,
          unit: testCatalog.unit,
          referenceMin: testCatalog.referenceMin,
          referenceMax: testCatalog.referenceMax,
          referenceText: testCatalog.referenceText,
          price: testCatalog.price,
        })
        .from(testPackageItems)
        .innerJoin(testCatalog, eq(testPackageItems.testId, testCatalog.id))
        .leftJoin(testCategories, eq(testCatalog.categoryId, testCategories.id))
        .where(eq(testPackageItems.packageId, pkg.id));

      result.push({ ...pkg, items });
    }

    return NextResponse.json({ packages: result });
  } catch (error) {
    console.error("Get packages error:", error);
    return NextResponse.json({ packages: mockTestPackages });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const { code, name, description, price, testIds } = body;
    if (!code || !name || !testIds || testIds.length === 0) {
      return NextResponse.json({ error: "Kode, nama, dan minimal satu pemeriksaan wajib diisi" }, { status: 400 });
    }
    const nextId = Math.max(...mockTestPackages.map((p) => p.id)) + 1;
    const newPkg = {
      id: nextId,
      code: code.toUpperCase(),
      name,
      description: description || null,
      price: price || "0",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: testIds.map((testId: number, idx: number) => ({
        id: nextId * 100 + idx,
        testId,
        testCode: "",
        testName: "",
        categoryName: null,
        unit: null,
        referenceMin: null,
        referenceMax: null,
        referenceText: null,
        price: "0",
      })),
    };
    mockTestPackages.push(newPkg);
    return NextResponse.json({ package: newPkg }, { status: 201 });
  }

  try {
    const body = await request.json();
    const { code, name, description, price, testIds } = body;

    if (!code || !name || !testIds || testIds.length === 0) {
      return NextResponse.json({ error: "Kode, nama, dan minimal satu pemeriksaan wajib diisi" }, { status: 400 });
    }

    const [pkg] = await db
      .insert(testPackages)
      .values({
        code: code.toUpperCase(),
        name,
        description: description || null,
        price: price || "0",
      })
      .returning();

    await db.insert(testPackageItems).values(
      testIds.map((testId: number) => ({
        packageId: pkg.id,
        testId,
      }))
    );

    const items = await db
      .select({
        id: testPackageItems.id,
        testId: testPackageItems.testId,
        testCode: testCatalog.code,
        testName: testCatalog.name,
        categoryName: testCategories.name,
        unit: testCatalog.unit,
        referenceMin: testCatalog.referenceMin,
        referenceMax: testCatalog.referenceMax,
        referenceText: testCatalog.referenceText,
        price: testCatalog.price,
      })
      .from(testPackageItems)
      .innerJoin(testCatalog, eq(testPackageItems.testId, testCatalog.id))
      .leftJoin(testCategories, eq(testCatalog.categoryId, testCategories.id))
      .where(eq(testPackageItems.packageId, pkg.id));

    return NextResponse.json({ package: { ...pkg, items } }, { status: 201 });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json({ error: "Gagal membuat paket" }, { status: 500 });
  }
}
