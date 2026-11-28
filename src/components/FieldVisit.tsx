import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Camera, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraPlaceholder } from "@/components/FieldDeviceUI";
import { useFieldDemo } from "@/components/FieldDemoContext";
import { useSession } from "@/components/SessionContext";
import { calibrationOffset, checklistFor, inspectionComplete, needsCalibration, selfTestFailure, type Device } from "@/lib/field-demo";

const CHECKS = ["Power", "Sensor", "Camera", "Uplink to Waterline"];
export function FieldVisit({ device, onCancel }: { device: Device; onCancel: () => void }) {
  const navigate = useNavigate();
  const { completeVisit } = useFieldDemo();
  const { user } = useSession();
  const calibrate = needsCalibration(device);
  const steps = ["Arrive", "Inspect", ...(calibrate ? ["Calibrate"] : []), "Photo and notes", "Self-test", "Done"];
  const [step, setStep] = useState(0);
  const [arrived, setArrived] = useState<number | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [gaugeInput, setGaugeInput] = useState("");
  const [gauge, setGauge] = useState<number | null>(null);
  const [photo, setPhoto] = useState(false);
  const [notes, setNotes] = useState("");
  const [running, setRunning] = useState(false);
  const [tested, setTested] = useState(0);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const required = checklistFor(device);
  const inspected = inspectionComplete(required, checked);
  const failures = CHECKS.map((check) => selfTestFailure(check, required, checked));
  const passed = tested === CHECKS.length && failures.every((failure) => failure === null) && (!calibrate || gauge !== null);
  const name = steps[step];
  const duration = Math.max(1, Math.round(((finishedAt ?? Date.now()) - (arrived ?? Date.now())) / 1000));
  const before = device.issues.map((issue) => issue.title).join("; ") || "Routine inspection";
  const after = `${device.issues.some((i) => i.kind === "battery") ? "Battery 96%, charging · " : ""}${gauge !== null ? `Water level ${gauge.toFixed(2)} m · drift 0 cm · ` : ""}Healthy · camera clear · uplink online`;
  const next = () => setStep((v) => v + 1);
  const runTest = () => {
    if (running) return;
    setRunning(true); setTested(0); setFinishedAt(null);
    let count = 0;
    timer.current = setInterval(() => {
      count += 1; setTested(count);
      if (count >= CHECKS.length) { if (timer.current) clearInterval(timer.current); timer.current = null; setRunning(false); setFinishedAt(Date.now()); }
    }, 750);
  };
  const resolve = async () => {
    if (!passed || arrived === null) return;
    const now = Date.now();
    completeVisit(device.id, { id: `${device.id}-${now}`, date: new Date(now).toISOString(), technician: user?.name ?? "Field technician", actions: [...checked, ...(gauge !== null ? [`Calibrated offset ${(calibrationOffset(device.water, gauge) * 100).toFixed(1)} cm`] : []), "Self-test passed"], notes, photo, duration, before, after }, gauge);
    await navigate({ to: "/field" });
  };
  return <section className="mx-auto max-w-2xl space-y-6">
    <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs text-accent">{device.id} · ON-SITE VISIT</p><h2 className="mt-1 text-2xl font-bold">{name}</h2></div><span className="font-mono text-sm text-muted-foreground">{step + 1} / {steps.length}</span></div>
    <ol aria-label="Visit progress" className="flex gap-1.5">{steps.map((s, i) => <li key={s} aria-label={`${s}${i === step ? ", current step" : ""}`} aria-current={i === step ? "step" : undefined} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-success" : i === step ? "bg-primary" : "bg-secondary"}`} />)}</ol>
    {name === "Arrive" && <div className="space-y-6 py-4"><div><h3 className="text-xl">{device.site}</h3><p className="mt-1 text-sm text-muted-foreground">{device.zone}</p></div><CameraPlaceholder /><Button className="h-12 w-full" onClick={() => setArrived(Date.now())}><CheckCircle2 />Confirm you are at the site</Button>{arrived !== null && <p role="status" className="font-mono text-sm text-success">Arrival confirmed · {new Date(arrived).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}</div>}
    {name === "Inspect" && <div className="space-y-3"><p className="text-sm text-muted-foreground">{checked.length} of {required.length} checks completed</p>{required.map((item) => <label key={item} className="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-4"><input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" checked={checked.includes(item)} onChange={(e) => { setChecked((v) => e.target.checked ? [...v, item] : v.filter((x) => x !== item)); setTested(0); }} /><span className="text-sm">{item}</span></label>)}</div>}
    {name === "Calibrate" && <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); const value = Number(gaugeInput); if (gaugeInput.trim() && Number.isFinite(value) && value >= 0 && value <= 20) { setGauge(value); setTested(0); } }}><div className="border-y border-border py-5"><p className="text-xs text-muted-foreground">Device reading</p><p className="mt-2 font-mono text-3xl">{device.water.toFixed(2)} m</p><p className="mt-2 text-sm text-primary">Drift +{device.drift} cm vs staff gauge</p></div><label className="block text-sm">Reading on staff gauge (m)<input type="number" min="0" max="20" step="0.01" required value={gaugeInput} onChange={(e) => { setGaugeInput(e.target.value); setGauge(null); setTested(0); }} className="mt-2 h-12 w-full rounded border border-input bg-background px-3 font-mono" /></label><Button type="submit" className="h-12 w-full">Apply calibration</Button>{gauge !== null && <div role="status" className="border-l-2 border-success pl-4 text-success"><p className="font-semibold">Calibrated</p><p className="mt-1 font-mono text-sm">New offset: {(calibrationOffset(device.water, gauge) * 100).toFixed(1)} cm · adjusted reading {gauge.toFixed(2)} m</p></div>}</form>}
    {name === "Photo and notes" && <div className="space-y-5"><Button variant="outline" className="h-12" onClick={() => setPhoto(true)}><Camera />{photo ? "Replace photo" : "Add photo"}</Button>{photo && <div className="flex items-center gap-3"><CameraPlaceholder compact /><span className="text-sm text-success">Site photo attached · simulated</span></div>}<label className="block text-sm">Visit notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Observations and work completed…" className="mt-2 w-full rounded border border-input bg-background p-3" /></label></div>}
    {name === "Self-test" && <div className="space-y-5"><ul className="divide-y divide-border">{CHECKS.map((check, i) => <li key={check} className="flex min-h-16 items-center justify-between gap-3 py-3"><div><span>{check}</span>{tested > i && failures[i] && <p role="alert" className="mt-1 text-sm text-destructive">{failures[i]}</p>}</div>{tested > i ? failures[i] ? <span className="text-destructive">Failed</span> : <span className="flex items-center gap-1 text-success"><Check />Passed</span> : running && tested === i ? <LoaderCircle className="animate-spin text-accent motion-reduce:animate-none" /> : <span className="text-xs text-muted-foreground">Pending</span>}</li>)}</ul><Button onClick={runTest} disabled={running} className="h-12 w-full">{running ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <CheckCircle2 />}{running ? "Testing…" : "Run self-test"}</Button>{passed && <p role="status" className="text-sm text-success">All checks passed. Device ready to return to service.</p>}</div>}
    {name === "Done" && <div className="rounded-md border border-success/40 bg-card p-5"><CheckCircle2 className="mb-3 text-success" /><h3 className="text-xl font-semibold">Visit complete</h3><p className="mt-2 font-mono text-sm text-muted-foreground">Time on site · {Math.floor(duration / 60)}m {duration % 60}s</p><h4 className="mt-5 text-sm font-semibold">Actions taken</h4><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{checked.map((item) => <li key={item}>✓ {item}</li>)}{gauge !== null && <li>✓ Calibrated to {gauge.toFixed(2)} m</li>}<li>✓ Power, sensor, camera and uplink self-test</li>{photo && <li>✓ Site photo attached</li>}</ul><div className="mt-5 space-y-2 border-t border-border pt-4 text-sm"><p className="text-primary">Before · {before}</p><p className="text-success">After · {after}</p></div>{notes && <p className="mt-4 break-words text-sm text-muted-foreground">{notes}</p>}</div>}
    <div className="flex gap-3 border-t border-border pt-5"><Button variant="outline" className="h-12" disabled={running} onClick={() => step === 0 ? onCancel() : setStep((v) => v - 1)}><ArrowLeft />{step === 0 ? "Cancel" : "Back"}</Button>{name === "Done" ? <Button className="h-12 flex-1" disabled={!passed} onClick={resolve}><CheckCircle2 />Mark resolved</Button> : <Button className="h-12 flex-1" onClick={next} disabled={name === "Arrive" ? arrived === null : name === "Inspect" ? !inspected : name === "Calibrate" ? gauge === null : name === "Self-test" ? !passed : false}>Continue<ArrowRight /></Button>}</div>
  </section>;
}