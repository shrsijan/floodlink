import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Send } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { RoleGate, useSession } from "@/components/SessionContext";
import { useFieldDemo } from "@/components/FieldDemoContext";
import { StatusBadge } from "@/components/FieldDeviceUI";
import { Button } from "@/components/ui/button";
import { REPORT_KINDS, WARNING_LEVEL_M, WATCH_LEVEL_M, zoneId, zoneStatus, type ReportKind, type ZoneLevel } from "@/lib/flood-reports";

export const Route = createFileRoute("/resident")({
  head: () => ({ meta: [{ title: "My Zone — FloodLink Resident" }, { name: "description", content: "Flood status, alerts and flood reporting for residents." }, { property: "og:title", content: "My Zone — FloodLink Resident" }, { property: "og:description", content: "See your zone's flood level, read alerts and report flooding." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <RoleGate area="resident"><ResidentPortal /></RoleGate>,
});

const LEVEL_TONE: Record<ZoneLevel, string> = { Normal: "text-success border-success/40", Watch: "text-primary border-primary/40", Warning: "text-destructive border-destructive/40" };
const LEVEL_ADVICE: Record<ZoneLevel, string> = {
  Normal: "No flood risk detected. Keep your phone on to receive alerts.",
  Watch: "Water is rising. Move valuables up and prepare an emergency bag.",
  Warning: "Flooding likely. Avoid low roads and be ready to evacuate to higher ground.",
};
const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

function ResidentPortal() {
  const { user } = useSession();
  const { devices, reports, alerts, submitReport } = useFieldDemo();
  const zones = [...new Set(devices.map((d) => d.zone))].sort();
  const [zone, setZone] = useState(user?.role === "resident" ? user.zone : zones[0] ?? "");
  const [kind, setKind] = useState<ReportKind>("Water rising");
  const [details, setDetails] = useState("");
  if (!user) return null;
  const status = zoneStatus(devices, zone);
  const zoneAlerts = alerts.filter((a) => a.zone === zoneId(zone));
  const mine = reports.filter((r) => r.reporter === user.name);
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport({ zone, reporter: user.name, kind, details: details.trim() });
    setDetails("");
    toast("Report sent to emergency responders");
  };
  return <div className="min-h-screen"><AppHeader area="resident" subtitle={`${user.name} · ${user.phone}`} /><main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-muted-foreground">Your zone</p>{user.role === "resident" ? <h1 className="mt-1 text-2xl font-bold">{zone}</h1> : <select value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 rounded border border-input bg-background px-3 py-2 text-lg font-semibold">{zones.map((z) => <option key={z}>{z}</option>)}</select>}</div><span className="font-mono text-[10px] text-muted-foreground">WATCH ≥ {WATCH_LEVEL_M} m · WARNING ≥ {WARNING_LEVEL_M} m</span></section>
    <section className={`rounded-md border bg-card p-5 ${LEVEL_TONE[status.level]}`}><p className="font-mono text-xs uppercase">Flood level · {status.level}</p><p className="mt-2 font-mono text-4xl">{status.maxWater.toFixed(2)} m</p><p className="mt-3 text-sm text-foreground">{LEVEL_ADVICE[status.level]}</p>{status.offline > 0 && <p className="mt-2 text-xs text-primary">{status.offline} sensor offline in this zone · a technician has been notified</p>}</section>
    <div className="grid gap-8 md:grid-cols-2">
      <section><h2 className="mb-3 flex items-center gap-2 font-semibold"><BellRing size={16} className="text-accent" />Alerts for your zone</h2>{zoneAlerts.length ? <ul className="space-y-3">{zoneAlerts.map((a) => <li key={a.id} className="border-l-2 border-destructive pl-3"><span className="font-mono text-xs text-muted-foreground">{time(a.ts)}</span><p className="mt-1 text-sm">{a.text}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No alerts sent to this zone.</p>}<h2 className="mb-3 mt-8 font-semibold">Sensors near you</h2><ul className="divide-y divide-border">{status.sensors.map((d) => <li key={d.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm">{d.site}</p><p className="font-mono text-xs text-muted-foreground">{d.id} · {d.water.toFixed(2)} m</p></div><StatusBadge status={d.status} /></li>)}</ul></section>
      <section><h2 className="mb-3 font-semibold">Report flooding</h2><form onSubmit={send} className="space-y-4 rounded-md border border-border bg-card p-5"><fieldset className="space-y-2"><legend className="mb-2 text-sm">What is happening?</legend>{REPORT_KINDS.map((k) => <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-border px-3"><input type="radio" name="kind" className="accent-primary" checked={kind === k} onChange={() => setKind(k)} /><span className="text-sm">{k}</span></label>)}</fieldset><label className="block text-sm">Location and details<textarea required value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Street, landmark, number of people…" className="mt-2 w-full rounded border border-input bg-background p-3" /></label><Button type="submit" className="h-12 w-full"><Send />Send report</Button></form>
        <h2 className="mb-3 mt-8 font-semibold">My reports</h2>{mine.length ? <ul className="divide-y divide-border">{mine.map((r) => <li key={r.id} className="py-3"><div className="flex justify-between gap-2 text-sm"><span className="font-mono">{r.id} · {r.kind}</span><span className={r.status === "Resolved" ? "text-success" : r.status === "Dispatched" ? "text-accent" : "text-primary"}>{r.status}</span></div><p className="mt-1 break-words text-xs text-muted-foreground">{r.details}</p>{r.responder && <p className="mt-1 text-xs text-muted-foreground">Handled by {r.responder}</p>}</li>)}</ul> : <p className="text-sm text-muted-foreground">You have not sent any reports.</p>}</section>
    </div>
  </main></div>;
}
