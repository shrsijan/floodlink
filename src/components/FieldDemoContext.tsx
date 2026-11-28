import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { createDevices, resolveDevice, type Device, type DemoEvent, type Visit } from "@/lib/field-demo";
import { advanceReport, seedReports, zoneId, type FloodReport, type ReportKind, type ZoneAlert } from "@/lib/flood-reports";

type NewReport = { zone: string; reporter: string; kind: ReportKind; details: string };
type DemoState = {
  devices: Device[];
  events: DemoEvent[];
  reports: FloodReport[];
  alerts: ZoneAlert[];
  completeVisit: (id: string, visit: Visit, gauge: number | null) => void;
  submitReport: (report: NewReport) => void;
  progressReport: (id: string, responder: string) => void;
  broadcastAlert: (zone: string, text: string) => void;
  reset: () => void;
};
const FieldDemoContext = createContext<DemoState | null>(null);
export function FieldDemoProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState(createDevices);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [reports, setReports] = useState<FloodReport[]>(() => seedReports());
  const [alerts, setAlerts] = useState<ZoneAlert[]>([]);
  const seq = useRef(2);
  const log = (text: string, kind: DemoEvent["kind"]) => setEvents((list) => [{ ts: Date.now(), text, kind }, ...list]);
  const completeVisit = (id: string, visit: Visit, gauge: number | null) => {
    setDevices((list) => list.map((d) => d.id === id ? resolveDevice(d, visit, gauge) : d));
    log(`${id} restored by field technician ${visit.technician}`, "ok");
  };
  const submitReport = (input: NewReport) => {
    const id = `RPT-${String(seq.current++).padStart(3, "0")}`;
    setReports((list) => [{ ...input, id, ts: Date.now(), status: "Submitted", responder: null }, ...list]);
    log(`${id} · ${input.kind} reported in ${input.zone}`, input.kind === "People trapped" ? "bad" : "warn");
  };
  const progressReport = (id: string, responder: string) => {
    const current = reports.find((r) => r.id === id);
    if (!current) return;
    const updated = advanceReport(current, responder);
    if (updated === current) return;
    setReports((list) => list.map((r) => r.id === id ? updated : r));
    log(`${id} ${updated.status.toLowerCase()} by ${responder}`, updated.status === "Resolved" ? "ok" : "warn");
  };
  const broadcastAlert = (zone: string, text: string) => {
    const ts = Date.now();
    setAlerts((list) => [{ id: `ALR-${ts}`, ts, zone: zoneId(zone), text }, ...list]);
  };
  const reset = () => { setDevices(createDevices()); setEvents([]); setReports(seedReports()); setAlerts([]); };
  return <FieldDemoContext.Provider value={{ devices, events, reports, alerts, completeVisit, submitReport, progressReport, broadcastAlert, reset }}>{children}</FieldDemoContext.Provider>;
}
export function useFieldDemo() {
  const value = useContext(FieldDemoContext);
  if (!value) throw new Error("Field demo provider is required");
  return value;
}
