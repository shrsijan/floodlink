import { describe, expect, it } from "vitest";
import { ACCESS, DEMO_USERS, canAccess, findUser, type Role } from "@/lib/demo-users";
import { createDevices } from "@/lib/field-demo";
import { advanceReport, seedReports, sortReports, zoneId, zoneStatus, type FloodReport } from "@/lib/flood-reports";

describe("Demo users", () => {
  it("has one account for each of the five roles", () => {
    expect(DEMO_USERS).toHaveLength(5);
    expect(new Set(DEMO_USERS.map((u) => u.role))).toEqual(new Set<Role>(["resident", "technician", "engineer", "responder", "admin"]));
  });
  it("has unique ids", () => { expect(new Set(DEMO_USERS.map((u) => u.id)).size).toBe(DEMO_USERS.length); });
  it("lets every user reach their own home area", () => {
    const homeArea = { "/": "console", "/field": "field", "/resident": "resident", "/responder": "responder", "/admin": "admin" } as const;
    for (const u of DEMO_USERS) expect(canAccess(u, homeArea[u.home])).toBe(true);
  });
  it("keeps residents out of operator areas", () => {
    const resident = findUser("maya.gurung");
    expect(canAccess(resident, "console")).toBe(false);
    expect(canAccess(resident, "field")).toBe(false);
    expect(canAccess(resident, "admin")).toBe(false);
  });
  it("restricts administration to admins", () => {
    for (const role of Object.keys(ACCESS) as Role[]) expect(ACCESS[role].includes("admin")).toBe(role === "admin");
  });
  it("denies access with no signed-in user", () => { expect(canAccess(null, "resident")).toBe(false); });
});

describe("Zone status and reports", () => {
  it("matches zones written with or without a separator", () => { expect(zoneId("Z2 · West Fields")).toBe("Z2"); expect(zoneId("Z2 West Fields")).toBe("Z2"); });
  it("puts West Fields on warning with one offline sensor", () => {
    const s = zoneStatus(createDevices(), "Z2 · West Fields");
    expect(s.level).toBe("Warning"); expect(s.offline).toBe(1); expect(s.sensors).toHaveLength(2);
  });
  it("keeps East Ridge normal", () => { expect(zoneStatus(createDevices(), "Z4 · East Ridge").level).toBe("Normal"); });
  it("moves a report from submitted to dispatched to resolved", () => {
    const [r] = seedReports(0); if (!r) throw new Error("Missing seed");
    const dispatched = advanceReport(r, "Sara Thapa");
    expect(dispatched.status).toBe("Dispatched"); expect(dispatched.responder).toBe("Sara Thapa");
    const resolved = advanceReport(dispatched, "Sara Thapa");
    expect(resolved.status).toBe("Resolved");
    expect(advanceReport(resolved, "Sara Thapa")).toBe(resolved);
  });
  it("lists trapped people before other open reports and resolved last", () => {
    const base: Omit<FloodReport, "id" | "kind" | "status"> = { ts: 0, zone: "Z1", reporter: "x", details: "", responder: null };
    const sorted = sortReports([
      { ...base, id: "a", kind: "Water rising", status: "Submitted" },
      { ...base, id: "b", kind: "People trapped", status: "Resolved" },
      { ...base, id: "c", kind: "People trapped", status: "Submitted" },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});
