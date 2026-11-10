import { createFileRoute } from "@tanstack/react-router";
import { SatelliteTab } from "@/components/SatelliteTab";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FloodLink — Emergency Alert SMS Routing Console" },
      { name: "description", content: "Whitelist alert endpoints, monitor carriers with auto-failover, and audit SMS delivery latency." },
      { property: "og:title", content: "FloodLink — Emergency Alert SMS Routing Console" },
      { property: "og:description", content: "Priority routing, carrier failover and latency audits for flood emergency SMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Console,
});

type Carrier = "PRIMARY" | "SECONDARY";
type Msg = { id: string; ts: number; endpoint: string; carrier: Carrier; latency: number; priority: boolean; event: string };
type Evt = { ts: number; text: string; kind: "ok" | "warn" | "bad" };

const REQS = [
  ["R1","Whitelist Alert API endpoints in routing config","US1","F1","TC-01"],
  ["R2","Exempt whitelisted endpoints from throttling","US1","F2","TC-02, TC-17"],
  ["R3","Bypass standard queues for whitelisted traffic","US1","F3","TC-03, TC-17"],
  ["R4","No delay under peak emergency load","US1","F3","TC-04, TC-18"],
  ["R5","Verify whitelist is active","US1","F1","TC-05"],
  ["R6","Continuously monitor primary carrier health","US2","F4","TC-06"],
  ["R7","Detect carrier failure using defined criteria","US2","F4","TC-07"],
  ["R8","Fail over automatically to secondary carrier","US2","F5","TC-08, TC-18"],
  ["R9","No dropped requests during failover","US2","F5","TC-09"],
  ["R10","Alert engineers and log failover events","US2","F6","TC-10, TC-18"],
  ["R11","Log end-to-end latency per emergency message","US3","F7","TC-11"],
  ["R12","Capture latency metrics","US3","F7","TC-12"],
  ["R13","Secure storage with access controls","US3","F8","TC-13"],
  ["R14","Queryable logs for post-event audits","US3","F9","TC-14"],
  ["R15","Tag logs with event and carrier metadata","US3","F7, F8","TC-15"],
  ["R16","SLA compliance reporting","US3","F9","TC-16"],
];

const fmt = (t: number) => new Date(t).toLocaleTimeString([], { hour12: false });
const TABS = ["Overview", "Whitelist", "Satellite", "Carriers", "Latency Audit", "Traceability"] as const;

