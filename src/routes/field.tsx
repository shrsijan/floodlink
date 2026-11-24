import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, Radio, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/field")({ component: FieldLayout });
function FieldLayout() {
  return <div className="min-h-screen"><header className="border-b border-border bg-card/60"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link to="/field" className="flex items-center gap-2 font-semibold"><Radio className="text-accent" />Field Technician</Link><Button asChild variant="ghost" className="h-11"><Link to="/"><ArrowLeft /><span>Console</span></Link></Button></div></header><main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6"><div className="mb-7 flex items-start gap-3 border-b border-border pb-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-secondary text-accent"><UserRound size={20} /></div><div><p className="text-sm">Signed in as <strong>Priya Rai</strong> · Sensor Volunteer · 6 devices assigned</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">SIMULATED FIELD SESSION</p></div></div><Outlet /></main></div>;
}