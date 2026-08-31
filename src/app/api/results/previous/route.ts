import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMockOrderItems, mockLabOrders, getMockOrdersByMRN } from "@/lib/mock-data";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mrn = request.nextUrl.searchParams.get("mrn");
  const excludeOrderId = request.nextUrl.searchParams.get("excludeOrderId");

  if (!mrn) {
    return NextResponse.json({ error: "MRN wajib diisi" }, { status: 400 });
  }

  if (!(await isDbAvailable())) {
    let orders = getMockOrdersByMRN(mrn, excludeOrderId ? parseInt(excludeOrderId) : undefined);

    const results = orders.map((order) => {
      const items = getMockOrderItems(order.id).filter(
        (item) => item.result !== null && item.result !== undefined
      );
      return {
        orderNo: order.orderNo,
        orderDate: order.createdAt,
        items: items.map((item) => ({
          testCode: item.testCode,
          testName: item.testName,
          result: item.result,
          unit: item.unit,
          referenceMin: item.referenceMin,
          referenceMax: item.referenceMax,
          flag: item.flag,
        })),
      };
    });

    return NextResponse.json({ previousResults: results });
  }

  try {
    const { db } = await import("@/db");
    const { labOrders, orderItems, testCatalog, patients } = await import("@/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    const patientOrders = await db
      .select({ id: labOrders.id, orderNo: labOrders.orderNo, createdAt: labOrders.createdAt })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .where(
        and(
          eq(patients.medicalRecordNo, mrn),
          excludeOrderId ? sql`${labOrders.id} != ${parseInt(excludeOrderId)}` : undefined
        )
      )
      .orderBy(sql`${labOrders.createdAt} DESC`)
      .limit(5);

    const results = [];
    for (const order of patientOrders) {
      const items = await db
        .select({
          testCode: testCatalog.code,
          testName: testCatalog.name,
          result: orderItems.result,
          unit: orderItems.unit,
          referenceMin: orderItems.referenceMin,
          referenceMax: orderItems.referenceMax,
          flag: orderItems.flag,
        })
        .from(orderItems)
        .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
        .where(
          and(
            eq(orderItems.orderId, order.id),
            sql`${orderItems.result} IS NOT NULL AND ${orderItems.result} != ''`
          )
        );

      results.push({
        orderNo: order.orderNo,
        orderDate: order.createdAt,
        items,
      });
    }

    return NextResponse.json({ previousResults: results });
  } catch (error) {
    console.error("Get previous results error:", error);
    return NextResponse.json({ previousResults: [] });
  }
}
