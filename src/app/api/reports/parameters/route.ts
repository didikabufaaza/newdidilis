import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, doctors, orderItems, testCatalog, testCategories } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, ilike, or } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, getMockOrderItems } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewAsUserId = user.viewAsUserId;
  const sp = request.nextUrl.searchParams;
  const dateFrom = sp.get("dateFrom") || "";
  const dateTo = sp.get("dateTo") || "";
  const categoryId = sp.get("categoryId") || "";
  const testId = sp.get("testId") || "";
  const search = sp.get("search") || "";
  const resultStatus = sp.get("resultStatus") || "";

  if (!(await isDbAvailable())) {
    let filtered = mockLabOrders;
    if (viewAsUserId) {
      filtered = filtered.filter((o) => (o as any).createdBy === viewAsUserId);
    }
    if (dateFrom) filtered = filtered.filter((o) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter((o) => new Date(o.createdAt) <= new Date(dateTo + "T23:59:59"));

    const rows: any[] = [];
    for (const order of filtered) {
      const items = getMockOrderItems(order.id);
      for (const item of items) {
        rows.push({
          id: item.id,
          orderNo: order.orderNo,
          noLab: order.noLab,
          orderDate: order.createdAt,
          patientName: order.patientName,
          patientMrn: order.patientMrn,
          doctorName: order.doctorName,
          testCode: item.testCode,
          testName: item.testName,
          categoryName: item.categoryName,
          result: item.result,
          resultNumeric: item.resultNumeric,
          unit: item.unit,
          referenceMin: item.referenceMin,
          referenceMax: item.referenceMax,
          referenceText: item.referenceText,
          flag: item.flag,
          resultStatus: item.resultStatus,
        });
      }
    }

    return NextResponse.json({ data: rows, total: rows.length });
  }

  try {
    const conditions = [];

    if (viewAsUserId) {
      conditions.push(eq(labOrders.createdBy, viewAsUserId));
    }
    if (dateFrom) {
      conditions.push(gte(labOrders.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(labOrders.createdAt, new Date(dateTo + "T23:59:59")));
    }
    if (categoryId) {
      conditions.push(eq(testCatalog.categoryId, parseInt(categoryId)));
    }
    if (testId) {
      conditions.push(eq(orderItems.testId, parseInt(testId)));
    }
    if (search) {
      conditions.push(
        or(
          ilike(labOrders.orderNo, `%${search}%`),
          ilike(patients.name, `%${search}%`),
          ilike(patients.medicalRecordNo, `%${search}%`),
          ilike(testCatalog.name, `%${search}%`)
        )
      );
    }
    if (resultStatus) {
      conditions.push(eq(orderItems.resultStatus, resultStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: orderItems.id,
        orderNo: labOrders.orderNo,
        noLab: labOrders.noLab,
        orderDate: labOrders.createdAt,
        patientName: patients.name,
        patientMrn: patients.medicalRecordNo,
        doctorName: doctors.name,
        testCode: testCatalog.code,
        testName: testCatalog.name,
        categoryName: testCategories.name,
        result: orderItems.result,
        resultNumeric: orderItems.resultNumeric,
        unit: orderItems.unit,
        referenceMin: orderItems.referenceMin,
        referenceMax: orderItems.referenceMax,
        referenceText: orderItems.referenceText,
        flag: orderItems.flag,
        resultStatus: orderItems.resultStatus,
      })
      .from(orderItems)
      .innerJoin(labOrders, eq(orderItems.orderId, labOrders.id))
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
      .leftJoin(testCategories, eq(testCatalog.categoryId, testCategories.id))
      .leftJoin(doctors, eq(labOrders.doctorId, doctors.id))
      .where(whereClause)
      .orderBy(desc(labOrders.createdAt), desc(testCatalog.name));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Parameter reports error:", error);
    return NextResponse.json({ error: "Gagal mengambil data laporan parameter" }, { status: 500 });
  }
}
