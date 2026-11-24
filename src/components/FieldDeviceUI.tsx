import { Link } from "@tanstack/react-router";
import { Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device, DeviceStatus } from "@/lib/field-demo";
import satellite from "@/assets/satellite-flood.jpg";

export const statusTone: Record<DeviceStatus, string> = { Healthy: "text-success", "Needs attention": "text-primary", Offline: "text-destructive" };
export function StatusBadge({ status }: { status: DeviceStatus }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded border border-current px-2 py-1 text-xs ${statusTone[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}
export function DeviceMap({ devices }: { devices: Device[] }) {
  return <div className="relative aspect-[16/7] min-h-48 overflow-hidden rounded-md border border-border">
    <img src={satellite} alt="Satellite map of assigned sensor sites in the Riverdale flood zone" className="h-full w-full object-cover" />
    <span className="absolute left-3 top-3 rounded bg-background/90 px-2 py-1 font-mono text-[10px] text-accent">RIVERDALE · SENSOR NETWORK</span>
    {devices.map((d) => <Button key={d.id} asChild variant="ghost" className={`absolute h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 gap-1 bg-background/90 px-2 hover:bg-background ${statusTone[d.status]}`} style={{ left: `${d.x}%`, top: `${d.y}%` }}><Link to="/field/$deviceId" params={{ deviceId: d.id }} aria-label={`${d.id} · ${d.status}`}><MapPin /><span className="font-mono text-[10px]">{d.id}</span></Link></Button>)}
  </div>;
}
export function CameraPlaceholder({ obscured = false, unavailable = false, compact = false }: { obscured?: boolean; unavailable?: boolean; compact?: boolean }) {
  return <div className={`flex flex-col items-center justify-center gap-2 rounded border border-dashed border-border bg-secondary/50 ${compact ? "aspect-square w-24" : "aspect-[16/7] min-h-32"}`}><Camera className={obscured || unavailable ? "text-primary" : "text-accent"} size={24} /><span className="text-xs text-muted-foreground">{unavailable ? "Camera unavailable" : obscured ? "Lens obscured" : "Site photo placeholder"}</span></div>;
}
export function WaterSparkline({ readings }: { readings: number[] }) {
  const low = Math.min(...readings) - 0.05;
  const high = Math.max(...readings) + 0.05;
  const points = readings.map((v, i) => `${i * 100 / Math.max(1, readings.length - 1)},${36 - (v - low) / (high - low) * 30}`).join(" ");
  return <div><svg viewBox="0 0 100 40" className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label="Water level over the last 24 hours"><polyline points={points} fill="none" className="stroke-accent" strokeWidth="1" vectorEffect="non-scaling-stroke" /></svg><div className="flex justify-between font-mono text-[10px] text-muted-foreground"><span>24 h ago</span><span>Now</span></div></div>;
}