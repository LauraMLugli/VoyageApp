export function money(value: number): string {
  const neg = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "- " : ""}R$ ${withDots},${dec}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function time(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateShort(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function dateTime(ts: number): string {
  return `${dateShort(ts)} ${time(ts)}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// "Hoje, 08:42" / "Ontem, 18:10" / "05/10/2026, 09:10"
export function relativeDay(ts: number): string {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000);
  if (diff === 0) return `Hoje, ${time(ts)}`;
  if (diff === 1) return `Ontem, ${time(ts)}`;
  return `${dateShort(ts)}, ${time(ts)}`;
}

// Tempo restante até uma data: "2d 4h", "3h 10min", "25min" ou "Expirado"
export function remaining(ts: number): string {
  const ms = ts - Date.now();
  if (ms <= 0) return "Expirado";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${Math.max(mins, 1)}min`;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function maskCardNumber(number: string): string {
  const d = number.replace(/\D/g, "");
  return `•••• •••• •••• ${d.slice(-4)}`;
}

export function initials(name?: string): string {
  if (!name) return "V";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "V";
}

// minúsculas e sem acentos, para buscas
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function parseAmount(text: string): number {
  const n = parseFloat(text.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
