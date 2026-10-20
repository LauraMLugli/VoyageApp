import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRoutes } from "../src/routes/index.js";
import { seedDemo } from "../src/seed.js";
import { FleetSimulator } from "../src/services/transit.js";
import { fakePay, freshDb } from "./helpers.js";

// Mini "cliente HTTP": acha a rota na tabela e chama o handler (sem Express).
function api() {
  const db = freshDb();
  seedDemo(db);
  const fleet = new FleetSimulator(db);
  const routes = buildRoutes({ db, fleet, pay: fakePay, signToken: (id) => `token-${id}` });
  async function call(method, url, { token, body = {}, ip = "1.1.1.1" } = {}) {
    const [path, qs] = url.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs ?? ""));
    for (const r of routes) {
      if (r.method !== method) continue;
      const names = [];
      const re = new RegExp("^" + r.path.replace(/:(\w+)/g, (_, n) => (names.push(n), "([^/]+)")) + "$");
      const m = path.match(re);
      if (!m) continue;
      const params = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
      let userId;
      if (r.auth) {
        if (!token?.startsWith("token-")) return { status: 401 };
        userId = Number(token.slice(6));
      }
      try {
        const out = await r.handler({ userId, body, params, query, ip });
        return { status: out.status ?? 200, body: out.body };
      } catch (e) {
        return { status: e.status ?? 500, body: { error: e.message } };
      }
    }
    return { status: 404 };
  }
  return { call, db };
}

test("fluxo completo pela API: cadastro, login, cartão, recarga, passe, viagem", async () => {
  const { call } = api();
  assert.equal((await call("get", "/me")).status, 401);

  assert.equal((await call("post", "/auth/register", { body: { name: "Al", usuario: "ana", email: "ana@x.com", senha: "123456" } })).status, 400);
  const reg = await call("post", "/auth/register", { body: { name: "Ana Souza", usuario: "ana", email: "ana@x.com", senha: "123456" } });
  assert.equal(reg.status, 201);
  assert.equal((await call("post", "/auth/register", { body: { name: "Ana Souza", usuario: "ANA", email: "o@x.com", senha: "123456" } })).status, 409);

  assert.equal((await call("post", "/auth/login", { body: { login: "ana", senha: "errada" } })).status, 401);
  const login = await call("post", "/auth/login", { body: { login: "ana@x.com", senha: "123456" } });
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.equal(login.body.user.password_hash, undefined);

  assert.equal((await call("get", "/me", { token })).body.user.usuario, "ana");
  assert.equal((await call("patch", "/me", { token, body: { name: "Ana Maria" } })).body.user.name, "Ana Maria");

  assert.equal((await call("post", "/recharges", { token, body: { amount: 20, method: "pix" } })).status, 422);
  const card = await call("post", "/card/virtual", { token, body: { holder: "Ana Maria", type: "comum" } });
  assert.equal(card.status, 201);
  assert.ok(card.body.state.card);

  const rc = await call("post", "/recharges", { token, body: { amount: 50, method: "debito" } });
  assert.equal(rc.status, 201);
  assert.equal(rc.body.state.balance, 50);

  const buy = await call("post", "/passes", { token, body: { passId: "diario-urbano" } });
  assert.equal(buy.body.state.balance, 34);
  assert.equal(buy.body.state.passes.length, 1);

  const trip = await call("post", "/trips", { token, body: { lineId: "201" } });
  assert.equal(trip.status, 201);
  assert.equal(trip.body.state.balance, 34); // coberto pelo passe diário
  assert.equal((await call("post", "/trips", { token, body: { lineId: "710" } })).body.state.balance, 22); // regional: cobra

  const tx = await call("get", "/transactions?type=recarga", { token });
  assert.equal(tx.body.items.length, 1);
  assert.equal((await call("get", "/recharges", { token })).body.items.length, 1);
});

test("favoritos, notificações e consultas públicas", async () => {
  const { call } = api();
  const { body } = await call("post", "/auth/login", { body: { login: "demo", senha: "123456" } });
  const token = body.token;

  assert.equal((await call("put", "/favorites/lines/405", { token })).body.state.favLines.length, 3);
  assert.equal((await call("delete", "/favorites/lines/405", { token })).body.state.favLines.length, 2);
  assert.equal((await call("put", "/favorites/lines/999", { token })).status, 404);
  const fav = await call("post", "/favorites/routes", { token, body: { originId: "vilarosa", destId: "hosp" } });
  const id = fav.body.state.favRoutes[0].id;
  assert.equal((await call("get", "/favorites", { token })).body.routes.length, 1);
  assert.equal((await call("delete", `/favorites/routes/${id}`, { token })).body.state.favRoutes.length, 0);

  const read = await call("post", "/notifications/read-all", { token });
  assert.ok(read.body.state.notices.every((n) => n.read));
  assert.ok((await call("get", "/notifications", { token })).body.items.length > 0);

  const transit = await call("get", "/transit");
  assert.equal(transit.body.lines.length, 6);
  assert.deepEqual(transit.body.lines.find((l) => l.id === "710").stopIds, ["term", "fatec", "distrito", "matao"]);
  assert.equal((await call("get", "/buses")).body.buses.length, 17);
  assert.equal((await call("get", "/buses?lineId=710")).body.buses.length, 2);
  assert.equal((await call("get", "/passes/catalog")).body.passes.length, 6);
  assert.equal((await call("get", "/passes/catalog")).body.passes[0].price, 5.5);
});

test("login bloqueia depois de muitas tentativas erradas", async () => {
  const { call } = api();
  for (let i = 0; i < 10; i++) {
    assert.equal((await call("post", "/auth/login", { body: { login: "demo", senha: "x" }, ip: "9.9.9.9" })).status, 401);
  }
  assert.equal((await call("post", "/auth/login", { body: { login: "demo", senha: "123456" }, ip: "9.9.9.9" })).status, 429);
});
