import { db } from "@/db";
import { labOrders, patients, orderItems, testCatalog } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  EGFREPICode,
  computeEgfrCkdEpi2021,
  isCreatinineTestCode,
  isEgfrTestCode,
  isUreumTestCode,
  normalizeCreatinineMgDl,
  parseAgeYears,
  EGFREPIReferenceMin,
} from "@/lib/egfr";

type ItemRow = {
  id: number;
  testCode: string;
  result: string | null;
  resultNumeric: string | null;
  unit: string | null;
};

async function fetchItemRows(orderId: number): Promise<ItemRow[]> {
  return db
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
}

export async function ensureAndComputeEgfr(
  orderId: number,
  enteredBy?: number | null
): Promise<void> {
  try {
    let rows = await fetchItemRows(orderId);

    const hasCreatinine = rows.some((i) => isCreatinineTestCode(i.testCode));
    const hasUreum = rows.some((i) => isUreumTestCode(i.testCode));
    let egfrRow = rows.find((i) => isEgfrTestCode(i.testCode)) || null;

    if (!hasCreatinine || !hasUreum) {
      if (egfrRow) {
        await db.delete(orderItems).where(eq(orderItems.id, egfrRow.id));
      }
      return;
    }

    if (!egfrRow) {
      const [egfrTest] = await db
        .select()
        .from(testCatalog)
        .where(eq(testCatalog.code, EGFREPICode))
        .limit(1);

      if (!egfrTest) return;

      await db.insert(orderItems).values({
        orderId,
        testId: egfrTest.id,
        resultStatus: "pending",
        unit: egfrTest.unit,
        referenceMin: egfrTest.referenceMin,
        referenceMax: egfrTest.referenceMax,
        referenceText: egfrTest.referenceText,
      });

      rows = await fetchItemRows(orderId);
      egfrRow = rows.find((i) => isEgfrTestCode(i.testCode)) || null;
      if (!egfrRow) return;
    }

    const creatinineRow = rows.find((i) => isCreatinineTestCode(i.testCode));
    const creatMgDl = normalizeCreatinineMgDl(
      creatinineRow?.resultNumeric ?? creatinineRow?.result,
      creatinineRow?.unit
    );
    if (creatMgDl === null) return;

    const [orderRow] = await db
      .select({
        age: labOrders.age,
        patientAge: patients.age,
        patientGender: patients.gender,
      })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .where(eq(labOrders.id, orderId))
      .limit(1);

    if (!orderRow) return;

    const ageYears = parseAgeYears(orderRow.age) ?? parseAgeYears(orderRow.patientAge);
    if (ageYears === null) return;

    const egfr = computeEgfrCkdEpi2021(creatMgDl, ageYears, orderRow.patientGender === "female");
    if (egfr === null) return;

    const flag = egfr < parseInt(EGFREPIReferenceMin, 10) ? "L" : null;

    await db
      .update(orderItems)
      .set({
        result: String(egfr),
        resultNumeric: String(egfr),
        flag,
        resultStatus: "entered",
        notes: "Dihitung otomatis dengan persamaan CKD-EPI 2021",
        enteredBy: enteredBy ?? null,
        enteredAt: new Date(),
      })
      .where(eq(orderItems.id, egfrRow.id));
  } catch (error) {
    console.error("ensureAndComputeEgfr error:", error);
  }
}