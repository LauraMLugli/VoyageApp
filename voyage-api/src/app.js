import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { HttpError } from "./errors.js";
import { buildRoutes } from "./routes/index.js";
import { getUser } from "./services/accounts.js";

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: config.jwtExpires });
}

export function createApp({ db, fleet, pay }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((s) => s.trim()) }));
  app.use(express.json({ limit: "100kb" }));

  // Exige "Authorization: Bearer <token>" e descobre quem é o usuário.
  const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next(new HttpError(401, "Faça login para continuar."));
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = getUser(db, Number(payload.sub));
      if (!user) throw new Error("usuário não existe mais");
      req.userId = user.id;
      next();
    } catch {
      next(new HttpError(401, "Sessão expirada. Entre novamente."));
    }
  };

  const router = express.Router();
  for (const route of buildRoutes({ db, fleet, pay, signToken })) {
    router[route.method](route.path, ...(route.auth ? [requireAuth] : []), (req, res, next) => {
      Promise.resolve(
        route.handler({
          userId: req.userId,
          body: req.body ?? {},
          params: req.params,
          query: req.query,
          ip: req.ip,
        }),
      )
        .then((out) => res.status(out.status ?? 200).json(out.body))
        .catch(next);
    });
  }
  app.use("/api", router);

  app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido." });
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}
