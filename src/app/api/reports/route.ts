import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, doctors, orderItems, testCatalog, testCategories } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, ilike, or } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const dateFrom = sp.get("dateFrom") || "";
  const dateTo = sp.get("dateTo") || "";
  const status = sp.get("status") || "";
  const doctorId = sp.get("doctorId") || "";
  const search = sp.get("search") || "";
  const paymentStatus = sp.get("paymentStatus") || "";
  const testId = sp.get("testId") || "";

  if (!(await isDbAvailable())) {
    let filtered = mockLabOrders;
    if (dateFrom) filtered = filtered.filter((o) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter((o) => new Date(o.createdAt) <= new Date(dateTo + "T23:59:59"));
    if (status) filtered = filtered.filter((o) => o.status === status);

    return NextResponse.json({
      summary: {
        totalOrders: filtered.length,
        totalRevenue: filtered.reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0),
        completedOrders: filtered.filter((o) => o.status === "completed" || o.status === "validated" || o.status === "reported").length,
        pendingOrders: filtered.filter((o) => o.status === "registered" || o.status === "in_progress").length,
      },
      topTests: [],
      data: filtered.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        noPermintaan: o.noPermintaan,
        noLab: o.noLab,
        patientName: o.patientName,
        patientMrn: o.patientMrn,
        doctorName: o.doctorName,
        status: o.status,
        priority: o.priority,
        totalPrice: o.totalPrice,
        paymentStatus: "UMUM",
        createdAt: o.createdAt,
        resultDate: o.resultDate,
      })),
    });
  }

  try {
    const conditions = [];

    if (dateFrom) {
      conditions.push(gte(labOrders.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(labOrders.createdAt, new Date(dateTo + "T23:59:59")));
    }
    if (status) {
      conditions.push(eq(labOrders.status, status as "registered" | "sample_collected" | "in_progress" | "completed" | "validated" | "reported"));
    }
    if (doctorId) {
      conditions.push(eq(labOrders.doctorId, parseInt(doctorId)));
    }
    if (search) {
      conditions.push(
        or(
          ilike(labOrders.orderNo, `%${search}%`),
          ilike(labOrders.noPermintaan, `%${search}%`),
          ilike(patients.name, `%${search}%`),
          ilike(patients.medicalRecordNo, `%${search}%`)
        )
      );
    }
    if (paymentStatus) {
      conditions.push(eq(patients.paymentStatus, paymentStatus));
    }
    if (testId) {
      const orderIdsWithTest = db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(eq(orderItems.testId, parseInt(testId)));
      conditions.push(sql`${labOrders.id} IN (SELECT order_id FROM order_items WHERE test_id = ${parseInt(testId)})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult, revenueResult, statusCounts, topTests] = await Promise.all([
      db
        .select({
          id: labOrders.id,
          orderNo: labOrders.orderNo,
          noPermintaan: labOrders.noPermintaan,
          noLab: labOrders.noLab,
          patientName: patients.name,
          patientMrn: patients.medicalRecordNo,
          paymentStatus: patients.paymentStatus,
          doctorName: doctors.name,
          status: labOrders.status,
          priority: labOrders.priority,
          totalPrice: labOrders.totalPrice,
          createdAt: labOrders.createdAt,
          resultDate: labOrders.resultDate,
        })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(doctors, eq(labOrders.doctorId, doctors.id))
        .where(whereClause)
        .orderBy(desc(labOrders.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(whereClause),
      db
        .select({ total: sql<string>`coalesce(sum(${labOrders.totalPrice}::numeric), 0)` })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(whereClause),
      db
        .select({
          status: labOrders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(whereClause)
        .groupBy(labOrders.status),
      db
        .select({
          testName: testCatalog.name,
          testCode: testCatalog.code,
          count: sql<number>`count(*)::int`,
        })
        .from(orderItems)
        .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
        .innerJoin(labOrders, eq(orderItems.orderId, labOrders.id))
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(whereClause)
        .groupBy(testCatalog.name, testCatalog.code)
        .orderBy(desc(sql<number>`count(*)::int`))
        .limit(5),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => (statusMap[s.status] = s.count));

    return NextResponse.json({
      summary: {
        totalOrders: countResult[0]?.count || 0,
        totalRevenue: parseFloat(String(revenueResult[0]?.total || "0")),
        completedOrders: (statusMap["completed"] || 0) + (statusMap["validated"] || 0) + (statusMap["reported"] || 0),
        pendingOrders: (statusMap["registered"] || 0) + (statusMap["in_progress"] || 0) + (statusMap["sample_collected"] || 0),
      },
      topTests,
      data: data.map((d) => ({
        ...d,
        paymentStatus: d.paymentStatus || "UMUM",
        createdAt: d.createdAt?.toISOString(),
        resultDate: d.resultDate?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Gagal mengambil data laporan" }, { status: 500 });
  }
}
