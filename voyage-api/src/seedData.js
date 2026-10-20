// Dados de referência: paradas, linhas e catálogo de passes.
// (mesmos dados que o app já usava; agora o servidor é a fonte da verdade)
export const STOPS = [
  { id: "term", name: "Terminal Central", x: 180, y: 230 },
  { id: "centro", name: "Praça Central", x: 180, y: 140 },
  { id: "vilarosa", name: "Vila Rosa", x: 60, y: 90 },
  { id: "avprinc", name: "Av. Principal", x: 240, y: 110 },
  { id: "hosp", name: "Hospital Municipal", x: 300, y: 80 },
  { id: "fatec", name: "Fatec", x: 300, y: 200 },
  { id: "rodo", name: "Rodoviária", x: 100, y: 230 },
  { id: "jdsao", name: "Jardim São Sebastião", x: 70, y: 350 },
  { id: "norte", name: "Jardim Norte", x: 180, y: 40 },
  { id: "parque", name: "Parque Municipal", x: 190, y: 370 },
  { id: "distrito", name: "Distrito Industrial", x: 330, y: 285 },
  { id: "matao", name: "Matão", x: 335, y: 420 },
];

export const LINES = [
  { id: "201", code: "201", name: "Centro · Vila Rosa", kind: "urbana", color: "#0951A0", fareCents: 550, stopIds: ["term", "centro", "vilarosa"] },
  { id: "302", code: "302", name: "Terminal · Jardim São Sebastião", kind: "urbana", color: "#F2A900", fareCents: 550, stopIds: ["term", "rodo", "jdsao"] },
  { id: "405", code: "405", name: "Centro · Hospital", kind: "urbana", color: "#7B2CFF", fareCents: 550, stopIds: ["centro", "avprinc", "hosp"] },
  { id: "118", code: "118", name: "Fatec · Centro", kind: "urbana", color: "#00C9A7", fareCents: 550, stopIds: ["fatec", "term", "centro"] },
  { id: "507", code: "507", name: "Jardim Norte · Parque", kind: "urbana", color: "#E5484D", fareCents: 550, stopIds: ["norte", "centro", "term", "parque"] },
  { id: "710", code: "710", name: "Taquaritinga · Matão", kind: "regional", color: "#192440", fareCents: 1200, stopIds: ["term", "fatec", "distrito", "matao"] },
];

export const PASS_CATALOG = [
  { id: "unico-urbano", kind: "unico", scope: "urbano", name: "Passe único", description: "Uma viagem dentro da cidade.", priceCents: 550, durationHours: 24, uses: 1 },
  { id: "diario-urbano", kind: "diario", scope: "urbano", name: "Passe diário", description: "Viagens ilimitadas por 24 horas.", priceCents: 1600, durationHours: 24, uses: null },
  { id: "mensal-urbano", kind: "mensal", scope: "urbano", name: "Passe mensal", description: "Mobilidade urbana por 30 dias.", priceCents: 14500, durationHours: 720, uses: null },
  { id: "unico-regional", kind: "unico", scope: "regional", name: "Passe regional único", description: "Uma viagem entre cidades da região.", priceCents: 1200, durationHours: 24, uses: 1 },
  { id: "diario-regional", kind: "diario", scope: "regional", name: "Passe regional diário", description: "Urbano e regional ilimitado por 24 horas.", priceCents: 3800, durationHours: 24, uses: null },
  { id: "mensal-regional", kind: "mensal", scope: "regional", name: "Passe regional mensal", description: "Urbano e regional ilimitado por 30 dias.", priceCents: 32000, durationHours: 720, uses: null },
];
