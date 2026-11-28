import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { LogOut, ShieldAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_LABEL, ROLE_LABEL, canAccess, findUser, type Area, type DemoUser } from "@/lib/demo-users";

const STORAGE_KEY = "floodlink.demo-user";
type SessionState = { user: DemoUser | null; ready: boolean; signIn: (id: string) => DemoUser | null; signOut: () => void };
const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUserId(window.localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);
  const signIn = (id: string) => {
    const user = findUser(id);
    if (!user) return null;
    window.localStorage.setItem(STORAGE_KEY, user.id);
    setUserId(user.id);
    return user;
  };
  const signOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  };
  return <SessionContext.Provider value={{ user: findUser(userId), ready, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session provider is required");
  return value;
}

export function RoleGate({ area, children }: { area: Area; children: ReactNode }) {
  const { user, ready } = useSession();
  if (!ready) return <div className="min-h-screen" />;
  if (!user) return <Navigate to="/login" />;
  if (canAccess(user, area)) return <>{children}</>;
  return <div className="flex min-h-screen items-center justify-center px-4"><div className="max-w-md rounded-md border border-border bg-card p-6 text-center"><ShieldAlert className="mx-auto text-primary" /><h1 className="mt-3 text-xl font-semibold">No access to {AREA_LABEL[area]}</h1><p className="mt-2 text-sm text-muted-foreground">{user.name} is signed in as {ROLE_LABEL[user.role]}.</p><div className="mt-5 flex justify-center gap-2"><Button asChild className="h-11"><Link to={user.home}>Go to my home</Link></Button><Button asChild variant="outline" className="h-11"><Link to="/login">Switch user</Link></Button></div></div></div>;
}

export function UserBadge() {
  const { user, signOut } = useSession();
  if (!user) return null;
  return <div className="flex items-center gap-2"><Link to="/login" className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary" aria-label="Switch user"><UserRound size={14} className="text-accent" /><span className="font-semibold">{user.name}</span><span className="hidden text-muted-foreground sm:inline">· {ROLE_LABEL[user.role]}</span></Link><Button asChild variant="ghost" size="icon" className="h-9 w-9" aria-label="Sign out"><Link to="/login" onClick={signOut}><LogOut size={16} /></Link></Button></div>;
}
