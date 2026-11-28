import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { RoleGate, useSession } from "@/components/SessionContext";
import { useFieldDemo } from "@/components/FieldDemoContext";
import { ACCESS, AREA_LABEL, DEMO_USERS, ROLE_LABEL, type Area, type Role } from "@/lib/demo-users";
import { deviceCounts } from "@/lib/field-demo";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — FloodLink" }, { name: "description", content: "Users, roles and access across FloodLink." }, { property: "og:title", content: "Administration — FloodLink" }, { property: "og:description", content: "Manage FloodLink users, roles and access." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <RoleGate area="admin"><Admin /></RoleGate>,
});

const AREAS = Object.keys(AREA_LABEL) as Area[];
const ROLES = Object.keys(ROLE_LABEL) as Role[];

function Admin() {
  const { user } = useSession();
  const { devices, reports, alerts } = useFieldDemo();
  if (!user) return null;
  const counts = deviceCounts(devices);
  const stats = [
    { label: "Users", value: DEMO_USERS.length },
    { label: "Sensors healthy", value: `${counts.healthy}/${devices.length}` },
    { label: "Open reports", value: reports.filter((r) => r.status !== "Resolved").length },
    { label: "Alerts sent", value: alerts.length },
  ];
  return <div className="min-h-screen"><AppHeader area="admin" subtitle={`${user.name} · ${user.title}`} /><main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
    <section className="grid gap-3 sm:grid-cols-4">{stats.map((s) => <div key={s.label} className="rounded-md border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-2 font-mono text-2xl">{s.value}</p></div>)}</section>
    <section><h2 className="mb-3 font-semibold">Users</h2><div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-card font-mono text-xs text-muted-foreground"><tr>{["Name", "Role", "Title", "Zone", "Phone"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead><tbody>{DEMO_USERS.map((u) => <tr key={u.id} className="border-t border-border"><td className="px-4 py-3 font-semibold">{u.name}</td><td className="px-4 py-3 text-accent">{ROLE_LABEL[u.role]}</td><td className="px-4 py-3">{u.title}</td><td className="px-4 py-3">{u.zone}</td><td className="px-4 py-3 font-mono text-xs">{u.phone}</td></tr>)}</tbody></table></div></section>
    <section><h2 className="mb-3 font-semibold">Role access</h2><div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-card text-xs text-muted-foreground"><tr><th className="px-4 py-2">Role</th>{AREAS.map((a) => <th key={a} className="px-4 py-2 text-center">{AREA_LABEL[a]}</th>)}</tr></thead><tbody>{ROLES.map((r) => <tr key={r} className="border-t border-border"><td className="px-4 py-3">{ROLE_LABEL[r]}</td>{AREAS.map((a) => <td key={a} className="px-4 py-3 text-center">{ACCESS[r].includes(a) ? <Check size={16} className="mx-auto text-success" aria-label="Allowed" /> : <Minus size={16} className="mx-auto text-muted-foreground" aria-label="Not allowed" />}</td>)}</tr>)}</tbody></table></div></section>
  </main></div>;
}
