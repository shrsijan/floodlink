import { useEffect, useState } from "react";
import sat from "@/assets/satellite-flood.jpg";

const ZONES = [
  { id: "Z1", name: "Riverdale Center", pop: 4200, x: 50, y: 52, r: 14 },
  { id: "Z2", name: "West Fields", pop: 650, x: 22, y: 40, r: 16 },
  { id: "Z3", name: "South Bend", pop: 1800, x: 48, y: 82, r: 13 },
  { id: "Z4", name: "East Ridge", pop: 2900, x: 86, y: 45, r: 11 },
];
const PASSES = 6;

export function SatelliteTab({ onAlert }: { onAlert: (zone: string, pop: number) => void }) {
  const [pass, setPass] = useState(PASSES - 1);
  const [live, setLive] = useState(true);
  const [countdown, setCountdown] = useState(20);
  const [layers, setLayers] = useState({ water: true, zones: true, grid: false });
  const [sel, setSel] = useState(ZONES[0].id);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? (setPass(PASSES - 1), 20) : c - 1)), 1000);
    return () => clearInterval(t);
  }, [live]);

  const level = (pass + 1) / PASSES; // flood intensity 0..1
  const risk = (z: (typeof ZONES)[number]) => Math.min(100, Math.round(level * 100 * (z.id === "Z4" ? 0.3 : z.id === "Z2" ? 1.1 : 0.85)));
  const area = (12.4 * level + 1.1).toFixed(1);
  const prev = (12.4 * (pass / PASSES) + 1.1).toFixed(1);
  const atRisk = ZONES.filter((z) => risk(z) >= 60).reduce((a, z) => a + z.pop, 0);
  const zone = ZONES.find((z) => z.id === sel)!;
  const passTime = (i: number) => new Date(Date.now() - (PASSES - 1 - i) * 3 * 3600_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Satellite flood monitoring</h2>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-destructive pulse-dot" : "bg-muted-foreground"}`} />
            {live ? `LIVE · next pass in ${countdown}s` : "PAUSED"}
            <button onClick={() => setLive(!live)} className="rounded border border-border px-2 py-0.5 hover:bg-secondary">{live ? "Pause" : "Go live"}</button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded border border-border">
          <img src={sat} alt="Satellite view of flooded river valley" width={1280} height={832} className="block w-full" />
          <svg viewBox="0 0 100 65" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {layers.grid && Array.from({ length: 9 }).map((_, i) => (
              <g key={i} className="stroke-foreground/20" strokeWidth={0.1}>
                <line x1={i * 12.5} y1={0} x2={i * 12.5} y2={65} /><line x1={0} y1={i * 8.1} x2={100} y2={i * 8.1} />
              </g>
            ))}
            {layers.water && (
              <g className="fill-accent" style={{ opacity: 0.25 + level * 0.3 }}>
                <ellipse cx={30} cy={30} rx={10 + level * 18} ry={6 + level * 10} />
                <ellipse cx={45} cy={55} rx={8 + level * 16} ry={4 + level * 7} />
                <ellipse cx={68} cy={20} rx={4 + level * 6} ry={8 + level * 8} />
              </g>
            )}
            {layers.zones && ZONES.map((z) => {
              const r = risk(z);
              return (
                <g key={z.id} onClick={() => setSel(z.id)} className="cursor-pointer">
                  <circle cx={z.x} cy={z.y * 0.65} r={z.r * 0.5} strokeWidth={sel === z.id ? 0.6 : 0.3} strokeDasharray="1 0.6"
                    className={`${r >= 60 ? "stroke-destructive fill-destructive/15" : r >= 35 ? "stroke-primary fill-primary/10" : "stroke-success fill-success/10"}`} />
                  <text x={z.x} y={z.y * 0.65 + 0.8} textAnchor="middle" fontSize={2.2} className="fill-foreground font-mono">{z.id}</text>
                </g>
              );
            })}
          </svg>
          <div className="absolute left-2 top-2 rounded bg-background/80 px-2 py-1 font-mono text-[10px]">SENTINEL-1 SAR · 10 m · pass {pass + 1}/{PASSES} · {passTime(pass)}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input type="range" min={0} max={PASSES - 1} value={pass} onChange={(e) => { setPass(+e.target.value); setLive(false); }} className="flex-1 accent-primary" aria-label="Satellite pass timeline" />
          {(["water", "zones", "grid"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-xs capitalize"><input type="checkbox" checked={layers[k]} onChange={() => setLayers({ ...layers, [k]: !layers[k] })} className="accent-primary" />{k === "water" ? "Water mask" : k === "zones" ? "Alert zones" : "Grid"}</label>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Analysis</h2>
          <dl className="grid grid-cols-2 gap-3 font-mono text-sm">
            <Stat k="Inundated area" v={`${area} km²`} />
            <Stat k="Change vs prior pass" v={`+${(+area - +prev).toFixed(1)} km²`} bad />
            <Stat k="Population at risk" v={atRisk.toLocaleString()} bad={atRisk > 0} />
            <Stat k="Confidence" v={`${88 + pass}%`} />
          </dl>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Zones</h2>
          <ul className="space-y-2 text-sm">
            {ZONES.map((z) => {
              const r = risk(z);
              return (
                <li key={z.id}>
                  <button onClick={() => setSel(z.id)} className={`w-full rounded border px-3 py-2 text-left ${sel === z.id ? "border-primary" : "border-border"}`}>
                    <div className="flex justify-between"><span>{z.id} · {z.name}</span><span className={`font-mono ${r >= 60 ? "text-destructive" : r >= 35 ? "text-primary" : "text-success"}`}>{r}%</span></div>
                    <div className="mt-1 h-1 rounded bg-secondary"><div className={`h-1 rounded ${r >= 60 ? "bg-destructive" : r >= 35 ? "bg-primary" : "bg-success"}`} style={{ width: `${r}%` }} /></div>
                  </button>
                </li>
              );
            })}
          </ul>
          <button onClick={() => onAlert(`${zone.id} ${zone.name}`, zone.pop)} className="mt-4 w-full rounded bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90">
            Send priority alert to {zone.id} ({zone.pop.toLocaleString()} residents)
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt><dd className={`text-lg ${bad ? "text-destructive" : ""}`}>{v}</dd></div>;
}
