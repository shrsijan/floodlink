import { Link } from "@tanstack/react-router";
import { UserBadge, useSession } from "@/components/SessionContext";
import { ACCESS, AREA_HOME, AREA_LABEL, type Area } from "@/lib/demo-users";

export function AreaNav({ current }: { current: Area }) {
  const { user } = useSession();
  if (!user) return null;
  const others = ACCESS[user.role].filter((a) => a !== current);
  if (!others.length) return null;
  return <nav className="flex flex-wrap gap-1" aria-label="Areas">{others.map((a) => <Link key={a} to={AREA_HOME[a]} className="rounded px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">{AREA_LABEL[a]}</Link>)}</nav>;
}

export function AppHeader({ area, subtitle }: { area: Area; subtitle: string }) {
  return <header className="border-b border-border bg-card/60 backdrop-blur"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded bg-primary font-mono font-semibold text-primary-foreground">FL</div><div><p className="text-lg font-bold leading-tight">{AREA_LABEL[area]}</p><p className="text-xs text-muted-foreground">{subtitle}</p></div></div><div className="flex flex-wrap items-center gap-2"><AreaNav current={area} /><UserBadge /></div></div></header>;
}
