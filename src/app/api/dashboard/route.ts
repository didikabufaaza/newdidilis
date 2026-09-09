import { NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, mockPatients, mockTestCategories, mockTestCatalog, getMockOrderItems, mockTestPackages, mockDoctors, mockLetterhead } from "@/lib/mock-data";

function getMockDashboard(viewAsUserId?: number) {
  let orders = mockLabOrders;
  let patientList = mockPatients;
  if (viewAsUserId) {
    orders = orders.filter((o) => (o as any).createdBy === viewAsUserId);
  }

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
      totalPatients: patientList.length,
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

  const viewAsUserId = user.viewAsUserId;

  if (!(await isDbAvailable())) {
    return NextResponse.json(getMockDashboard(viewAsUserId));
  }

  try {
    const { db } = await import("@/db");
    const { labOrders, patients, orderItems } = await import("@/db/schema");
    const { eq, sql, count, and } = await import("drizzle-orm");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewAsCondition = viewAsUserId ? eq(labOrders.createdBy, viewAsUserId) : undefined;
    const patientViewAsCondition = viewAsUserId ? eq(patients.createdBy, viewAsUserId) : undefined;
    const aggWhere = viewAsUserId ? sql`created_by = ${viewAsUserId}` : sql`TRUE`;

    const [
      totalPatients,
      aggRows,
      statusCountRows,
      recentOrders,
      pendingResults,
    ] = await Promise.all([
      viewAsUserId
        ? db.select({ count: count() }).from(patients).where(patientViewAsCondition)
        : db.select({ count: count() }).from(patients),
      db.execute(sql`
        SELECT
          count(*)::int AS total_orders,
          count(*) FILTER (WHERE created_at >= ${today})::int AS today_orders,
          count(*) FILTER (WHERE status IN ('registered', 'sample_collected'))::int AS pending_orders,
          count(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_orders,
          count(*) FILTER (WHERE status IN ('completed', 'validated', 'reported'))::int AS completed_orders
        FROM lab_orders
        WHERE ${aggWhere}
      `),
      viewAsUserId
        ? db.select({ status: labOrders.status, count: count() }).from(labOrders).where(viewAsCondition).groupBy(labOrders.status)
        : db.select({ status: labOrders.status, count: count() }).from(labOrders).groupBy(labOrders.status),
      db.select({ id: labOrders.id, orderNo: labOrders.orderNo, status: labOrders.status, priority: labOrders.priority, createdAt: labOrders.createdAt, patientName: patients.name, patientMrn: patients.medicalRecordNo })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(viewAsCondition)
        .orderBy(sql`${labOrders.createdAt} DESC`)
        .limit(10),
      viewAsUserId
        ? db.select({ count: count() }).from(orderItems).innerJoin(labOrders, eq(orderItems.orderId, labOrders.id)).where(and(eq(orderItems.resultStatus, "pending"), viewAsCondition))
        : db.select({ count: count() }).from(orderItems).where(eq(orderItems.resultStatus, "pending")),
    ]);

    const agg = aggRows.rows[0];

    return NextResponse.json({
      stats: {
        totalPatients: totalPatients[0].count,
        totalOrders: agg.total_orders,
        todayOrders: agg.today_orders,
        pendingOrders: agg.pending_orders,
        inProgressOrders: agg.in_progress_orders,
        completedOrders: agg.completed_orders,
        pendingResults: pendingResults[0].count,
      },
      statusCounts: statusCountRows.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), {} as Record<string, number>),
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard DB error, using mock:", err);
    return NextResponse.json(getMockDashboard(viewAsUserId));
  }
}
