export type Role = "resident" | "technician" | "engineer" | "responder" | "admin";
export type Area = "console" | "field" | "resident" | "responder" | "admin";
export type HomePath = "/" | "/field" | "/resident" | "/responder" | "/admin";
export type DemoUser = { id: string; name: string; role: Role; title: string; zone: string; phone: string; home: HomePath; summary: string };

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  technician: "Field Technician",
  engineer: "Network Engineer",
  responder: "Emergency Responder",
  admin: "Administrator",
};

export const AREA_LABEL: Record<Area, string> = {
  console: "Routing Console",
  field: "Field Devices",
  resident: "Resident Portal",
  responder: "Response Desk",
  admin: "Administration",
};

export const AREA_HOME: Record<Area, HomePath> = { console: "/", field: "/field", resident: "/resident", responder: "/responder", admin: "/admin" };

export const ACCESS: Record<Role, Area[]> = {
  resident: ["resident"],
  technician: ["field"],
  engineer: ["console", "field"],
  responder: ["responder", "console"],
  admin: ["admin", "console", "field", "responder", "resident"],
};

export const DEMO_USERS: DemoUser[] = [
  { id: "maya.gurung", name: "Maya Gurung", role: "resident", title: "Resident", zone: "Z2 · West Fields", phone: "+1 555 0101", home: "/resident", summary: "Receives flood alerts for her zone and reports flooding." },
  { id: "priya.rai", name: "Priya Rai", role: "technician", title: "Sensor Volunteer", zone: "Riverdale network", phone: "+1 555 0102", home: "/field", summary: "Maintains, calibrates and restores assigned flood sensors." },
  { id: "daniel.mensah", name: "Daniel Mensah", role: "engineer", title: "Regional Network Engineer", zone: "Riverdale region", phone: "+1 555 0103", home: "/", summary: "Runs alert routing, carrier failover, satellite alerts and latency audits." },
  { id: "sara.thapa", name: "Sara Thapa", role: "responder", title: "EMS Dispatcher", zone: "Riverdale region", phone: "+1 555 0104", home: "/responder", summary: "Triages resident reports and dispatches emergency crews." },
  { id: "alex.morgan", name: "Alex Morgan", role: "admin", title: "System Administrator", zone: "All zones", phone: "+1 555 0105", home: "/admin", summary: "Manages users and roles with access to every area." },
];

export function findUser(id: string | null | undefined) {
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}

export function canAccess(user: DemoUser | null, area: Area) {
  return !!user && ACCESS[user.role].includes(area);
}
