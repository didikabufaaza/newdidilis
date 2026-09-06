export function getCanAnalyzeClient(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("canAnalyze") === "true";
}
