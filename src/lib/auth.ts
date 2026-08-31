import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lis-lab-secret-key-2024-very-secure"
);

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Try cookie first
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("lis_token")?.value;
    if (cookieToken) {
      const user = await verifyToken(cookieToken);
      if (user) return user;
    }

    // Fallback: check Authorization header
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const headerToken = authHeader.substring(7);
      const user = await verifyToken(headerToken);
      if (user) return user;
    }

    return null;
  } catch {
    return null;
  }
}
