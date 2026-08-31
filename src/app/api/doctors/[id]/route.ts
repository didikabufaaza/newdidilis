import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockDoctors } from "@/lib/mock-data";

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
    const idx = mockDoctors.findIndex((d) => d.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Dokter tidak ditemukan" }, { status: 404 });
    }
    mockDoctors[idx] = { ...mockDoctors[idx], ...body };
    return NextResponse.json({ doctor: mockDoctors[idx] });
  }

  try {
    const body = await request.json();
    const [doctor] = await db
      .update(doctors)
      .set(body)
      .where(eq(doctors.id, parseInt(id)))
      .returning();

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error("Update doctor error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate dokter" },
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

  if (!(await isDbAvailable())) {
    const idx = mockDoctors.findIndex((d) => d.id === parseInt(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Dokter tidak ditemukan" }, { status: 404 });
    }
    mockDoctors.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    await db.delete(doctors).where(eq(doctors.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete doctor error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus dokter" },
      { status: 500 }
    );
  }
}
