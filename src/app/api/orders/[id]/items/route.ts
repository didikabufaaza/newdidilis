import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, orderItems, testCatalog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const { testIds } = body as { testIds: number[] };
    if (!testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal satu pemeriksaan" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, addedCount: testIds.length });
  }

  try {
    const body = await request.json();
    const { testIds } = body as { testIds: number[] };

    if (!testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal satu pemeriksaan" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select()
      .from(labOrders)
      .where(eq(labOrders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const existingItems = await db
      .select({ testId: orderItems.testId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const existingTestIds = new Set(existingItems.map((i) => i.testId));

    const newTestIds = testIds.filter((tid: number) => !existingTestIds.has(tid));

    if (newTestIds.length === 0) {
      return NextResponse.json(
        { error: "Pemeriksaan sudah ada di order ini" },
        { status: 400 }
      );
    }

    const tests = await db
      .select()
      .from(testCatalog)
      .where(sql`${testCatalog.id} IN (${sql.join(newTestIds.map((id: number) => sql`${id}`), sql`, `)})`);

    tests.sort((a, b) => newTestIds.indexOf(a.id) - newTestIds.indexOf(b.id));

    const items = tests.map((t) => ({
      orderId,
      testId: t.id,
      resultStatus: "pending" as const,
      unit: t.unit,
      referenceMin: t.referenceMin,
      referenceMax: t.referenceMax,
      referenceText: t.referenceText,
    }));

    await db.insert(orderItems).values(items);

    const allItems = await db
      .select({ testId: orderItems.testId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const allTestIds = allItems.map((i) => i.testId);
    const allTests = await db
      .select({ price: testCatalog.price })
      .from(testCatalog)
      .where(sql`${testCatalog.id} IN (${sql.join(allTestIds.map((id) => sql`${id}`), sql`, `)})`);

    const totalPrice = allTests.reduce(
      (sum, t) => sum + parseFloat(t.price || "0"),
      0
    );

    await db
      .update(labOrders)
      .set({
        totalPrice: totalPrice.toString(),
        updatedAt: new Date(),
      })
      .where(eq(labOrders.id, orderId));

    return NextResponse.json({ success: true, addedCount: newTestIds.length });
  } catch (error) {
    console.error("Add items error:", error);
    return NextResponse.json(
      { error: "Gagal menambah pemeriksaan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);
  const body = await request.json();
  const { itemId } = body as { itemId: number };

  if (!itemId) {
    return NextResponse.json({ error: "itemId wajib diisi" }, { status: 400 });
  }

  if (!(await isDbAvailable())) {
    return NextResponse.json({ success: true });
  }

  try {
    const [deleted] = await db
      .delete(orderItems)
      .where(eq(orderItems.id, itemId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    const remaining = await db
      .select({ testId: orderItems.testId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (remaining.length > 0) {
      const testIds = remaining.map((i) => i.testId);
      const prices = await db
        .select({ price: testCatalog.price })
        .from(testCatalog)
        .where(sql`${testCatalog.id} IN (${sql.join(testIds.map((id) => sql`${id}`), sql`, `)})`);
      const totalPrice = prices.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      await db
        .update(labOrders)
        .set({ totalPrice: totalPrice.toString(), updatedAt: new Date() })
        .where(eq(labOrders.id, orderId));
    } else {
      await db
        .update(labOrders)
        .set({ totalPrice: "0", updatedAt: new Date() })
        .where(eq(labOrders.id, orderId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item" },
      { status: 500 }
    );
  }
}
