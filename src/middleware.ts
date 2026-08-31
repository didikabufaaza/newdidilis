import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

async function verifyAuth(request: NextRequest): Promise<boolean> {
  // Check cookie
  const cookieToken = request.cookies.get("lis_token")?.value;
  if (cookieToken) {
    try {
      await jwtVerify(cookieToken, JWT_SECRET);
      return true;
    } catch {}
  }

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      await jwtVerify(authHeader.substring(7), JWT_SECRET);
      return true;
    } catch {}
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes (pages are handled client-side)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip auth for API auth routes and health
  if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
    return NextResponse.next();
  }

  // Protect all other API routes
  const isAuthenticated = await verifyAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
