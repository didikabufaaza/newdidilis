import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMutableMockUsers } from "@/lib/mock-data";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, username, password, phone } = body;

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Nama, email, username, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (!(await isDbAvailable())) {
      const users = await getMutableMockUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      if (users.find((u) => u.email === normalizedEmail)) {
        return NextResponse.json(
          { error: "Email sudah digunakan" },
          { status: 409 }
        );
      }

      if (users.find((u) => u.username === normalizedUsername)) {
        return NextResponse.json(
          { error: "Username sudah digunakan" },
          { status: 409 }
        );
      }

      const hash = await bcrypt.hash(password, 10);
      const maxId = Math.max(...users.map((u) => u.id), 0);
      const maxTenantId = Math.max(...users.filter((u) => u.tenantId !== null).map((u) => u.tenantId as number), 0);

      const newUser = {
        id: maxId + 1,
        username: normalizedUsername,
        name,
        email: normalizedEmail,
        passwordHash: hash,
        role: "admin" as const,
        phone: phone || null,
        active: true,
        approved: false,
        tenantId: maxTenantId + 1,
        parentId: null,
        masaAktif: null,
        imgAccess: false,
      };

      users.push(newUser);

      return NextResponse.json({
        success: true,
        message: "Registrasi berhasil. Silakan tunggu persetujuan admin.",
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
        },
      }, { status: 201 });
    }

    // DB mode
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingEmail = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, normalizedUsername)).limit(1);
    if (existingUsername.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      username: normalizedUsername,
      name,
      email: normalizedEmail,
      passwordHash: hash,
      role: "admin",
      phone: phone || null,
      active: true,
      imgAccess: false,
    }).returning();

    const token = await new SignJWT({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });

    response.cookies.set("lis_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
