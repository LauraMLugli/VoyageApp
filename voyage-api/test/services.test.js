import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/security.js";
import { seedDemo } from "../src/seed.js";
import { findByLogin, updateUser } from "../src/services/accounts.js";
import { addFavLine, addFavRoute, removeFavLine, removeFavRoute } from "../src/services/favorites.js";
import { markAllRead } from "../src/services/notifications.js";
import { getState } from "../src/services/state.js";
import { FleetSimulator } from "../src/services/transit.js";
import * as wallet from "../src/services/wallet.js";
import { fakePay, freshDb, newUser } from "./helpers.js";

const rejects = (fn, status, re) =>
  assert.rejects(Promise.resolve().then(fn), (e) => {
    assert.equal(e.status, status);
    if (re) assert.match(e.message, re);
    return true;
  });

test("senha: hash não é texto puro e verifica certo", () => {
  const h = hashPassword("abc12345");
  assert.notEqual(h, "abc12345");
  assert.ok(verifyPassword("abc12345", h));
  assert.ok(!verifyPassword("errada", h));
});

test("conta nova: avisos iniciais, saldo 0 e login por usuário ou e-mail", () => {
  const db = freshDb();
  const u = newUser(db);
  const s = getState(db, u.id);
  assert.equal(s.balance, 0);
  assert.equal(s.card, null);
  assert.equal(s.notices.length, 3);
  assert.equal(findByLogin(db, "ANA").id, u.id);
  assert.equal(findByLogin(db, "ana@teste.com").id, u.id);
  assert.throws(() => newUser(db), (e) => e.status === 409);
  assert.equal(updateUser(db, u.id, { name: "Ana Maria" }).name, "Ana Maria");
});

test("cartão: vincular, duplicado, gerar e desvincular", () => {
  const db = freshDb();
  const a = newUser(db, "ana");
  const b = newUser(db, "beto");
  assert.throws(() => wallet.linkCard(db, a.id, { number: "123", holder: "Ana", type: "comum" }), (e) => e.status === 400);
  wallet.linkCard(db, a.id, { number: "6034 1200 4567 8901", holder: "Ana Souza", type: "comum" });
  assert.equal(getState(db, a.id).card.number, "6034120045678901");
  assert.throws(() => wallet.linkCard(db, b.id, { number: "6034120045678901", holder: "Beto", type: "comum" }), (e) => e.status === 409);
  assert.throws(() => wallet.generateCard(db, a.id, { holder: "Ana", type: "comum" }), (e) => e.status === 409);
  wallet.unlinkCard(db, a.id);
  wallet.generateCard(db, a.id, { holder: "Ana Souza", type: "estudante" });
  const card = getState(db, a.id).card;
  assert.equal(card.number.length, 16);
  assert.equal(card.type, "estudante");
});

test("recarga: exige cartão, valida valor e atualiza saldo/histórico/aviso", async () => {
  const db = freshDb();
  const u = newUser(db);
  await rejects(() => wallet.recharge(db, u.id, { amount: 20, method: "pix" }, fakePay), 422, /Vincule/);
  wallet.generateCard(db, u.id, { holder: "Ana Souza", type: "comum" });
  await rejects(() => wallet.recharge(db, u.id, { amount: 2, method: "pix" }, fakePay), 400);
  await rejects(() => wallet.recharge(db, u.id, { amount: 20, method: "boleto" }, fakePay), 400);
  await rejects(() => wallet.recharge(db, u.id, { amount: 20, method: "pix" }, async () => ({ ok: false })), 402);
  assert.equal(getState(db, u.id).balance, 0);
  const out = await wallet.recharge(db, u.id, { amount: 20.5, method: "pix" }, fakePay);
  assert.match(out.message, /R\$ 20,50/);
  const s = getState(db, u.id);
  assert.equal(s.balance, 20.5);
  assert.equal(s.txs[0].type, "recarga");
  assert.equal(s.txs[0].amount, 20.5);
  assert.equal(s.notices[0].kind, "recarga");
});

test("passes: saldo insuficiente não cobra; compra debita e ativa", async () => {
  const db = freshDb();
  const u = newUser(db);
  wallet.generateCard(db, u.id, { holder: "Ana Souza", type: "comum" });
  assert.throws(() => wallet.buyPass(db, u.id, "diario-urbano"), (e) => e.status === 422 && /Saldo insuficiente/.test(e.message));
  assert.equal(getState(db, u.id).passes.length, 0);
  await wallet.recharge(db, u.id, { amount: 50, method: "pix" }, fakePay);
  wallet.buyPass(db, u.id, "diario-urbano");
  const s = getState(db, u.id);
  assert.equal(s.balance, 34);
  assert.equal(s.passes.length, 1);
  assert.equal(s.passes[0].usesLeft, null);
  assert.equal(s.txs[0].type, "passe");
  assert.throws(() => wallet.buyPass(db, u.id, "nao-existe"), (e) => e.status === 404);
});

