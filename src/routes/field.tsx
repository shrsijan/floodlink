import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Radio, UserRound } from "lucide-react";
import { AreaNav } from "@/components/AppHeader";
import { RoleGate, UserBadge, useSession } from "@/components/SessionContext";
import { ROLE_LABEL } from "@/lib/demo-users";

export const Route = createFileRoute("/field")({ component: () => <RoleGate area="field"><FieldLayout /></RoleGate> });
function FieldLayout() {
  const { user } = useSession();
  if (!user) return null;
  const scope = user.role === "technician" ? `${user.title} · 6 devices assigned` : `${ROLE_LABEL[user.role]} · viewing all field devices`;
  return <div className="min-h-screen"><header className="border-b border-border bg-card/60"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link to="/field" className="flex items-center gap-2 font-semibold"><Radio className="text-accent" />Field Technician</Link><div className="flex flex-wrap items-center gap-2"><AreaNav current="field" /><UserBadge /></div></div></header><main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6"><div className="mb-7 flex items-start gap-3 border-b border-border pb-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-secondary text-accent"><UserRound size={20} /></div><div><p className="text-sm">Signed in as <strong>{user.name}</strong> · {scope}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">SIMULATED FIELD SESSION</p></div></div><Outlet /></main></div>;
}
