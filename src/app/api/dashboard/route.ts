import { NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, mockPatients, mockTestCategories, mockTestCatalog, getMockOrderItems, mockTestPackages, mockDoctors, mockLetterhead } from "@/lib/mock-data";

function getMockDashboard() {
  const orders = mockLabOrders;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;
  const pendingOrders = orders.filter(o => o.status === 'registered' || o.status === 'sample_collected').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'validated' || o.status === 'reported').length;

  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  let pendingResults = 0;
  orders.forEach(o => {
    const items = getMockOrderItems(o.id);
    pendingResults += items.filter(i => i.resultStatus === 'pending').length;
  });

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      priority: o.priority,
      createdAt: o.createdAt,
      patientName: o.patientName,
      patientMrn: o.patientMrn,
    }));

  return {
    stats: {
      totalPatients: mockPatients.length,
      totalOrders: orders.length,
      todayOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      pendingResults,
    },
    statusCounts,
    recentOrders,
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    return NextResponse.json(getMockDashboard());
  }

  try {
    const { db } = await import("@/db");
    const { labOrders, patients, orderItems } = await import("@/db/schema");
    const { eq, sql, count, gte } = await import("drizzle-orm");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      totalOrders,
      todayOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      statusCounts,
      recentOrders,
      pendingResults,
    ] = await Promise.all([
      db.select({ count: count() }).from(patients),
      db.select({ count: count() }).from(labOrders),
      db.select({ count: count() }).from(labOrders).where(gte(labOrders.createdAt, today)),
      db.select({ count: count() }).from(labOrders).where(sql`${labOrders.status} IN ('registered', 'sample_collected')`),
      db.select({ count: count() }).from(labOrders).where(eq(labOrders.status, "in_progress")),
      db.select({ count: count() }).from(labOrders).where(sql`${labOrders.status} IN ('completed', 'validated', 'reported')`),
      db.select({ status: labOrders.status, count: count() }).from(labOrders).groupBy(labOrders.status),
      db.select({ id: labOrders.id, orderNo: labOrders.orderNo, status: labOrders.status, priority: labOrders.priority, createdAt: labOrders.createdAt, patientName: patients.name, patientMrn: patients.medicalRecordNo }).from(labOrders).innerJoin(patients, eq(labOrders.patientId, patients.id)).orderBy(sql`${labOrders.createdAt} DESC`).limit(10),
      db.select({ count: count() }).from(orderItems).where(eq(orderItems.resultStatus, "pending")),
    ]);

    return NextResponse.json({
      stats: {
        totalPatients: totalPatients[0].count,
        totalOrders: totalOrders[0].count,
        todayOrders: todayOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        inProgressOrders: inProgressOrders[0].count,
        completedOrders: completedOrders[0].count,
        pendingResults: pendingResults[0].count,
      },
      statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), {} as Record<string, number>),
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard DB error, using mock:", err);
    return NextResponse.json(getMockDashboard());
  }
}
