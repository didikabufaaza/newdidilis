import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMutableMockUsers } from "@/lib/mock-data";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (!(await isDbAvailable())) {
    const users = await getMutableMockUsers();
    const found = users.find((u) => u.id === userId);
    if (!found) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({
      user: {
        id: found.id,
        username: found.username,
        name: found.name,
        email: found.email,
        role: found.role,
        phone: found.phone,
        active: found.active,
        approved: found.approved,
        tenantId: found.tenantId,
        parentId: found.parentId,
        masaAktif: found.masaAktif,
        imgAccess: found.imgAccess,
      },
    });
  }

  try {
    const { db } = await import("@/db");
    const { users: usersTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const result = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        active: usersTable.active,
        tenantId: usersTable.tenantId,
        parentId: usersTable.parentId,
        masaAktif: usersTable.masaAktif,
        imgAccess: usersTable.imgAccess,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
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
  const userId = parseInt(id);

  try {
    const body = await request.json();
    const { name, email, username, password, role, phone, active, approved, masaAktif, imgAccess, tenantId } = body;

    if (!(await isDbAvailable())) {
      const users = await getMutableMockUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }

      const normalizedEmail = email ? email.toLowerCase().trim() : users[idx].email;
      const normalizedUsername = username ? username.toLowerCase().trim() : users[idx].username;

      if (email && email !== users[idx].email) {
        if (users.find((u) => u.email === normalizedEmail && u.id !== userId)) {
          return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
        }
      }
      if (username && username !== users[idx].username) {
        if (users.find((u) => u.username === normalizedUsername && u.id !== userId)) {
          return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
        }
      }

      if (name) users[idx].name = name;
      if (email) users[idx].email = normalizedEmail;
      if (username) users[idx].username = normalizedUsername;
      if (role) users[idx].role = role;
      if (phone !== undefined) users[idx].phone = phone || null;
      if (active !== undefined) users[idx].active = active;
      if (approved !== undefined) users[idx].approved = approved;
      if (masaAktif !== undefined) users[idx].masaAktif = masaAktif || null;
      if (imgAccess !== undefined) users[idx].imgAccess = imgAccess;
      if (tenantId !== undefined) users[idx].tenantId = tenantId ? parseInt(tenantId) : null;
      if (password) users[idx].passwordHash = await bcrypt.hash(password, 10);

      return NextResponse.json({
        user: {
          id: users[idx].id,
          username: users[idx].username,
          name: users[idx].name,
          email: users[idx].email,
          role: users[idx].role,
          phone: users[idx].phone,
          active: users[idx].active,
          approved: users[idx].approved,
          tenantId: users[idx].tenantId,
          masaAktif: users[idx].masaAktif,
          imgAccess: users[idx].imgAccess,
        },
      });
    }

    const { db } = await import("@/db");
    const { users: usersTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (username) updateData.username = username.toLowerCase().trim();
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone || null;
    if (active !== undefined) updateData.active = active;
    if (approved !== undefined) updateData.approved = approved;
    if (masaAktif !== undefined) updateData.masaAktif = masaAktif || null;
    if (imgAccess !== undefined) updateData.imgAccess = imgAccess;
    if (tenantId !== undefined) updateData.tenantId = tenantId ? parseInt(tenantId) : null;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Gagal mengupdate user" }, { status: 500 });
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
  const userId = parseInt(id);

  if (!(await isDbAvailable())) {
    const users = await getMutableMockUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    users.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    const { db } = await import("@/db");
    const { users: usersTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
