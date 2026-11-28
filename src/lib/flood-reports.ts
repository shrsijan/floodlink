import type { Device } from "@/lib/field-demo";

export type ZoneLevel = "Normal" | "Watch" | "Warning";
export type ReportKind = "People trapped" | "Road flooded" | "Water rising";
export type ReportStatus = "Submitted" | "Dispatched" | "Resolved";
export type FloodReport = { id: string; ts: number; zone: string; reporter: string; kind: ReportKind; details: string; status: ReportStatus; responder: string | null };
export type ZoneAlert = { id: string; ts: number; zone: string; text: string };

export const REPORT_KINDS: ReportKind[] = ["People trapped", "Road flooded", "Water rising"];
export const WARNING_LEVEL_M = 2.5;
export const WATCH_LEVEL_M = 1.5;

export function zoneId(zone: string) {
  return zone.trim().split(/[\s·]+/)[0] ?? "";
}

export function zoneStatus(devices: Device[], zone: string) {
  const sensors = devices.filter((d) => zoneId(d.zone) === zoneId(zone));
  const maxWater = sensors.reduce((m, d) => Math.max(m, d.water), 0);
  const offline = sensors.filter((d) => d.status === "Offline").length;
  const level: ZoneLevel = maxWater >= WARNING_LEVEL_M ? "Warning" : maxWater >= WATCH_LEVEL_M ? "Watch" : "Normal";
  return { sensors, maxWater, offline, level };
}

export function reportPriority(report: FloodReport) {
  return report.status === "Resolved" ? 9 : REPORT_KINDS.indexOf(report.kind);
}

export function sortReports(reports: FloodReport[]) {
  return [...reports].sort((a, b) => reportPriority(a) - reportPriority(b) || a.ts - b.ts);
}

export function nextStatus(status: ReportStatus): ReportStatus | null {
  return status === "Submitted" ? "Dispatched" : status === "Dispatched" ? "Resolved" : null;
}

export function advanceReport(report: FloodReport, responder: string): FloodReport {
  const status = nextStatus(report.status);
  return status ? { ...report, status, responder } : report;
}

export function seedReports(now = Date.now()): FloodReport[] {
  return [{ id: "RPT-001", ts: now - 18 * 60_000, zone: "Z1 · Riverdale Center", reporter: "Resident (SMS reply)", kind: "Road flooded", details: "Water over Mill St near the culvert, cars turning back.", status: "Submitted", responder: null }];
}
