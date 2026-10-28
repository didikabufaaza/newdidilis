import { NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, orderItems } from "@/db/schema";
import { eq, sql, count, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, mockPatients, getMockOrderItems } from "@/lib/mock-data";

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewAsCondition = viewAsUserId ? eq(labOrders.createdBy, viewAsUserId) : undefined;
    const patientViewAsCondition = viewAsUserId ? eq(patients.createdBy, viewAsUserId) : undefined;
    const aggWhere = viewAsUserId ? sql`created_by = ${viewAsUserId}` : sql`TRUE`;

    // Consolidated 4 parallel queries instead of 5 unoptimized queries
    const [
      totalPatients,
      aggRows,
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
          count(*) FILTER (WHERE status IN ('completed', 'validated', 'reported'))::int AS completed_orders,
          count(*) FILTER (WHERE status = 'registered')::int AS c_registered,
          count(*) FILTER (WHERE status = 'sample_collected')::int AS c_sample_collected,
          count(*) FILTER (WHERE status = 'in_progress')::int AS c_in_progress,
          count(*) FILTER (WHERE status = 'completed')::int AS c_completed,
          count(*) FILTER (WHERE status = 'validated')::int AS c_validated,
          count(*) FILTER (WHERE status = 'reported')::int AS c_reported
        FROM lab_orders
        WHERE ${aggWhere}
      `),
      db.select({
        id: labOrders.id,
        orderNo: labOrders.orderNo,
        status: labOrders.status,
        priority: labOrders.priority,
        createdAt: labOrders.createdAt,
        patientName: patients.name,
        patientMrn: patients.medicalRecordNo,
      })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(viewAsCondition)
        .orderBy(sql`${labOrders.createdAt} DESC`)
        .limit(10),
      viewAsUserId
        ? db.select({ count: count() }).from(orderItems).innerJoin(labOrders, eq(orderItems.orderId, labOrders.id)).where(and(eq(orderItems.resultStatus, "pending"), viewAsCondition))
        : db.select({ count: count() }).from(orderItems).where(eq(orderItems.resultStatus, "pending")),
    ]);

    const agg = aggRows.rows[0] as any;

    const statusCounts: Record<string, number> = {
      registered: Number(agg.c_registered || 0),
      sample_collected: Number(agg.c_sample_collected || 0),
      in_progress: Number(agg.c_in_progress || 0),
      completed: Number(agg.c_completed || 0),
      validated: Number(agg.c_validated || 0),
      reported: Number(agg.c_reported || 0),
    };

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
      statusCounts,
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard DB error, using mock:", err);
    return NextResponse.json(getMockDashboard(viewAsUserId));
  }
}
