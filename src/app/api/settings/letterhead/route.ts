import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { letterheadSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockLetterhead } from "@/lib/mock-data";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    return NextResponse.json({ settings: mockLetterhead });
  }

  try {
    const [settings] = await db.select().from(letterheadSettings).limit(1);
    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error("Get letterhead error:", error);
    return NextResponse.json({ settings: mockLetterhead });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    const body = await request.json();
    const { pemda, hospitalName, hospitalAddress, hospitalEmail, hospitalPhone, logoLeft, logoRight } = body;
    Object.assign(mockLetterhead, {
      pemda: pemda || mockLetterhead.pemda,
      hospitalName: hospitalName || mockLetterhead.hospitalName,
      hospitalAddress: hospitalAddress || mockLetterhead.hospitalAddress,
      hospitalEmail: hospitalEmail || mockLetterhead.hospitalEmail,
      hospitalPhone: hospitalPhone || mockLetterhead.hospitalPhone,
      logoLeft: logoLeft || mockLetterhead.logoLeft,
      logoRight: logoRight || mockLetterhead.logoRight,
    });
    return NextResponse.json({ settings: mockLetterhead });
  }

  try {
    const body = await request.json();
    const { pemda, hospitalName, hospitalAddress, hospitalEmail, hospitalPhone, logoLeft, logoRight } = body;

    const [existing] = await db.select().from(letterheadSettings).limit(1);

    let settings;
    if (existing) {
      [settings] = await db
        .update(letterheadSettings)
        .set({
          pemda: pemda || null,
          hospitalName: hospitalName || null,
          hospitalAddress: hospitalAddress || null,
          hospitalEmail: hospitalEmail || null,
          hospitalPhone: hospitalPhone || null,
          logoLeft: logoLeft || null,
          logoRight: logoRight || null,
          updatedAt: new Date(),
        })
        .where(eq(letterheadSettings.id, existing.id))
        .returning();
    } else {
      [settings] = await db
        .insert(letterheadSettings)
        .values({
          pemda: pemda || null,
          hospitalName: hospitalName || null,
          hospitalAddress: hospitalAddress || null,
          hospitalEmail: hospitalEmail || null,
          hospitalPhone: hospitalPhone || null,
          logoLeft: logoLeft || null,
          logoRight: logoRight || null,
        })
        .returning();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Save letterhead error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