test("embarque: passe urbano não cobre linha regional; único é consumido; sem passe cobra tarifa", async () => {
  const db = freshDb();
  const u = newUser(db);
  wallet.generateCard(db, u.id, { holder: "Ana Souza", type: "comum" });
  await wallet.recharge(db, u.id, { amount: 100, method: "pix" }, fakePay);

  wallet.board(db, u.id, "201"); // sem passe: R$ 5,50
  assert.equal(getState(db, u.id).balance, 94.5);

  wallet.buyPass(db, u.id, "unico-urbano"); // -5,50 => 89
  wallet.board(db, u.id, "201"); // usa o passe único
  let s = getState(db, u.id);
  assert.equal(s.balance, 89);
  assert.equal(s.passes[0].usesLeft, 0);
  assert.equal(s.txs[0].amount, 0);

  wallet.board(db, u.id, "201"); // passe esgotado: cobra de novo
  assert.equal(getState(db, u.id).balance, 83.5);

  wallet.board(db, u.id, "710"); // regional sem passe regional: R$ 12,00
  assert.equal(getState(db, u.id).balance, 71.5);

  wallet.buyPass(db, u.id, "diario-regional"); // -38 => 33,5
  wallet.board(db, u.id, "710");
  wallet.board(db, u.id, "302");
  assert.equal(getState(db, u.id).balance, 33.5);
  assert.throws(() => wallet.board(db, u.id, "999"), (e) => e.status === 404);
});

test("saldo baixo: avisa ao cruzar R$ 10 e nunca deixa o saldo ficar negativo", async () => {
  const db = freshDb();
  const u = newUser(db);
  wallet.generateCard(db, u.id, { holder: "Ana Souza", type: "comum" });
  await wallet.recharge(db, u.id, { amount: 12, method: "pix" }, fakePay);
  const before = getState(db, u.id).notices.filter((n) => n.kind === "saldo").length;
  wallet.board(db, u.id, "201"); // 12 -> 6,50
  const after = getState(db, u.id).notices.filter((n) => n.kind === "saldo");
  assert.equal(after.length, before + 1);
  assert.match(after[0].message, /R\$ 6,50/);
  wallet.board(db, u.id, "201"); // 6,50 -> 1,00
  assert.throws(() => wallet.board(db, u.id, "201"), (e) => e.status === 422);
  assert.equal(getState(db, u.id).balance, 1);
});

test("aviso de passe perto de vencer é criado uma única vez", () => {
  const db = freshDb();
  const u = newUser(db);
  const t = Date.now();
  db.prepare(
    `INSERT INTO user_passes (id, user_id, pass_id, name, kind, scope, price_cents, purchased_at, expires_at, uses_left, expiry_notified)
     VALUES ('p1', ?, 'diario-urbano', 'Passe diário', 'diario', 'urbano', 1600, ?, ?, NULL, 0)`,
  ).run(u.id, t - 22 * 3600000, t + 2 * 3600000);
  const count = () => getState(db, u.id).notices.filter((n) => n.kind === "passe").length;
  assert.equal(count(), 1);
  assert.equal(count(), 1);
});

test("favoritos e notificações lidas", () => {
  const db = freshDb();
  const u = newUser(db);
  addFavLine(db, u.id, "302");
  addFavLine(db, u.id, "302");
  assert.deepEqual(getState(db, u.id).favLines, ["302"]);
  assert.throws(() => addFavLine(db, u.id, "999"), (e) => e.status === 404);
  removeFavLine(db, u.id, "302");
  assert.equal(getState(db, u.id).favLines.length, 0);

  const id = addFavRoute(db, u.id, "vilarosa", "hosp");
  assert.equal(addFavRoute(db, u.id, "vilarosa", "hosp"), id);
  assert.throws(() => addFavRoute(db, u.id, "hosp", "hosp"), (e) => e.status === 400);
  assert.equal(getState(db, u.id).favRoutes.length, 1);
  removeFavRoute(db, u.id, id);
  assert.equal(getState(db, u.id).favRoutes.length, 0);

  markAllRead(db, u.id);
  assert.ok(getState(db, u.id).notices.every((n) => n.read));
});

test("usuários não enxergam dados uns dos outros", async () => {
  const db = freshDb();
  const a = newUser(db, "ana");
  const b = newUser(db, "beto");
  wallet.generateCard(db, a.id, { holder: "Ana", type: "comum" });
  await wallet.recharge(db, a.id, { amount: 30, method: "pix" }, fakePay);
  assert.equal(getState(db, b.id).balance, 0);
  assert.equal(getState(db, b.id).txs.length, 0);
});

test("conta demo é criada com dados prontos (e só uma vez)", () => {
  const db = freshDb();
  seedDemo(db);
  seedDemo(db);
  const u = findByLogin(db, "demo");
  const s = getState(db, u.id);
  assert.equal(s.balance, 42.8);
  assert.equal(s.passes.length, 1);
  assert.equal(s.txs.length, 3);
  assert.deepEqual(s.favLines, ["201", "302"]);
  assert.ok(s.card);
});

test("frota: ônibus ficam dentro da linha e a posição é gravada no banco", () => {
  const db = freshDb();
  const fleet = new FleetSimulator(db);
  assert.equal(fleet.list().length, 17);
  for (let i = 0; i < 3000; i++) fleet.tick(0.5);
  for (const b of fleet.list()) {
    const g = fleet.geo[b.lineId];
    assert.ok(b.dist >= 0 && b.dist <= g.length, `${b.id} fora da linha`);
  }
  fleet.persist();
  const row = db.prepare("SELECT dist FROM buses WHERE id = ?").get("VY-201-01");
  assert.equal(row.dist, fleet.list().find((b) => b.id === "VY-201-01").dist);
  assert.equal(fleet.list("710").length, 2);
});
