import { randomUUID } from "node:crypto";

export const uid = () => randomUUID();
export const now = () => Date.now();

// O banco guarda dinheiro em CENTAVOS (inteiros) para nunca ter erro de arredondamento.
// A API conversa em reais (ex.: 42.8).
export const toCents = (reais) => Math.round(Number(reais) * 100);
export const fromCents = (cents) => cents / 100;

export function money(cents) {
  const neg = cents < 0;
  const [int, dec] = (Math.abs(cents) / 100).toFixed(2).split(".");
  return `${neg ? "- " : ""}R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}

export function remaining(ts, from = now()) {
  const ms = ts - from;
  if (ms <= 0) return "Expirado";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${Math.max(mins, 1)}min`;
}
