import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { orderItems, labOrders, patients, testCatalog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { getMockOrderItems, mockLabOrders } from "@/lib/mock-data";
import { normalizeCreatinineMgDl, parseAgeYears, computeEgfrCkdEpi2021, isCreatinineTestCode, isEgfrTestCode, EGFREPIReferenceMin } from "@/lib/egfr";

function recomputeMockEgfr(orderId: number) {
  const items = getMockOrderItems(orderId);
  const creatinineItem = items.find((i) => isCreatinineTestCode(i.testCode));
  const egfrItem = items.find((i) => isEgfrTestCode(i.testCode));
  if (!creatinineItem || !egfrItem) return;

  const order = mockLabOrders.find((o) => o.id === orderId);
  const creatMgDl = normalizeCreatinineMgDl(creatinineItem.resultNumeric ?? creatinineItem.result, creatinineItem.unit);
  const ageYears = parseAgeYears(order?.age) ?? parseAgeYears(order?.patientAge);
  const isFemale = order?.patientGender === "female";
  if (creatMgDl === null || ageYears === null) return;

  const egfr = computeEgfrCkdEpi2021(creatMgDl, ageYears, isFemale);
  if (egfr === null) return;

  egfrItem.result = String(egfr);
  egfrItem.resultNumeric = String(egfr);
  egfrItem.resultStatus = "entered";
  egfrItem.flag = egfr < parseInt(EGFREPIReferenceMin, 10) ? "L" : null;
  egfrItem.notes = "Dihitung otomatis dengan persamaan CKD-EPI 2021";
  egfrItem.enteredAt = new Date();
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);
  const body = await request.json();
  const { results } = body as {
    results: Array<{
      itemId: number;
      result: string;
      resultNumeric?: string;
      flag?: string;
      notes?: string;
    }>;
  };

  if (!results || results.length === 0) {
    return NextResponse.json({ error: "Data hasil tidak valid" }, { status: 400 });
  }

  if (!(await isDbAvailable())) {
    const items = getMockOrderItems(orderId);
    for (const r of results) {
      const item = items.find((i) => i.id === r.itemId);
      if (item) {
        item.result = r.result;
        item.resultNumeric = r.resultNumeric || r.result;
        item.flag = r.flag || null;
        item.notes = r.notes || null;
        item.resultStatus = "entered";
        item.enteredAt = new Date();
      }
    }

    recomputeMockEgfr(orderId);

    const orderIdx = mockLabOrders.findIndex((o) => o.id === orderId);
    if (orderIdx !== -1) {
      mockLabOrders[orderIdx] = {
        ...mockLabOrders[orderIdx],
        status: "in_progress",
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ success: true });
  }

  try {
    const numericValue = (v: string | undefined | null): string | null => {
      if (v === undefined || v === null) return null;
      const t = String(v).trim();
      if (t === "" || !Number.isFinite(Number(t))) return null;
      return t;
    };

    await db.transaction(async (tx) => {
      for (const r of results) {
        await tx
          .update(orderItems)
          .set({
            result: r.result,
            resultNumeric: numericValue(r.resultNumeric),
            flag: r.flag || null,
            notes: r.notes || null,
            resultStatus: "entered",
            enteredBy: user.id,
            enteredAt: new Date(),
          })
          .where(eq(orderItems.id, r.itemId));
      }

      const orderItemsForCalc = await tx
        .select({
          id: orderItems.id,
          testCode: testCatalog.code,
          result: orderItems.result,
          resultNumeric: orderItems.resultNumeric,
          unit: orderItems.unit,
        })
        .from(orderItems)
        .innerJoin(testCatalog, eq(orderItems.testId, testCatalog.id))
        .where(eq(orderItems.orderId, orderId));

      const creatinineItem = orderItemsForCalc.find((i) => isCreatinineTestCode(i.testCode));
      const egfrItem = orderItemsForCalc.find((i) => isEgfrTestCode(i.testCode));

      if (creatinineItem && egfrItem) {
        const submitted = results.find((r) => r.itemId === creatinineItem.id);
        const rawValue = submitted?.resultNumeric ?? submitted?.result ?? creatinineItem.resultNumeric;
        const creatMgDl = normalizeCreatinineMgDl(rawValue, creatinineItem.unit);

        const [orderRow] = await tx
          .select({
            age: labOrders.age,
            patientAge: patients.age,
            patientGender: patients.gender,
          })
          .from(labOrders)
          .innerJoin(patients, eq(labOrders.patientId, patients.id))
          .where(eq(labOrders.id, orderId))
          .limit(1);

        const ageYears = parseAgeYears(orderRow?.age) ?? parseAgeYears(orderRow?.patientAge);
        const isFemale = orderRow?.patientGender === "female";

        if (creatMgDl !== null && ageYears !== null && isFemale !== undefined) {
          const egfr = computeEgfrCkdEpi2021(creatMgDl, ageYears, isFemale);
          if (egfr != null) {
            const flag = egfr < parseInt(EGFREPIReferenceMin, 10) ? "L" : null;
            await tx
              .update(orderItems)
              .set({
                result: String(egfr),
                resultNumeric: String(egfr),
                flag,
                resultStatus: "entered",
                notes: "Dihitung otomatis dengan persamaan CKD-EPI 2021",
                enteredBy: user.id,
                enteredAt: new Date(),
              })
              .where(eq(orderItems.id, egfrItem.id));
          }
        }
      }

      await tx
        .update(labOrders)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(labOrders.id, orderId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enter results error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hasil" },
      { status: 500 }
    );
  }
}
