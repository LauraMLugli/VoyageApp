import { useEffect, useState } from "react";

// Retorna o horário atual e re-renderiza a cada `ms` milissegundos.
export function useNow(ms: number = 30000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
