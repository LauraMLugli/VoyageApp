import { HttpError } from "../errors.js";
import { hashPassword, verifyPassword } from "../security.js";
import { createUser, findByLogin, getUser, publicUser, updateUser } from "../services/accounts.js";
import { addFavLine, addFavRoute, removeFavLine, removeFavRoute } from "../services/favorites.js";
import { listNotices, markAllRead } from "../services/notifications.js";
import { getState } from "../services/state.js";
import * as wallet from "../services/wallet.js";

const EMAIL = /^\S+@\S+\.\S+$/;
const text = (v) => (typeof v === "string" ? v.trim() : "");

// Limite simples de tentativas de login (em memória): 10 a cada 15 min por IP + usuário.
const attempts = new Map();
function checkLoginRate(key) {
  const t = Date.now();
  const entry = attempts.get(key);
  if (entry && t - entry.first < 15 * 60000 && entry.count >= 10) {
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  }
  return entry && t - entry.first < 15 * 60000 ? entry : { first: t, count: 0 };
}

/**
 * Tabela de rotas. Cada handler recebe { userId, body, params, query, ip } e devolve
 * { status?, body }. O Express só liga isso a URLs (veja app.js), então a lógica
 * pode ser testada sem subir servidor.
 */
export function buildRoutes({ db, fleet, pay, signToken }) {
  // resposta padrão das ações: mensagem + estado atualizado da conta
  const done = (userId, message, status = 200) => ({ status, body: { message, state: getState(db, userId) } });

  return [
    /* -------------------------------- Públicas -------------------------------- */
    { method: "get", path: "/health", handler: async () => ({ body: { ok: true, name: "voyage-api", time: Date.now() } }) },
    { method: "get", path: "/transit", handler: async () => ({ body: { stops: fleet.transit.stops, lines: fleet.transit.lines } }) },
    {
      method: "get",
      path: "/buses",
      handler: async ({ query }) => ({ body: { buses: fleet.list(query.lineId || undefined), serverTime: Date.now() } }),
    },
    { method: "get", path: "/passes/catalog", handler: async () => ({ body: { passes: wallet.listCatalog(db) } }) },

    /* ---------------------------------- Auth ---------------------------------- */
    {
      method: "post",
      path: "/auth/register",
      handler: async ({ body }) => {
        const name = text(body.name);
        const usuario = text(body.usuario);
        const email = text(body.email);
        const senha = typeof body.senha === "string" ? body.senha : "";
        if (name.length < 3) throw new HttpError(400, "Informe seu nome completo.");
        if (usuario.length < 3 || /\s/.test(usuario)) throw new HttpError(400, "O usuário precisa ter 3 ou mais caracteres, sem espaços.");
        if (!EMAIL.test(email)) throw new HttpError(400, "Informe um e-mail válido.");
        if (senha.length < 6) throw new HttpError(400, "A senha precisa ter ao menos 6 caracteres.");
        const user = createUser(db, { name, usuario, email, passwordHash: hashPassword(senha) });
        return { status: 201, body: { token: signToken(user.id), user: publicUser(user) } };
      },
    },
    {
      method: "post",
      path: "/auth/login",
      handler: async ({ body, ip }) => {
        const login = text(body.login);
        const senha = typeof body.senha === "string" ? body.senha : "";
        if (!login || !senha) throw new HttpError(400, "Informe usuário e senha.");
        const key = `${ip}|${login.toLowerCase()}`;
        const entry = checkLoginRate(key);
        const user = findByLogin(db, login);
        if (!user || !verifyPassword(senha, user.password_hash)) {
          attempts.set(key, { first: entry.first, count: entry.count + 1 });
          throw new HttpError(401, "Usuário ou senha incorretos.");
        }
        attempts.delete(key);
        return { body: { token: signToken(user.id), user: publicUser(user) } };
      },
    },

    /* ------------------------------ Conta (logado) ------------------------------ */
    { method: "get", path: "/me", auth: true, handler: async ({ userId }) => ({ body: { user: publicUser(getUser(db, userId)) } }) },
    {
      method: "patch",
      path: "/me",
      auth: true,
      handler: async ({ userId, body }) => {
        const patch = {};
        if (body.name !== undefined) {
          if (text(body.name).length < 3) throw new HttpError(400, "Informe seu nome completo.");
          patch.name = text(body.name);
        }
        if (body.email !== undefined) {
          if (!EMAIL.test(text(body.email))) throw new HttpError(400, "Informe um e-mail válido.");
          patch.email = text(body.email);
        }
        return { body: { user: publicUser(updateUser(db, userId, patch)) } };
      },
    },
    { method: "get", path: "/me/state", auth: true, handler: async ({ userId }) => ({ body: { state: getState(db, userId) } }) },

    /* ---------------------------------- Cartão ---------------------------------- */
    {
      method: "put",
      path: "/card",
      auth: true,
      handler: async ({ userId, body }) => done(userId, wallet.linkCard(db, userId, body).message),
    },
    {
      method: "post",
      path: "/card/virtual",
      auth: true,
      handler: async ({ userId, body }) => done(userId, wallet.generateCard(db, userId, body).message, 201),
    },
    { method: "delete", path: "/card", auth: true, handler: async ({ userId }) => done(userId, wallet.unlinkCard(db, userId).message) },

    /* --------------------------- Recarga, passes e viagens --------------------------- */
    {
      method: "post",
      path: "/recharges",
      auth: true,
      handler: async ({ userId, body }) => done(userId, (await wallet.recharge(db, userId, body, pay)).message, 201),
    },
    { method: "get", path: "/recharges", auth: true, handler: async ({ userId }) => ({ body: { items: wallet.listTransactions(db, userId, { type: "recarga" }) } }) },
    { method: "get", path: "/passes", auth: true, handler: async ({ userId }) => ({ body: { passes: wallet.listPasses(db, userId) } }) },
    {
      method: "post",
      path: "/passes",
      auth: true,
      handler: async ({ userId, body }) => done(userId, wallet.buyPass(db, userId, text(body.passId)).message, 201),
    },
    {
      method: "post",
      path: "/trips",
      auth: true,
      handler: async ({ userId, body }) => done(userId, wallet.board(db, userId, text(body.lineId)).message, 201),
    },

    /* ----------------------------- Histórico e avisos ----------------------------- */
    {
      method: "get",
      path: "/transactions",
      auth: true,
      handler: async ({ userId, query }) => {
        const type = ["recarga", "passe", "viagem"].includes(query.type) ? query.type : undefined;
        return { body: { items: wallet.listTransactions(db, userId, { type, limit: query.limit }) } };
      },
    },
    { method: "get", path: "/notifications", auth: true, handler: async ({ userId }) => ({ body: { items: listNotices(db, userId) } }) },
    {
      method: "post",
      path: "/notifications/read-all",
      auth: true,
      handler: async ({ userId }) => {
        markAllRead(db, userId);
        return done(userId, "Notificações marcadas como lidas.");
      },
    },

    /* --------------------------------- Favoritos --------------------------------- */
    {
      method: "get",
      path: "/favorites",
      auth: true,
      handler: async ({ userId }) => {
        const { favLines, favRoutes } = getState(db, userId);
        return { body: { lines: favLines, routes: favRoutes } };
      },
    },
    {
      method: "put",
      path: "/favorites/lines/:lineId",
      auth: true,
      handler: async ({ userId, params }) => {
        addFavLine(db, userId, params.lineId);
        return done(userId, "Linha adicionada aos favoritos.");
      },
    },
    {
      method: "delete",
      path: "/favorites/lines/:lineId",
      auth: true,
      handler: async ({ userId, params }) => {
        removeFavLine(db, userId, params.lineId);
        return done(userId, "Linha removida dos favoritos.");
      },
    },
    {
      method: "post",
      path: "/favorites/routes",
      auth: true,
      handler: async ({ userId, body }) => {
        addFavRoute(db, userId, text(body.originId), text(body.destId));
        return done(userId, "Rota salva.", 201);
      },
    },
    {
      method: "delete",
      path: "/favorites/routes/:id",
      auth: true,
      handler: async ({ userId, params }) => {
        removeFavRoute(db, userId, params.id);
        return done(userId, "Rota removida.");
      },
    },
  ];
}
