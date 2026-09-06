import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { patients, labOrders, doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockPatients, mockLabOrders } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await isDbAvailable())) {
    const patient = mockPatients.find((p) => p.id === parseInt(id));
    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ patient });
  }

  try {
    const [patient] = await db
      .select({
        id: patients.id,
        medicalRecordNo: patients.medicalRecordNo,
        noLab: patients.noLab,
        noPermintaan: patients.noPermintaan,
        name: patients.name,
        gender: patients.gender,
        dateOfBirth: patients.dateOfBirth,
        age: patients.age,
        phone: patients.phone,
        email: patients.email,
        address: patients.address,
        bloodType: patients.bloodType,
        insuranceNo: patients.insuranceNo,
        doctorId: patients.doctorId,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        room: patients.room,
        diagnosis: patients.diagnosis,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt,
      })
      .from(patients)
      .leftJoin(doctors, eq(patients.doctorId, doctors.id))
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Get patient error:", error);
    const patient = mockPatients.find((p) => p.id === parseInt(id));
    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ patient });
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

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const idx = mockPatients.findIndex((p) => p.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.medicalRecordNo !== undefined) updateData.medicalRecordNo = body.medicalRecordNo;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType || null;
    if (body.insuranceNo !== undefined) updateData.insuranceNo = body.insuranceNo || null;
    if (body.doctorId !== undefined) updateData.doctorId = body.doctorId ? parseInt(body.doctorId) : null;
    if (body.room !== undefined) updateData.room = body.room || null;
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis || null;
    mockPatients[idx] = { ...mockPatients[idx], ...updateData };

    const pat = mockPatients[idx];
    for (const o of mockLabOrders) {
      if (o.patientId === parseInt(id)) {
        o.patientName = pat.name;
        o.patientMrn = pat.medicalRecordNo;
        o.patientGender = pat.gender;
        o.patientDob = pat.dateOfBirth;
        o.patientBloodType = pat.bloodType;
        o.patientPhone = pat.phone;
        o.patientAge = pat.age;
        o.patientRoom = pat.room;
        if (body.room !== undefined) o.room = body.room || null;
        if (body.age !== undefined) o.age = body.age;
        if (body.diagnosis !== undefined) o.diagnosis = body.diagnosis || null;
        if (body.doctorId !== undefined) {
          o.doctorId = body.doctorId ? parseInt(body.doctorId) : null;
          o.doctorName = pat.doctorName;
          o.doctorSpecialization = pat.doctorSpecialization;
        }
        o.updatedAt = new Date();
      }
    }

    return NextResponse.json({ patient: mockPatients[idx] });
  }

  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.medicalRecordNo !== undefined) updateData.medicalRecordNo = body.medicalRecordNo;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType || null;
    if (body.insuranceNo !== undefined) updateData.insuranceNo = body.insuranceNo || null;
    if (body.doctorId !== undefined) updateData.doctorId = body.doctorId ? parseInt(body.doctorId) : null;
    if (body.room !== undefined) updateData.room = body.room || null;
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis || null;

    const [patient] = await db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, parseInt(id)))
      .returning();

    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }

    const orderSync: Record<string, unknown> = { updatedAt: new Date() };
    if (body.age !== undefined) orderSync.age = body.age;
    if (body.room !== undefined) orderSync.room = body.room || null;
    if (body.diagnosis !== undefined) orderSync.diagnosis = body.diagnosis || null;
    if (body.doctorId !== undefined) orderSync.doctorId = body.doctorId ? parseInt(body.doctorId) : null;
    if (Object.keys(orderSync).length > 1) {
      await db.update(labOrders).set(orderSync).where(eq(labOrders.patientId, parseInt(id)));
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Update patient error:", error);
    const idx = mockPatients.findIndex((p) => p.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ patient: mockPatients[idx] });
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

  if (!(await isDbAvailable())) {
    const idx = mockPatients.findIndex((p) => p.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });
    }
    mockPatients.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    await db.delete(patients).where(eq(patients.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete patient error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pasien. Mungkin masih ada data order terkait." },
      { status: 400 }
    );
  }
}
