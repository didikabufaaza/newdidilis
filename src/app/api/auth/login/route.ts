import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable } from "@/db";
import { getMutableMockUsers } from "@/lib/mock-data";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

async function findUserByEmailOrUsername(identifier: string) {
  if (await isDbAvailable()) {
    try {
      const { db } = await import("@/db");
      const { users } = await import("@/db/schema");
      const { eq, or } = await import("drizzle-orm");
      const result = await db.select().from(users).where(
        or(eq(users.email, identifier), eq(users.username, identifier))
      ).limit(1);
      return result[0] || null;
    } catch (err) {
      console.warn("DB query failed, using mock:", err);
    }
  }
  const mockUsers = await getMutableMockUsers();
  return mockUsers.find((u) => u.email === identifier || u.username === identifier) || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email/username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await findUserByEmailOrUsername(email.toLowerCase().trim());

    if (!user) {
      return NextResponse.json(
        { error: "Email/username atau password salah" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Akun Anda tidak aktif" },
        { status: 403 }
      );
    }

    if ("approved" in user && !(user as { approved: boolean }).approved) {
      return NextResponse.json(
        { error: "Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan." },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Email/username atau password salah" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("lis_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
