import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMutableMockUsers, getMutableMockSubAccounts } from "@/lib/mock-data";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search") || "";

  if (!(await isDbAvailable())) {
    const users = await getMutableMockUsers();
    const subAccounts = getMutableMockSubAccounts();

    let filtered = users;
    if (search) {
      const q = search.toLowerCase();
      filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    const result = filtered.map((u) => {
      const subCount = subAccounts.filter((s) => s.parentId === u.id).length;
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        active: u.active,
        approved: u.approved,
        tenantId: u.tenantId,
        parentId: u.parentId,
        masaAktif: u.masaAktif,
        imgAccess: u.imgAccess,
        subAccountCount: subCount,
      };
    });

    return NextResponse.json({ users: result });
  }

  try {
    const { db } = await import("@/db");
    const { users: usersTable } = await import("@/db/schema");
    const { ilike, or, sql } = await import("drizzle-orm");

    const conditions = search
      ? or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.username, `%${search}%`)
        )
      : undefined;

    const data = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        active: usersTable.active,
        approved: usersTable.approved,
        tenantId: usersTable.tenantId,
        parentId: usersTable.parentId,
        masaAktif: usersTable.masaAktif,
        imgAccess: usersTable.imgAccess,
      })
      .from(usersTable)
      .where(conditions);

    const result = data.map((u) => ({
      ...u,
      subAccountCount: 0,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Get users error:", error);
    const users = await getMutableMockUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        active: u.active,
        tenantId: u.tenantId,
        parentId: u.parentId,
        masaAktif: u.masaAktif,
        imgAccess: u.imgAccess,
        subAccountCount: 0,
      })),
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, username, password, role, phone, masaAktif, imgAccess, tenantId } = body;

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Nama, email, username, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (!(await isDbAvailable())) {
      const users = await getMutableMockUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      if (users.find((u) => u.email === normalizedEmail)) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
      }
      if (users.find((u) => u.username === normalizedUsername)) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
      }

      const hash = await bcrypt.hash(password, 10);
      const maxId = Math.max(...users.map((u) => u.id), 0);

      const newUser = {
        id: maxId + 1,
        username: normalizedUsername,
        name,
        email: normalizedEmail,
        passwordHash: hash,
        role: (role || "admin") as "superadmin" | "admin" | "doctor" | "analyst" | "receptionist",
        phone: phone || null,
        active: true,
        approved: true,
        tenantId: tenantId ? parseInt(tenantId) : null,
        parentId: null,
        masaAktif: masaAktif || null,
        imgAccess: imgAccess === true,
      };

      users.push(newUser);

      return NextResponse.json({
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          active: newUser.active,
          tenantId: newUser.tenantId,
          masaAktif: newUser.masaAktif,
          imgAccess: newUser.imgAccess,
        },
      }, { status: 201 });
    }

    const { db } = await import("@/db");
    const { users: usersTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    }
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, normalizedUsername)).limit(1);
    if (existingUsername.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(usersTable).values({
      username: normalizedUsername,
      name,
      email: normalizedEmail,
      passwordHash: hash,
      role: role || "admin",
      phone: phone || null,
      active: true,
      tenantId: tenantId ? parseInt(tenantId) : null,
      masaAktif: masaAktif || null,
      imgAccess: imgAccess === true,
    }).returning();

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
