import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMutableMockSubAccounts } from "@/lib/mock-data";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parentId = parseInt(id);

  if (!(await isDbAvailable())) {
    const subAccounts = getMutableMockSubAccounts();
    const filtered = subAccounts.filter((s) => s.parentId === parentId);
    return NextResponse.json({ subAccounts: filtered });
  }

  try {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const result = await db
      .select({
        id: users.id,
        parentId: users.parentId,
        username: users.username,
        name: users.name,
        email: users.email,
        notes: users.masaAktif,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.parentId, parentId));

    return NextResponse.json({ subAccounts: result });
  } catch (error) {
    console.error("Get sub-accounts error:", error);
    const subAccounts = getMutableMockSubAccounts();
    return NextResponse.json({ subAccounts: subAccounts.filter((s) => s.parentId === parentId) });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parentId = parseInt(id);

  try {
    const body = await request.json();
    const { username, password, name, notes } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Username, password, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    if (!(await isDbAvailable())) {
      const subAccounts = getMutableMockSubAccounts();
      const maxId = Math.max(...subAccounts.map((s) => s.id), 100);

      const newSubAccount = {
        id: maxId + 1,
        parentId,
        username,
        name,
        email: `${username}@labklinik.id`,
        password,
        notes: notes || "",
        createdAt: new Date(),
      };

      subAccounts.push(newSubAccount);

      return NextResponse.json({ subAccount: newSubAccount }, { status: 201 });
    }

    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const bcrypt = (await import("bcryptjs")).default;

    const hash = await bcrypt.hash(password, 10);

    const [newSub] = await db.insert(users).values({
      username,
      name,
      email: `${username}@labklinik.id`,
      passwordHash: hash,
      role: "analyst",
      parentId,
      active: true,
    }).returning();

    return NextResponse.json({ subAccount: newSub }, { status: 201 });
  } catch (error) {
    console.error("Create sub-account error:", error);
    return NextResponse.json({ error: "Gagal membuat sub-account" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parentId = parseInt(id);

  try {
    const body = await request.json();
    const { subAccountId, username, password, name, notes } = body;

    if (!subAccountId) {
      return NextResponse.json({ error: "Sub-account ID wajib diisi" }, { status: 400 });
    }

    if (!(await isDbAvailable())) {
      const subAccounts = getMutableMockSubAccounts();
      const idx = subAccounts.findIndex((s) => s.id === subAccountId && s.parentId === parentId);
      if (idx === -1) {
        return NextResponse.json({ error: "Sub-account tidak ditemukan" }, { status: 404 });
      }

      if (username) subAccounts[idx].username = username;
      if (password) subAccounts[idx].password = password;
      if (name) subAccounts[idx].name = name;
      if (notes !== undefined) subAccounts[idx].notes = notes;

      return NextResponse.json({ subAccount: subAccounts[idx] });
    }

    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const bcrypt = (await import("bcryptjs")).default;

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    if (name) updateData.name = name;
    if (notes !== undefined) updateData.masaAktif = notes;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, subAccountId), eq(users.parentId, parentId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Sub-account tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ subAccount: updated });
  } catch (error) {
    console.error("Update sub-account error:", error);
    return NextResponse.json({ error: "Gagal mengupdate sub-account" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parentId = parseInt(id);

  try {
    const body = await request.json();
    const { subAccountId } = body;

    if (!subAccountId) {
      return NextResponse.json({ error: "Sub-account ID wajib diisi" }, { status: 400 });
    }

    if (!(await isDbAvailable())) {
      const subAccounts = getMutableMockSubAccounts();
      const idx = subAccounts.findIndex((s) => s.id === subAccountId && s.parentId === parentId);
      if (idx === -1) {
        return NextResponse.json({ error: "Sub-account tidak ditemukan" }, { status: 404 });
      }
      subAccounts.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [deleted] = await db
      .delete(users)
      .where(and(eq(users.id, subAccountId), eq(users.parentId, parentId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Sub-account tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete sub-account error:", error);
    return NextResponse.json({ error: "Gagal menghapus sub-account" }, { status: 500 });
  }
}