function Console() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [whitelist, setWhitelist] = useState([
    { path: "/alert-api/v1/broadcast", exempt: true },
    { path: "/alert-api/v1/zone-notify", exempt: true },
  ]);
  const [primaryUp, setPrimaryUp] = useState(true);
  const [active, setActive] = useState<Carrier>("PRIMARY");
  const [health, setHealth] = useState({ PRIMARY: 99, SECONDARY: 98 });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [events, setEvents] = useState<Evt[]>([{ ts: Date.now(), text: "Routing layer online. Whitelist active.", kind: "ok" }]);
  const [burst, setBurst] = useState(0);
  const [stdQueue, setStdQueue] = useState(12);
  const [sla, setSla] = useState(3000);
  const [eventTag, setEventTag] = useState("FLOOD-2026-11-RIVERDALE");
  const fails = useRef(0);
  const n = useRef(1);

  const log = (text: string, kind: Evt["kind"]) => setEvents((e) => [{ ts: Date.now(), text, kind }, ...e].slice(0, 40));

  useEffect(() => {
    const t = setInterval(() => {
      // F4 health monitor
      setHealth((h) => ({ PRIMARY: primaryUp ? 95 + Math.random() * 5 : Math.random() * 10, SECONDARY: 94 + Math.random() * 5 }));
      if (!primaryUp) {
        fails.current++;
        if (fails.current === 3 && active === "PRIMARY") {
          setActive("SECONDARY");
          log("Primary carrier failed 3 consecutive health checks → failover to SECONDARY. 0 requests dropped.", "bad");
        }
      } else {
        fails.current = 0;
        if (active === "SECONDARY") { setActive("PRIMARY"); log("Primary carrier restored → traffic returned to PRIMARY.", "ok"); }
      }
      // traffic
      const count = burst > 0 ? 8 : 2;
      const now = Date.now();
      const out: Msg[] = [];
      for (let i = 0; i < count; i++) {
        const wl = whitelist[Math.floor(Math.random() * Math.max(whitelist.length, 1))];
        const priority = !!wl?.exempt;
        const base = priority ? 400 + Math.random() * 900 : 1500 + Math.random() * 3000 + (burst ? 2500 : 0);
        out.push({ id: `MSG-${String(n.current++).padStart(5, "0")}`, ts: now, endpoint: wl?.path ?? "/sms/standard", carrier: active, latency: Math.round(base + (active === "SECONDARY" ? 250 : 0)), priority, event: eventTag });
      }
      setMsgs((m) => [...out, ...m].slice(0, 500));
      setStdQueue((q) => Math.max(0, Math.round(q + (burst ? 40 : -6) + Math.random() * 4)));
      setBurst((b) => Math.max(0, b - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [primaryUp, active, burst, whitelist, eventTag]);

  const stats = useMemo(() => {
    const pr = msgs.filter((m) => m.priority);
    const avg = pr.length ? Math.round(pr.reduce((a, m) => a + m.latency, 0) / pr.length) : 0;
    const within = pr.length ? Math.round((pr.filter((m) => m.latency <= sla).length / pr.length) * 100) : 100;
    const p95 = pr.length ? [...pr].sort((a, b) => a.latency - b.latency)[Math.floor(pr.length * 0.95)]?.latency ?? 0 : 0;
    return { total: msgs.length, pr: pr.length, avg, within, p95 };
  }, [msgs, sla]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded bg-primary font-mono font-semibold text-primary-foreground">FL</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">FloodLink Routing Console</h1>
              <p className="text-xs text-muted-foreground">Emergency Alert SMS · Regional Network Engineering</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`h-2 w-2 rounded-full pulse-dot ${active === "PRIMARY" ? "bg-success" : "bg-destructive"}`} />
            ACTIVE CARRIER: <span className={active === "PRIMARY" ? "text-success" : "text-destructive"}>{active}</span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {tab === "Overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Priority msgs logged" value={stats.pr} />
              <Kpi label="Avg priority latency" value={`${stats.avg} ms`} />
              <Kpi label="P95 priority latency" value={`${stats.p95} ms`} />
              <Kpi label={`Within SLA (${sla} ms)`} value={`${stats.within}%`} tone={stats.within >= 95 ? "ok" : "bad"} />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Queues" tag="F3 · R3 R4" className="lg:col-span-2">
                <QueueBar label="Priority queue (whitelisted)" value={burst ? 1 : 0} max={100} tone="accent" note="Processed immediately, independent of standard queues" />
                <QueueBar label="Standard queue" value={stdQueue} max={400} tone="muted" note="Subject to throttling" />
                <button onClick={() => { setBurst(10); log("Peak load simulation started: emergency SMS burst (TC-04).", "warn"); }} className="mt-4 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  {burst ? `Burst in progress… ${burst}s` : "Simulate flood alert burst"}
                </button>
              </Panel>
              <Panel title="Event feed" tag="F6 · R10">
                <EventList events={events} />
              </Panel>
            </div>
          </>
        )}

        {tab === "Whitelist" && <WhitelistTab list={whitelist} setList={setWhitelist} log={log} />}

        {tab === "Satellite" && <SatelliteTab onAlert={(z, p) => { setBurst(10); log(`Satellite analysis: priority alert dispatched to ${z} (${p.toLocaleString()} residents) via whitelisted route.`, "warn"); }} />}

        {tab === "Carriers" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {(["PRIMARY", "SECONDARY"] as Carrier[]).map((c) => (
              <Panel key={c} title={`${c} carrier`} tag="F4 · R6 R7">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-4xl">{health[c].toFixed(1)}%</span>
                  <span className={`rounded px-2 py-0.5 font-mono text-xs ${active === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{active === c ? "CARRYING TRAFFIC" : "STANDBY"}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Health check every 1s · failure = 3 consecutive checks below 50%</p>
                {c === "PRIMARY" && (
                  <button onClick={() => { setPrimaryUp(!primaryUp); log(primaryUp ? "Primary carrier outage simulated (TC-07)." : "Primary carrier recovery simulated.", "warn"); }}
                    className={`mt-4 w-full rounded px-4 py-2 text-sm font-semibold ${primaryUp ? "bg-destructive text-destructive-foreground" : "bg-success text-primary-foreground"}`}>
                    {primaryUp ? "Simulate primary outage" : "Restore primary carrier"}
                  </button>
                )}
              </Panel>
            ))}
            <Panel title="Failover log" tag="F5 F6 · R8 R9 R10"><EventList events={events} /></Panel>
          </div>
        )}

        {tab === "Latency Audit" && <AuditTab msgs={msgs} sla={sla} setSla={setSla} eventTag={eventTag} setEventTag={setEventTag} />}

        {tab === "Traceability" && (
          <Panel title="Requirements traceability" tag="R1–R16 · US1–US3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-xs text-muted-foreground"><tr>{["Req", "Requirement", "Story", "Feature", "Tests", "Status"].map((h) => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
                <tbody>{REQS.map((r) => (
                  <tr key={r[0]} className="border-t border-border">
                    <td className="py-2 pr-4 font-mono text-primary">{r[0]}</td><td className="py-2 pr-4">{r[1]}</td>
                    <td className="py-2 pr-4 font-mono">{r[2]}</td><td className="py-2 pr-4 font-mono">{r[3]}</td><td className="py-2 pr-4 font-mono text-xs">{r[4]}</td>
                    <td className="py-2"><span className="rounded bg-accent/15 px-2 py-0.5 text-xs text-accent">Demonstrable</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-3xl ${tone === "ok" ? "text-success" : tone === "bad" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function Panel({ title, tag, children, className = "" }: { title: string; tag: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span className="font-mono text-[10px] text-muted-foreground">{tag}</span>
      </div>
      {children}
    </section>
  );
}

function QueueBar({ label, value, max, tone, note }: { label: string; value: number; max: number; tone: "accent" | "muted"; note: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-mono">{value}</span></div>
      <div className="mt-1 h-2 rounded bg-secondary"><div className={`h-2 rounded transition-all ${tone === "accent" ? "bg-accent" : "bg-muted-foreground"}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function EventList({ events }: { events: Evt[] }) {
  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
      {events.map((e, i) => (
        <li key={i} className="flex gap-2">
          <span className="font-mono text-xs text-muted-foreground">{fmt(e.ts)}</span>
          <span className={e.kind === "bad" ? "text-destructive" : e.kind === "warn" ? "text-primary" : "text-success"}>{e.text}</span>
        </li>
      ))}
    </ul>
  );
}

function WhitelistTab({ list, setList, log }: { list: { path: string; exempt: boolean }[]; setList: (l: { path: string; exempt: boolean }[]) => void; log: (t: string, k: Evt["kind"]) => void }) {
  const [path, setPath] = useState("");
  const [probe, setProbe] = useState<string | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Whitelisted Alert API endpoints" tag="F1 F2 · R1 R2 R5" className="lg:col-span-2">
        <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const p = path.trim(); if (!p.startsWith("/") || list.some((l) => l.path === p)) return; setList([...list, { path: p, exempt: true }]); log(`Endpoint ${p} added to whitelist.`, "ok"); setPath(""); }}>
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/alert-api/v1/..." className="flex-1 rounded border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring" />
          <button className="rounded bg-primary px-4 text-sm font-semibold text-primary-foreground">Add</button>
        </form>
        <ul className="divide-y divide-border">
          {list.map((l) => (
            <li key={l.path} className="flex items-center justify-between gap-3 py-3">
              <span className="font-mono text-sm">{l.path}</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={l.exempt} onChange={() => setList(list.map((x) => x.path === l.path ? { ...x, exempt: !x.exempt } : x))} className="accent-primary" />Throttle exempt</label>
                <button onClick={() => { setList(list.filter((x) => x.path !== l.path)); log(`Endpoint ${l.path} removed from whitelist.`, "warn"); }} className="text-destructive hover:underline">Remove</button>
              </div>
            </li>
          ))}
          {!list.length && <li className="py-3 text-sm text-muted-foreground">No endpoints whitelisted — alerts will be throttled.</li>}
        </ul>
      </Panel>
      <Panel title="Verify whitelist" tag="TC-05">
        <p className="text-sm text-muted-foreground">Send a probe request to confirm the whitelist is active and treated as priority.</p>
        <button onClick={() => { const ok = list.some((l) => l.exempt); setProbe(ok ? `PASS · ${list.filter((l) => l.exempt).length} active endpoint(s); probe routed via priority queue.` : "FAIL · no throttle-exempt endpoints active."); }} className="mt-4 w-full rounded border border-accent px-4 py-2 text-sm text-accent hover:bg-accent/10">Send probe</button>
        {probe && <p className={`mt-3 font-mono text-xs ${probe.startsWith("PASS") ? "text-success" : "text-destructive"}`}>{probe}</p>}
      </Panel>
    </div>
  );
}

function AuditTab({ msgs, sla, setSla, eventTag, setEventTag }: { msgs: Msg[]; sla: number; setSla: (n: number) => void; eventTag: string; setEventTag: (s: string) => void }) {
  const [carrier, setCarrier] = useState<"ALL" | Carrier>("ALL");
  const [onlyBreach, setOnlyBreach] = useState(false);
  const rows = msgs.filter((m) => m.priority && (carrier === "ALL" || m.carrier === carrier) && (!onlyBreach || m.latency > sla));
  const exportCsv = () => {
    const csv = ["id,timestamp,endpoint,carrier,latency_ms,event", ...rows.map((m) => [m.id, new Date(m.ts).toISOString(), m.endpoint, m.carrier, m.latency, m.event].join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "latency-audit.csv"; a.click();
  };
  const within = rows.length ? Math.round((rows.filter((m) => m.latency <= sla).length / rows.length) * 100) : 100;
  return (
    <Panel title="Latency audit & SLA report" tag="F7 F8 F9 · R11–R16">
      <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <Field label="Event tag"><input value={eventTag} onChange={(e) => setEventTag(e.target.value)} className="w-64 rounded border border-input bg-background px-3 py-1.5 font-mono text-xs" /></Field>
        <Field label="SLA threshold (ms)"><input type="number" value={sla} onChange={(e) => setSla(Number(e.target.value) || 0)} className="w-28 rounded border border-input bg-background px-3 py-1.5 font-mono text-xs" /></Field>
        <Field label="Carrier"><select value={carrier} onChange={(e) => setCarrier(e.target.value as "ALL" | Carrier)} className="rounded border border-input bg-background px-3 py-1.5 text-xs"><option>ALL</option><option>PRIMARY</option><option>SECONDARY</option></select></Field>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs"><input type="checkbox" checked={onlyBreach} onChange={(e) => setOnlyBreach(e.target.checked)} className="accent-primary" />SLA breaches only</label>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs">{rows.length} rows · <span className={within >= 95 ? "text-success" : "text-destructive"}>{within}% within SLA</span></span>
          <button onClick={exportCsv} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Export CSV</button>
        </div>
      </div>
      <p className="mb-3 font-mono text-[10px] text-muted-foreground">🔒 Read-only audit store · role: network-engineer · records are immutable</p>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 bg-card text-muted-foreground"><tr>{["ID", "Time", "Endpoint", "Carrier", "Latency", "Event"].map((h) => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 200).map((m) => (
            <tr key={m.id} className="border-t border-border">
              <td className="py-1.5 pr-4">{m.id}</td><td className="pr-4">{fmt(m.ts)}</td><td className="pr-4">{m.endpoint}</td>
              <td className={`pr-4 ${m.carrier === "SECONDARY" ? "text-primary" : ""}`}>{m.carrier}</td>
              <td className={`pr-4 ${m.latency > sla ? "text-destructive" : "text-success"}`}>{m.latency} ms</td><td className="text-muted-foreground">{m.event}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-xs text-muted-foreground">{label}{children}</label>;
}
