import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, doctors, orderItems, testCatalog, testCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, getMockOrderItems } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);

  if (!(await isDbAvailable())) {
    const order = mockLabOrders.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }
    const items = getMockOrderItems(orderId);
    return NextResponse.json({ order, items });
  }

  try {
    const [order] = await db
      .select({
        id: labOrders.id,
        orderNo: labOrders.orderNo,
        noPermintaan: labOrders.noPermintaan,
        noLab: labOrders.noLab,
        room: labOrders.room,
        age: labOrders.age,
        status: labOrders.status,
        priority: labOrders.priority,
        clinicalNotes: labOrders.clinicalNotes,
        diagnosis: labOrders.diagnosis,
        totalPrice: labOrders.totalPrice,
        requestDate: labOrders.requestDate,
        resultDate: labOrders.resultDate,
        createdAt: labOrders.createdAt,
        updatedAt: labOrders.updatedAt,
        collectedAt: labOrders.collectedAt,
        completedAt: labOrders.completedAt,
        validatedAt: labOrders.validatedAt,
        patientId: patients.id,
        patientName: patients.name,
        patientMrn: patients.medicalRecordNo,
        patientGender: patients.gender,
        patientDob: patients.dateOfBirth,
        patientPhone: patients.phone,
        patientBloodType: patients.bloodType,
        patientAge: patients.age,
        patientRoom: patients.room,
        doctorId: doctors.id,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        doctorHospital: doctors.hospital,
      })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .leftJoin(doctors, eq(labOrders.doctorId, doctors.id))
      .where(eq(labOrders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const items = await db
      .select({
        id: orderItems.id,
        testId: orderItems.testId,
        testCode: testCatalog.code,
        testName: testCatalog.name,
        categoryName: testCategories.name,
        result: orderItems.result,
        resultNumeric: orderItems.resultNumeric,
        resultStatus: orderItems.resultStatus,
        unit: orderItems.unit,
        referenceMin: orderItems.referenceMin,
        referenceMax: orderItems.referenceMax,
        referenceText: orderItems.referenceText,
        flag: orderItems.flag,
        notes: orderItems.notes,
        enteredAt: orderItems.enteredAt,
        validatedAt: orderItems.validatedAt,
      })
      .from(orderItems)
      .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
      .leftJoin(testCategories, eq(testCatalog.categoryId, testCategories.id))
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order, items });
  } catch (error) {
    console.error("Get order error:", error);
    const order = mockLabOrders.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }
    const items = getMockOrderItems(orderId);
    return NextResponse.json({ order, items });
  }
}

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

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const idx = mockLabOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.clinicalNotes !== undefined) updateData.clinicalNotes = body.clinicalNotes;
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis;
    if (body.room !== undefined) updateData.room = body.room;
    if (body.age !== undefined) updateData.age = body.age;

    const now = new Date();
    if (body.status === "sample_collected") {
      updateData.collectedAt = now;
    } else if (body.status === "completed") {
      updateData.completedAt = now;
      updateData.resultDate = now;
    } else if (body.status === "validated" || body.status === "reported") {
      updateData.validatedAt = now;
      updateData.resultDate = now;
    }

    mockLabOrders[idx] = { ...mockLabOrders[idx], ...updateData };
    return NextResponse.json({ order: mockLabOrders[idx] });
  }

  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.clinicalNotes !== undefined) updateData.clinicalNotes = body.clinicalNotes;
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis;
    if (body.room !== undefined) updateData.room = body.room;
    if (body.age !== undefined) updateData.age = body.age;

    const now = new Date();
    if (body.status === "sample_collected") {
      updateData.collectedAt = now;
    } else if (body.status === "completed") {
      updateData.completedAt = now;
      updateData.resultDate = now;
    } else if (body.status === "validated" || body.status === "reported") {
      updateData.validatedAt = now;
      updateData.resultDate = now;
      updateData.validatedBy = user.id;
    }

    const [order] = await db
      .update(labOrders)
      .set(updateData)
      .where(eq(labOrders.id, parseInt(id)))
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);

  if (!(await isDbAvailable())) {
    const idx = mockLabOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }
    mockLabOrders.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    await db.delete(labOrders).where(eq(labOrders.id, orderId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus order" },
      { status: 500 }
    );
  }
}
