import { createContext, useContext, useState, type ReactNode } from "react";
import { createDevices, resolveDevice, type Device, type DemoEvent, type Visit } from "@/lib/field-demo";

type DemoState = { devices: Device[]; events: DemoEvent[]; completeVisit: (id: string, visit: Visit, gauge: number | null) => void; reset: () => void };
const FieldDemoContext = createContext<DemoState | null>(null);
export function FieldDemoProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState(createDevices);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const completeVisit = (id: string, visit: Visit, gauge: number | null) => {
    setDevices((list) => list.map((d) => d.id === id ? resolveDevice(d, visit, gauge) : d));
    setEvents((list) => [{ ts: Date.now(), text: `${id} restored by field volunteer Priya Rai`, kind: "ok" }, ...list]);
  };
  return <FieldDemoContext.Provider value={{ devices, events, completeVisit, reset: () => { setDevices(createDevices()); setEvents([]); } }}>{children}</FieldDemoContext.Provider>;
}
export function useFieldDemo() {
  const value = useContext(FieldDemoContext);
  if (!value) throw new Error("Field demo provider is required");
  return value;
}