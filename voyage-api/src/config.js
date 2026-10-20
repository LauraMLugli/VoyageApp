// Carrega o arquivo .env (se existir). Sem .env, usa os valores padrão abaixo.
try {
  process.loadEnvFile();
} catch {
  // sem .env: tudo bem em desenvolvimento
}

const DEFAULT_SECRET = "e2cf87f4f31ca47d3de92f98cf952b494b4f56bd0c3a30a12fb7d47bfca8165e8a473ec067d2d79b9ad86a7c909e5477";

export const config = {
  port: Number(process.env.PORT) || 3333,
  jwtSecret: process.env.JWT_SECRET || DEFAULT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || "30d",
  dbPath: process.env.DB_PATH || "./data/voyage.db",
  seedDemo: process.env.SEED_DEMO !== "false",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  isProd: process.env.NODE_ENV === "production",
};

if (config.isProd && config.jwtSecret === DEFAULT_SECRET) {
  throw new Error("Defina JWT_SECRET no .env antes de rodar em produção.");
}
