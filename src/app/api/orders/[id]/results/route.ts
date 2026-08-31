import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { orderItems, labOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { getMockOrderItems, mockLabOrders } from "@/lib/mock-data";

export async function PUT(
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
  const { results } = body as {
    results: Array<{
      itemId: number;
      result: string;
      resultNumeric?: string;
      flag?: string;
      notes?: string;
    }>;
  };

  if (!results || results.length === 0) {
    return NextResponse.json({ error: "Data hasil tidak valid" }, { status: 400 });
  }

  if (!(await isDbAvailable())) {
    const items = getMockOrderItems(orderId);
    for (const r of results) {
      const item = items.find((i) => i.id === r.itemId);
      if (item) {
        item.result = r.result;
        item.resultNumeric = r.resultNumeric || r.result;
        item.flag = r.flag || null;
        item.notes = r.notes || null;
        item.resultStatus = "entered";
        item.enteredAt = new Date();
      }
    }

    const orderIdx = mockLabOrders.findIndex((o) => o.id === orderId);
    if (orderIdx !== -1) {
      mockLabOrders[orderIdx] = {
        ...mockLabOrders[orderIdx],
        status: "in_progress",
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ success: true });
  }

  try {
    for (const r of results) {
      await db
        .update(orderItems)
        .set({
          result: r.result,
          resultNumeric: r.resultNumeric || null,
          flag: r.flag || null,
          notes: r.notes || null,
          resultStatus: "entered",
          enteredBy: user.id,
          enteredAt: new Date(),
        })
        .where(eq(orderItems.id, r.itemId));
    }

    await db
      .update(labOrders)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(labOrders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enter results error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hasil" },
      { status: 500 }
    );
  }
}
