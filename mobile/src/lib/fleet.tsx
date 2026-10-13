import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Bus, createFleet, stepFleet } from "./transit";

const TICK_MS = 500;

const FleetContext = createContext<{ buses: Bus[] }>({ buses: [] });

// Posição dos ônibus atualizada em tempo real (simulada).
// Para usar uma API real, troque o setInterval por polling/WebSocket e
// faça setBuses(dadosDaApi).
export function FleetProvider({ children }: PropsWithChildren) {
  const [buses, setBuses] = useState<Bus[]>(() => createFleet());

  useEffect(() => {
    const id = setInterval(() => setBuses((prev) => stepFleet(prev, TICK_MS / 1000)), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return <FleetContext.Provider value={{ buses }}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  return useContext(FleetContext);
}
