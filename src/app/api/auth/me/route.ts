import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

export async function GET(request: NextRequest) {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(authHeader.substring(7), JWT_SECRET);
      return NextResponse.json({
        user: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
      });
    } catch {}
  }

  // Check cookie
  const token = request.cookies.get("lis_token")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return NextResponse.json({
        user: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
      });
    } catch {}
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
