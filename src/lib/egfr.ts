export const EGFREPICode = "KIM-045";
export const EGFREPIName = "eGFR (CKD-EPI 2021)";
export const EGFREPIUnit = "mL/menit/1,73 m²";
export const EGFREPIReferenceMin = "90";
export const EGFREPIReferenceText = ">= 90";

export const CREATININE_CODES = ["KIM-010"];
export const UREUM_CODES = ["KIM-009"];

export function parseAgeYears(age?: string | null): number | null {
  if (!age) return null;
  const match = String(age).match(/(\d{1,3}(?:[.,]\d+)?)/);
  if (!match) return null;
  const years = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(years) || years <= 0) return null;
  return years;
}

export function normalizeCreatinineMgDl(value: string | null | undefined, unit?: string | null): number | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim().replace(",", ".");
  if (trimmed === "" || !Number.isFinite(Number(trimmed))) return null;
  const v = Number(trimmed);
  if (v <= 0) return null;
  const u = (unit || "").toLowerCase();
  if (u.includes("µmol") || u.includes("umol") || u.includes("μmol")) {
    return v / 88.4;
  }
  return v;
}

export function computeEgfrCkdEpi2021(
  creatinineMgDl: number,
  ageYears: number,
  isFemale: boolean
): number | null {
  if (
    !Number.isFinite(creatinineMgDl) ||
    creatinineMgDl <= 0 ||
    !Number.isFinite(ageYears) ||
    ageYears <= 0
  ) {
    return null;
  }
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const min = Math.min(creatinineMgDl / kappa, 1);
  const max = Math.max(creatinineMgDl / kappa, 1);
  const sexFactor = isFemale ? 1.012 : 1;
  const egfr =
    142 *
    Math.pow(min, alpha) *
    Math.pow(max, -1.2) *
    Math.pow(0.9938, ageYears) *
    sexFactor;
  if (!Number.isFinite(egfr)) return null;
  return Math.round(egfr);
}

export function isEgfrTestCode(code: string | null | undefined): boolean {
  return code === EGFREPICode;
}

export function isCreatinineTestCode(code: string | null | undefined): boolean {
  return !!code && CREATININE_CODES.includes(code);
}

export function isUreumTestCode(code: string | null | undefined): boolean {
  return !!code && UREUM_CODES.includes(code);
}