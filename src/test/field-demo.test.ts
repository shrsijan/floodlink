import { describe, expect, it } from "vitest";
import { calibrationOffset, checklistFor, createDevices, deviceCounts, inspectionComplete, needsCalibration, resolveDevice, selfTestFailure, urgency, type Device, type Visit } from "@/lib/field-demo";

function device(id: string): Device {
  const value = createDevices().find((d) => d.id === id);
  if (!value) throw new Error(`Missing ${id}`);
  return value;
}
describe("Field demo rules", () => {
  it("assigns six devices with three needing attention and one offline", () => {
    expect(createDevices()).toHaveLength(6);
    expect(deviceCounts(createDevices())).toEqual({ healthy: 2, attention: 3, offline: 1 });
  });
  it("starts C9 offline for 3 hours", () => { expect(device("WL-C9").status).toBe("Offline"); expect(device("WL-C9").heartbeat).toBe("3 h ago"); });
  it("starts R5 at 12 percent without charging", () => { expect(device("WL-R5").battery).toBe(12); expect(device("WL-R5").solar).toBe(false); });
  it("starts M1 with an obscured lens", () => { expect(device("WL-M1").camera).toBe("Lens obscured"); });
  it("starts R2 with positive 14 cm drift requiring calibration", () => { expect(device("WL-R2").drift).toBe(14); expect(needsCalibration(device("WL-R2"))).toBe(true); expect(needsCalibration(device("WL-R5"))).toBe(false); });
  it("orders offline before critical battery before healthy devices", () => { expect([...createDevices()].sort((a, b) => urgency(a) - urgency(b)).map((d) => d.id).slice(0, 2)).toEqual(["WL-C9", "WL-R5"]); });
  it("blocks inspection until every required battery task is done", () => {
    const required = checklistFor(device("WL-R5"));
    expect(required).toContain("Replace battery pack"); expect(required).toContain("Check solar panel is not shaded");
    expect(inspectionComplete(required, ["Check enclosure is sealed", "Replace battery pack"])).toBe(false);
    expect(inspectionComplete(required, required)).toBe(true);
  });
  it("fails power self-test if battery replacement was skipped", () => { const required = checklistFor(device("WL-R5")); expect(selfTestFailure("Power", required, required.filter((v) => v !== "Replace battery pack"))).toContain("Replace battery pack"); expect(selfTestFailure("Power", required, required)).toBeNull(); });
  it("computes minus 14 cm calibration for a 2.70 m physical gauge", () => { expect(calibrationOffset(2.84, 2.70)).toBe(-0.14); });
  it("restores R5, updates counts and records its visit", () => {
    const before = device("WL-R5");
    const visit: Visit = { id: "visit-1", date: "2026-11-24T14:32:00Z", technician: "Priya Rai", actions: checklistFor(before), notes: "Panel shade cleared", photo: true, duration: 120, before: "Battery 12%, not charging", after: "Healthy" };
    const resolved = resolveDevice(before, visit, null);
    expect(resolved.status).toBe("Healthy"); expect(resolved.battery).toBe(96); expect(resolved.solar).toBe(true); expect(resolved.issues).toEqual([]); expect(resolved.history[0]).toEqual(visit);
    expect(deviceCounts(createDevices().map((d) => d.id === resolved.id ? resolved : d))).toEqual({ healthy: 3, attention: 2, offline: 1 });
  });
  it("applies gauge calibration to the reading and offset", () => {
    const d = device("WL-R2"); const visit = d.history[0]; if (!visit) throw new Error("Missing history");
    const result = resolveDevice(d, visit, 2.70); expect(result.water).toBe(2.70); expect(result.offset).toBe(-0.14); expect(result.drift).toBe(0);
  });
});