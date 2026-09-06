import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { resolveAnalysisAccess } from "@/lib/analysis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

async function buildUser(payload: { id: number; name: string; email: string; role: string }) {
  const { canAnalyze, imgAccess } = await resolveAnalysisAccess({
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  });
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    imgAccess,
    canAnalyze,
  };
}

export async function GET(request: NextRequest) {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(authHeader.substring(7), JWT_SECRET);
      return NextResponse.json({
        user: await buildUser(payload as never),
      });
    } catch {}
  }

  // Check cookie
  const token = request.cookies.get("lis_token")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return NextResponse.json({
        user: await buildUser(payload as never),
      });
    } catch {}
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
