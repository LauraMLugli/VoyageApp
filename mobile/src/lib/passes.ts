export type PassKind = "unico" | "diario" | "mensal";
export type PassScope = "urbano" | "regional";

export type PassDef = {
  id: string;
  kind: PassKind;
  scope: PassScope;
  name: string;
  description: string;
  price: number;
  durationHours: number;
  uses: number | null; // null = viagens ilimitadas
};

export type OwnedPass = {
  id: string;
  passId: string;
  name: string;
  kind: PassKind;
  scope: PassScope;
  price: number;
  purchasedAt: number;
  expiresAt: number;
  usesLeft: number | null;
  expiryNotified?: boolean;
};

export const KIND_LABEL: Record<PassKind, string> = {
  unico: "Único",
  diario: "Diário",
  mensal: "Mensal",
};

export const SCOPE_LABEL: Record<PassScope, string> = {
  urbano: "Dentro da cidade",
  regional: "Regional",
};

// Preços alinhados com a versão web (app.js)
export const PASS_CATALOG: PassDef[] = [
  { id: "unico-urbano", kind: "unico", scope: "urbano", name: "Passe único", description: "Uma viagem dentro da cidade.", price: 5.5, durationHours: 24, uses: 1 },
  { id: "diario-urbano", kind: "diario", scope: "urbano", name: "Passe diário", description: "Viagens ilimitadas por 24 horas.", price: 16, durationHours: 24, uses: null },
  { id: "mensal-urbano", kind: "mensal", scope: "urbano", name: "Passe mensal", description: "Mobilidade urbana por 30 dias.", price: 145, durationHours: 720, uses: null },
  { id: "unico-regional", kind: "unico", scope: "regional", name: "Passe regional único", description: "Uma viagem entre cidades da região.", price: 12, durationHours: 24, uses: 1 },
  { id: "diario-regional", kind: "diario", scope: "regional", name: "Passe regional diário", description: "Urbano e regional ilimitado por 24 horas.", price: 38, durationHours: 24, uses: null },
  { id: "mensal-regional", kind: "mensal", scope: "regional", name: "Passe regional mensal", description: "Urbano e regional ilimitado por 30 dias.", price: 320, durationHours: 720, uses: null },
];

export function isPassActive(
  p: { expiresAt: number; usesLeft: number | null },
  now: number = Date.now(),
): boolean {
  return p.expiresAt > now && (p.usesLeft === null || p.usesLeft > 0);
}

// Passe regional cobre linhas urbanas e regionais; passe urbano cobre só urbanas.
export function passCoversLine(scope: PassScope, lineKind: "urbana" | "regional"): boolean {
  return scope === "regional" || lineKind === "urbana";
}
