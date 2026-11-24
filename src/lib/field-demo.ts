export type DeviceStatus = "Healthy" | "Needs attention" | "Offline";
export type IssueKind = "offline" | "battery" | "camera" | "drift";
export type Issue = { kind: IssueKind; severity: "Critical" | "Warning"; title: string; reason: string };
export type Visit = { id: string; date: string; technician: string; actions: string[]; notes: string; photo: boolean; duration: number; before: string; after: string };
export type Device = { id: string; site: string; zone: string; distance: number; x: number; y: number; status: DeviceStatus; water: number; battery: number; solar: boolean; signal: number; heartbeat: string; camera: string; drift: number; offset: number; readings: number[]; issues: Issue[]; history: Visit[] };
export type DemoEvent = { ts: number; text: string; kind: "ok" | "warn" | "bad" };

export function createDevices(): Device[] {
  const sites = [
    { id: "WL-R2", site: "River gauge R2", zone: "Z1 · Riverdale Center", distance: 1.2, x: 48, y: 42, water: 2.84, battery: 76, solar: true, signal: 4, heartbeat: "1 min ago", camera: "Clear", drift: 14, issues: [{ kind: "drift", severity: "Warning", title: "Water level drifted +14 cm vs gauge", reason: "An inaccurate level can trigger early or delayed flood alerts." }] },
    { id: "WL-M1", site: "Mill St culvert", zone: "Z1 · Riverdale Center", distance: 1.8, x: 60, y: 53, water: 1.43, battery: 68, solar: true, signal: 3, heartbeat: "2 min ago", camera: "Lens obscured", drift: 1, issues: [{ kind: "camera", severity: "Warning", title: "Camera lens obscured", reason: "Operators cannot visually confirm rising water or blocked drainage." }] },
    { id: "WL-H3", site: "Hill Rd slope", zone: "Z4 · East Ridge", distance: 3.1, x: 83, y: 30, water: 0.32, battery: 92, solar: true, signal: 4, heartbeat: "1 min ago", camera: "Clear", drift: 0, issues: [] },
    { id: "WL-B4", site: "Bridge B4", zone: "Z3 · South Bend", distance: 2.1, x: 48, y: 73, water: 2.12, battery: 84, solar: true, signal: 4, heartbeat: "Just now", camera: "Clear", drift: 1, issues: [] },
    { id: "WL-R5", site: "River gauge R5", zone: "Z2 · West Fields", distance: 2.4, x: 29, y: 38, water: 2.65, battery: 12, solar: false, signal: 2, heartbeat: "4 min ago", camera: "Clear", drift: 0, issues: [{ kind: "battery", severity: "Critical", title: "Battery 12%, not charging", reason: "Loss of power would stop readings and leave this flood zone unmonitored." }] },
    { id: "WL-C9", site: "Culvert C9", zone: "Z2 · West Fields", distance: 4.6, x: 19, y: 67, water: 1.78, battery: 54, solar: false, signal: 0, heartbeat: "3 h ago", camera: "Unavailable", drift: 0, issues: [{ kind: "offline", severity: "Critical", title: "Offline for 3 h", reason: "No current readings reach the console; local flooding could go undetected." }] },
  ] satisfies Omit<Device, "status" | "offset" | "readings" | "history">[];
  return sites.map((s) => ({ ...s, status: s.issues.some((i) => i.kind === "offline") ? "Offline" : s.issues.length ? "Needs attention" : "Healthy", offset: 0, readings: Array.from({ length: 24 }, (_, i) => Math.max(0.1, s.water - (23 - i) * 0.015 + Math.sin(i * 0.8) * 0.06)), history: [
    { id: `${s.id}-past-1`, date: "2026-11-19T10:15:00Z", technician: "Priya Rai", actions: ["Enclosure checked", "Signal verified"], notes: "Routine inspection completed.", photo: false, duration: 780, before: "Routine check", after: "Healthy" },
    { id: `${s.id}-past-2`, date: "2026-11-05T09:30:00Z", technician: "Arun Shah", actions: ["Sensor cleaned", "Staff gauge verified"], notes: "Seasonal maintenance.", photo: false, duration: 1080, before: "Scheduled service", after: "Healthy" },
  ] }));
}

export function deviceCounts(devices: Device[]) {
  return { healthy: devices.filter((d) => d.status === "Healthy").length, attention: devices.filter((d) => d.status === "Needs attention").length, offline: devices.filter((d) => d.status === "Offline").length };
}
export function urgency(d: Device) { return d.status === "Offline" ? 0 : d.issues.some((i) => i.severity === "Critical") ? 1 : d.status === "Needs attention" ? 2 : 3; }
export function checklistFor(device: Device): string[] {
  const items = ["Check enclosure is sealed"];
  for (const issue of device.issues) {
    if (issue.kind === "battery") items.push("Replace battery pack", "Check solar panel is not shaded");
    if (issue.kind === "camera") items.push("Clean camera lens");
    if (issue.kind === "offline") items.push("Check power connections", "Check solar panel is not shaded", "Reseat antenna");
    if (issue.kind === "drift") items.push("Clean water-level sensor", "Check sensor mounting is secure");
  }
  return items;
}
export function needsCalibration(device: Device) { return device.issues.some((i) => i.kind === "drift"); }
export function calibrationOffset(deviceReading: number, gaugeReading: number) { return Math.round((gaugeReading - deviceReading) * 1000) / 1000; }
export function inspectionComplete(required: string[], checked: string[]) { return required.every((item) => checked.includes(item)); }
export function selfTestFailure(check: string, required: string[], checked: string[]): string | null {
  const missing = required.filter((item) => !checked.includes(item));
  const relevant = missing.filter((item) => check === "Power" ? /battery|solar|power/i.test(item) : check === "Camera" ? /camera/i.test(item) : check === "Uplink to Waterline" ? /antenna/i.test(item) : /enclosure|sensor/i.test(item));
  return relevant.length ? `Complete: ${relevant.join(", ")}.` : null;
}
export function resolveDevice(device: Device, visit: Visit, gauge: number | null): Device {
  const batteryFixed = device.issues.some((i) => i.kind === "battery");
  return { ...device, status: "Healthy", issues: [], battery: batteryFixed ? 96 : device.battery, solar: true, signal: 4, heartbeat: "Just now", camera: "Clear", drift: 0, offset: gauge === null ? device.offset : calibrationOffset(device.water, gauge), water: gauge ?? device.water, readings: gauge === null ? device.readings : device.readings.map((v) => Math.max(0, v + calibrationOffset(device.water, gauge))), history: [visit, ...device.history] };
}