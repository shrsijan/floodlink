import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { RoleGate, useSession } from "@/components/SessionContext";
import { useFieldDemo } from "@/components/FieldDemoContext";
import { Button } from "@/components/ui/button";
import { nextStatus, sortReports, zoneStatus, type ReportStatus, type ZoneLevel } from "@/lib/flood-reports";

export const Route = createFileRoute("/responder")({
  head: () => ({ meta: [{ title: "Response Desk — FloodLink EMS" }, { name: "description", content: "Triage resident flood reports and dispatch emergency crews." }, { property: "og:title", content: "Response Desk — FloodLink EMS" }, { property: "og:description", content: "Prioritised flood reports and zone risk for emergency responders." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <RoleGate area="responder"><ResponseDesk /></RoleGate>,
});

const LEVEL_TONE: Record<ZoneLevel, string> = { Normal: "text-success", Watch: "text-primary", Warning: "text-destructive" };
const STATUS_TONE: Record<ReportStatus, string> = { Submitted: "text-primary", Dispatched: "text-accent", Resolved: "text-success" };
const ACTION: Record<ReportStatus, string> = { Submitted: "Dispatch crew", Dispatched: "Mark resolved", Resolved: "" };
const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

function ResponseDesk() {
  const { user } = useSession();
  const { devices, reports, progressReport } = useFieldDemo();
  if (!user) return null;
  const zones = [...new Set(devices.map((d) => d.zone))].sort();
  const open = reports.filter((r) => r.status !== "Resolved").length;
  return <div className="min-h-screen"><AppHeader area="responder" subtitle={`${user.name} · ${user.title}`} /><main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
    <section><h2 className="mb-3 font-semibold">Zone risk</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{zones.map((z) => { const s = zoneStatus(devices, z); return <div key={z} className="rounded-md border border-border bg-card p-4"><p className="text-sm">{z}</p><p className={`mt-2 font-mono text-2xl ${LEVEL_TONE[s.level]}`}>{s.maxWater.toFixed(2)} m</p><p className={`text-xs ${LEVEL_TONE[s.level]}`}>{s.level}{s.offline ? ` · ${s.offline} sensor offline` : ""}</p></div>; })}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Resident reports</h2><span className="font-mono text-xs text-muted-foreground">{open} open · most urgent first</span></div><ul className="space-y-3">{sortReports(reports).map((r) => <li key={r.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-md border bg-card p-4 ${r.kind === "People trapped" && r.status !== "Resolved" ? "border-destructive/60" : "border-border"}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-mono text-xs text-muted-foreground">{r.id} · {time(r.ts)}</span><span className={`font-semibold ${r.kind === "People trapped" ? "text-destructive" : ""}`}>{r.kind}</span><span className={`text-xs ${STATUS_TONE[r.status]}`}>{r.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{r.zone} · {r.reporter}</p><p className="mt-2 break-words text-sm">{r.details}</p>{r.responder && <p className="mt-1 text-xs text-muted-foreground">Assigned to {r.responder}</p>}</div>{nextStatus(r.status) && <Button className="h-11" variant={r.status === "Submitted" ? "default" : "outline"} onClick={() => progressReport(r.id, user.name)}>{ACTION[r.status]}</Button>}</li>)}</ul></section>
  </main></div>;
}
