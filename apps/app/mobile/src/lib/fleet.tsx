import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { applyTransit, Bus, createFleet, LINE_MAP, stepFleet, TransitData } from "./transit";

const TICK_MS = 500; // movimento suave no app
const POLL_MS = 5000; // atualiza a posição dos ônibus publicados no Supabase

const FleetContext = createContext<{ buses: Bus[] }>({ buses: [] });

const known = (list: Bus[]) => list.filter((b) => LINE_MAP[b.lineId]);

// Linhas, paradas e posições publicadas vêm do Supabase. Se não houver posições de ônibus,
// mantém a frota de exemplo e continua a simulação local.
export function FleetProvider({ children }: PropsWithChildren) {
  const [buses, setBuses] = useState<Bus[]>(() => createFleet());

  useEffect(() => {
    let cancelled = false;

    const loadBuses = async () => {
      try {
        const buses = await api.getBuses<Bus[]>();
        if (!cancelled && buses.length > 0) setBuses(known(buses));
      } catch {
        // mantém a simulação local até a conexão voltar
      }
    };

    (async () => {
      try {
        const transit = await api.getTransitData<TransitData>();
        if (cancelled) return;
        applyTransit(transit);
        await loadBuses();
      } catch {
        // offline: usa linhas e paradas embutidas
      }
    })();

    const poll = setInterval(loadBuses, POLL_MS);
    const step = setInterval(() => setBuses((prev) => stepFleet(prev, TICK_MS / 1000)), TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(step);
    };
  }, []);

  return <FleetContext.Provider value={{ buses }}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  return useContext(FleetContext);
}
