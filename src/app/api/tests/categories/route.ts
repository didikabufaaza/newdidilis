import { NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { testCategories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { mockTestCategories } from "@/lib/mock-data";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDbAvailable())) {
    return NextResponse.json({ categories: mockTestCategories });
  }

  try {
    const categories = await db
      .select()
      .from(testCategories)
      .orderBy(asc(testCategories.sortOrder));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get test categories error:", error);
    return NextResponse.json({ categories: mockTestCategories });
  }
}
