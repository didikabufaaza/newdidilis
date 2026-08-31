import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { labOrders, patients, doctors, orderItems, testCatalog } from "@/db/schema";
import { eq, ilike, or, sql, desc, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLabOrders, mockPatients, mockTestCatalog, addMockOrderItem } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const search = request.nextUrl.searchParams.get("search") || "";
    const status = request.nextUrl.searchParams.get("status") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    let filtered = mockLabOrders;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          (o.noPermintaan && o.noPermintaan.toLowerCase().includes(q)) ||
          o.patientName.toLowerCase().includes(q) ||
          o.patientMrn.toLowerCase().includes(q)
      );
    }
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      orders: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const status = request.nextUrl.searchParams.get("status") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
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
    if (status) {
      conditions.push(
        eq(
          labOrders.status,
          status as
            | "registered"
            | "sample_collected"
            | "in_progress"
            | "completed"
            | "validated"
            | "reported"
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, total] = await Promise.all([
      db
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
          patientId: patients.id,
          patientName: patients.name,
          patientMrn: patients.medicalRecordNo,
          patientGender: patients.gender,
          patientDob: patients.dateOfBirth,
          doctorId: doctors.id,
          doctorName: doctors.name,
          doctorSpecialization: doctors.specialization,
        })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(doctors, eq(labOrders.doctorId, doctors.id))
        .where(whereClause)
        .orderBy(desc(labOrders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(labOrders)
        .innerJoin(patients, eq(labOrders.patientId, patients.id))
        .where(whereClause),
    ]);

    return NextResponse.json({
      orders: data,
      total: total[0].count,
      page,
      totalPages: Math.ceil(total[0].count / limit),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({
      orders: mockLabOrders,
      total: mockLabOrders.length,
      page: 1,
      totalPages: 1,
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const { patientId, doctorId, priority, clinicalNotes, diagnosis, room, age, testIds } = body;
    if (!patientId || !testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: "Pasien dan minimal satu pemeriksaan wajib dipilih" },
        { status: 400 }
      );
    }
    const patient = mockPatients.find((p) => p.id === patientId);
    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    const currentYear = new Date().getFullYear();
    const nextId = Math.max(...mockLabOrders.map((o) => o.id)) + 1;
    const orderNo = "LAB-" + currentYear + "-" + String(nextId).padStart(4, "0");
    const newOrder = {
      id: nextId,
      orderNo,
      noPermintaan: patient.noPermintaan || "REQ-" + currentYear + "-" + String(nextId).padStart(4, "0"),
      noLab: patient.noLab || orderNo,
      patientId,
      patientName: patient.name,
      patientMrn: patient.medicalRecordNo,
      patientGender: patient.gender,
      patientDob: patient.dateOfBirth,
      patientPhone: patient.phone,
      patientBloodType: patient.bloodType,
      patientAge: patient.age,
      patientRoom: patient.room,
      doctorId: doctorId || patient.doctorId || null,
      doctorName: patient.doctorName,
      doctorSpecialization: patient.doctorSpecialization,
      doctorHospital: null,
      room: room || patient.room || null,
      age: age || patient.age || null,
      status: "registered",
      priority: priority || "normal",
      clinicalNotes: clinicalNotes || null,
      diagnosis: diagnosis || patient.diagnosis || null,
      totalPrice: "0",
      requestDate: new Date(),
      resultDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      collectedAt: null,
      completedAt: null,
      validatedAt: null,
    };
    mockLabOrders.push(newOrder);

    for (const testId of testIds) {
      const test = mockTestCatalog.find((t) => t.id === testId);
      if (test) {
        addMockOrderItem(nextId, test.id, test.code, test.name, test.categoryName, test.unit, test.referenceMin, test.referenceMax, test.referenceText);
      }
    }

    return NextResponse.json({ order: newOrder }, { status: 201 });
  }

  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      priority,
      clinicalNotes,
      diagnosis,
      room,
      age,
      testIds,
    } = body;

    if (!patientId || !testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: "Pasien dan minimal satu pemeriksaan wajib dipilih" },
        { status: 400 }
      );
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();

    const lastOrder = await db
      .select({ id: labOrders.id })
      .from(labOrders)
      .orderBy(desc(labOrders.id))
      .limit(1);

    const nextId = (lastOrder[0]?.id || 0) + 1;
    const orderNo = `LAB-${currentYear}-${String(nextId).padStart(4, "0")}`;
    const noPermintaan = patient.noPermintaan || `REQ-${currentYear}-${String(nextId).padStart(4, "0")}`;
    const noLab = patient.noLab || orderNo;

    const tests = await db
      .select()
      .from(testCatalog)
      .where(
        sql`${testCatalog.id} IN (${sql.join(
          testIds.map((id: number) => sql`${id}`),
          sql`, `
        )})`
      );

    const totalPrice = tests.reduce(
      (sum, t) => sum + parseFloat(t.price || "0"),
      0
    );

    const now = new Date();

    const [order] = await db
      .insert(labOrders)
      .values({
        orderNo,
        noPermintaan,
        noLab,
        patientId,
        doctorId: doctorId || patient.doctorId || null,
        room: room || patient.room || null,
        age: age || patient.age || null,
        status: "registered",
        priority: priority || "normal",
        clinicalNotes: clinicalNotes || null,
        diagnosis: diagnosis || patient.diagnosis || null,
        totalPrice: totalPrice.toString(),
        requestDate: now,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const items = tests.map((t) => ({
      orderId: order.id,
      testId: t.id,
      resultStatus: "pending" as const,
      unit: t.unit,
      referenceMin: t.referenceMin,
      referenceMax: t.referenceMax,
      referenceText: t.referenceText,
    }));

    await db.insert(orderItems).values(items);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Gagal membuat order" },
      { status: 500 }
    );
  }
}
