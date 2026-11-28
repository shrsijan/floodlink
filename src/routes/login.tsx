import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/components/SessionContext";
import { ACCESS, AREA_LABEL, DEMO_USERS, ROLE_LABEL } from "@/lib/demo-users";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — FloodLink" }, { name: "description", content: "Choose a demo account to explore FloodLink as a resident, technician, engineer, responder or administrator." }, { property: "og:title", content: "Sign in — FloodLink" }, { property: "og:description", content: "Role-based demo accounts for the FloodLink flood alert platform." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Login,
});

function Login() {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const choose = async (id: string) => {
    const next = signIn(id);
    if (next) await navigate({ to: next.home });
  };
  return <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 sm:px-6"><div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded bg-primary font-mono font-semibold text-primary-foreground">FL</div><div><h1 className="text-2xl font-bold">Sign in to FloodLink</h1><p className="text-sm text-muted-foreground">Demo accounts · no password required{user ? ` · currently ${user.name}` : ""}</p></div></div><ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{DEMO_USERS.map((u) => <li key={u.id}><button onClick={() => choose(u.id)} className={`flex h-full w-full flex-col rounded-md border bg-card p-5 text-left transition-colors hover:border-accent ${user?.id === u.id ? "border-accent" : "border-border"}`}><span className="font-mono text-[10px] uppercase text-accent">{ROLE_LABEL[u.role]}</span><span className="mt-2 text-lg font-semibold">{u.name}</span><span className="text-xs text-muted-foreground">{u.title} · {u.zone}</span><span className="mt-3 text-sm">{u.summary}</span><span className="mt-4 flex flex-wrap gap-1">{ACCESS[u.role].map((a) => <span key={a} className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{AREA_LABEL[a]}</span>)}</span><span className="mt-auto flex items-center gap-1 pt-4 text-sm text-accent">Sign in as {u.name.split(" ")[0]}<ArrowRight size={14} /></span></button></li>)}</ul></main>;
}
