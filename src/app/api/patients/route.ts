import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { patients, doctors } from "@/db/schema";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockPatients } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const search = request.nextUrl.searchParams.get("search") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    let filtered = mockPatients;
    if (search) {
      const q = search.toLowerCase();
      filtered = mockPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.medicalRecordNo && p.medicalRecordNo.toLowerCase().includes(q)) ||
          (p.noLab && p.noLab.toLowerCase().includes(q)) ||
          (p.noPermintaan && p.noPermintaan.toLowerCase().includes(q)) ||
          (p.phone && p.phone.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      patients: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = search
      ? or(
          ilike(patients.name, `%${search}%`),
          ilike(patients.medicalRecordNo, `%${search}%`),
          ilike(patients.noLab, `%${search}%`),
          ilike(patients.noPermintaan, `%${search}%`),
          ilike(patients.phone, `%${search}%`)
        )
      : undefined;

    const [data, total] = await Promise.all([
      db
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
        .where(conditions)
        .orderBy(desc(patients.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(conditions),
    ]);

    return NextResponse.json({
      patients: data,
      total: total[0].count,
      page,
      totalPages: Math.ceil(total[0].count / limit),
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json({
      patients: mockPatients,
      total: mockPatients.length,
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
    const { name, gender, dateOfBirth, age, phone, email, address, bloodType, insuranceNo, doctorId, room, diagnosis } = body;
    if (!name || !gender || !dateOfBirth) {
      return NextResponse.json(
        { error: "Nama, jenis kelamin, dan tanggal lahir wajib diisi" },
        { status: 400 }
      );
    }
    const currentYear = new Date().getFullYear();
    const nextId = Math.max(...mockPatients.map((p) => p.id)) + 1;
    const padded = String(nextId).padStart(4, "0");
    const newPatient = {
      id: nextId,
      medicalRecordNo: body.medicalRecordNo && body.medicalRecordNo.trim() !== "" ? body.medicalRecordNo.trim() : "RM-" + currentYear + "-" + padded,
      noLab: "LAB-" + currentYear + "-" + padded,
      noPermintaan: "REQ-" + currentYear + "-" + padded,
      name,
      gender,
      dateOfBirth,
      age: age || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      bloodType: bloodType || null,
      insuranceNo: insuranceNo || null,
      doctorId: doctorId ? parseInt(doctorId) : null,
      room: room || null,
      diagnosis: diagnosis || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      doctorName: null,
      doctorSpecialization: null,
    };
    mockPatients.push(newPatient);
    return NextResponse.json({ patient: newPatient }, { status: 201 });
  }

  try {
    const body = await request.json();
    const {
      name,
      gender,
      dateOfBirth,
      age,
      medicalRecordNo: customMrn,
      phone,
      email,
      address,
      bloodType,
      insuranceNo,
      doctorId,
      room,
      diagnosis,
    } = body;

    if (!name || !gender || !dateOfBirth) {
      return NextResponse.json(
        { error: "Nama, jenis kelamin, dan tanggal lahir wajib diisi" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();

    const lastPatient = await db
      .select({ id: patients.id })
      .from(patients)
      .orderBy(desc(patients.id))
      .limit(1);

    const nextId = (lastPatient[0]?.id || 0) + 1;
    const padded = String(nextId).padStart(4, "0");

    const medicalRecordNo =
      customMrn && customMrn.trim() !== ""
        ? customMrn.trim()
        : `RM-${currentYear}-${padded}`;
    const noLab = `LAB-${currentYear}-${padded}`;
    const noPermintaan = `REQ-${currentYear}-${padded}`;

    let calculatedAge = age;
    if (!calculatedAge && dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let years = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        years--;
      }
      calculatedAge = `${years} Tahun`;
    }

    const [patient] = await db
      .insert(patients)
      .values({
        medicalRecordNo,
        noLab,
        noPermintaan,
        name,
        gender,
        dateOfBirth,
        age: calculatedAge || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        bloodType: bloodType || null,
        insuranceNo: insuranceNo || null,
        doctorId: doctorId ? parseInt(doctorId) : null,
        room: room || null,
        diagnosis: diagnosis || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data pasien" },
      { status: 500 }
    );
  }
}
