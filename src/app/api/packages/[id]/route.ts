import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { testPackages, testPackageItems, testCatalog, testCategories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockTestPackages } from "@/lib/mock-data";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pkgId = parseInt(id);

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const { code, name, description, price, testIds } = body;
    const idx = mockTestPackages.findIndex((p) => p.id === pkgId);
    if (idx === -1) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (code) updateFields.code = code.toUpperCase();
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description || null;
    if (price !== undefined) updateFields.price = price || "0";
    if (testIds) {
      updateFields.items = testIds.map((testId: number, i: number) => ({
        id: pkgId * 100 + i,
        testId,
        testCode: "",
        testName: "",
        categoryName: null,
        unit: null,
        referenceMin: null,
        referenceMax: null,
        referenceText: null,
        price: "0",
      }));
    }
    mockTestPackages[idx] = { ...mockTestPackages[idx], ...updateFields };
    return NextResponse.json({ package: mockTestPackages[idx] });
  }

  try {
    const body = await request.json();
    const { code, name, description, price, testIds } = body;

    const [pkg] = await db
      .update(testPackages)
      .set({
        code: code?.toUpperCase(),
        name,
        description: description || null,
        price: price || "0",
        updatedAt: new Date(),
      })
      .where(eq(testPackages.id, pkgId))
      .returning();

    if (!pkg) return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });

    if (testIds) {
      await db.delete(testPackageItems).where(eq(testPackageItems.packageId, pkg.id));
      await db.insert(testPackageItems).values(
        testIds.map((testId: number) => ({ packageId: pkg.id, testId }))
      );
    }

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

    return NextResponse.json({ package: { ...pkg, items } });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json({ error: "Gagal mengupdate paket" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pkgId = parseInt(id);

  if (!(await isDbAvailable())) {
    const idx = mockTestPackages.findIndex((p) => p.id === pkgId);
    if (idx === -1) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }
    mockTestPackages.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    await db.delete(testPackages).where(eq(testPackages.id, pkgId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus paket" }, { status: 400 });
  }
}
