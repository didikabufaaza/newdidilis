import { isDbAvailable } from "@/db";
import { getMutableMockUsers } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth";

export function hasAnalysisAccess(role: string, imgAccess?: boolean): boolean {
  return role === "superadmin" || role === "admin" || imgAccess === true;
}

export async function resolveAnalysisAccess(
  user: AuthUser
): Promise<{
  canAnalyze: boolean;
  imgAccess: boolean;
}> {
  let imgAccess = false;

  try {
    if (await isDbAvailable()) {
      const { db } = await import("@/db");
      const { users } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const [found] = await db
        .select({ imgAccess: users.imgAccess })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      imgAccess = !!found?.imgAccess;
    } else {
      const mockUsers = await getMutableMockUsers();
      const found = mockUsers.find((u) => u.id === user.id);
      imgAccess = !!found?.imgAccess;
    }
  } catch {
    imgAccess = false;
  }

  return {
    canAnalyze: hasAnalysisAccess(user.role, imgAccess),
    imgAccess,
  };
}
