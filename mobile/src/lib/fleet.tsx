import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { applyTransit, Bus, createFleet, LINE_MAP, stepFleet, TransitData } from "./transit";

const TICK_MS = 500; // movimento suave no app
const POLL_MS = 5000; // a cada 5 s pergunta à API onde os ônibus realmente estão

const FleetContext = createContext<{ buses: Bus[] }>({ buses: [] });

const known = (list: Bus[]) => list.filter((b) => LINE_MAP[b.lineId]);

// Linhas, paradas e posição dos ônibus vêm da API.
// Entre uma consulta e outra, o app continua movendo os ônibus localmente (mesma regra do
// servidor); a cada consulta ele se realinha com a posição oficial.
// Sem conexão, usa a frota de exemplo embutida.
export function FleetProvider({ children }: PropsWithChildren) {
  const [buses, setBuses] = useState<Bus[]>(() => createFleet());

  useEffect(() => {
    let cancelled = false;

    const loadBuses = async () => {
      try {
        const res = await api.get<{ buses: Bus[] }>("/buses");
        if (!cancelled) setBuses(known(res.buses));
      } catch {
        // mantém a simulação local até a conexão voltar
      }
    };

    (async () => {
      try {
        const transit = await api.get<TransitData>("/transit");
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
