import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { doctors } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockDoctors } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const search = request.nextUrl.searchParams.get("search") || "";
    let filtered = mockDoctors;
    if (search) {
      const q = search.toLowerCase();
      filtered = mockDoctors.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.specialization && d.specialization.toLowerCase().includes(q))
      );
    }
    return NextResponse.json({ doctors: filtered });
  }

  const search = request.nextUrl.searchParams.get("search") || "";

  try {
    const conditions = search
      ? or(
          ilike(doctors.name, `%${search}%`),
          ilike(doctors.specialization, `%${search}%`)
        )
      : undefined;

    const data = await db
      .select()
      .from(doctors)
      .where(conditions)
      .orderBy(desc(doctors.createdAt));

    return NextResponse.json({ doctors: data });
  } catch (error) {
    console.error("Get doctors error:", error);
    return NextResponse.json({ doctors: mockDoctors });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const newDoctor = {
      id: Math.max(...mockDoctors.map((d) => d.id)) + 1,
      ...body,
      createdAt: new Date(),
    };
    mockDoctors.push(newDoctor);
    return NextResponse.json({ doctor: newDoctor }, { status: 201 });
  }

  try {
    const body = await request.json();
    const [doctor] = await db.insert(doctors).values(body).returning();
    return NextResponse.json({ doctor }, { status: 201 });
  } catch (error) {
    console.error("Create doctor error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data dokter" },
      { status: 500 }
    );
  }
}
