import { randomInt } from "node:crypto";
import { HttpError } from "../errors.js";
import { fromCents, money, now, toCents, uid } from "../util.js";
import { addNotice } from "./notifications.js";
import { processPayment } from "./payments.js";

export const LOW_BALANCE_CENTS = 1000;
export const MIN_RECHARGE = 5;
export const MAX_RECHARGE = 500;

const CARD_TYPES = ["comum", "estudante", "vale"];
const PAYMENT_LABEL = { pix: "Pix", credito: "Cartão de crédito", debito: "Cartão de débito" };

function addTx(db, userId, { type, title, subtitle, amountCents, ts = now() }) {
  db.prepare(
    "INSERT INTO transactions (id, user_id, type, title, subtitle, amount_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(uid(), userId, type, title, subtitle, amountCents, ts);
}

// Única porta de entrada para mexer no saldo (também gera o aviso de saldo baixo).
function changeBalance(db, userId, deltaCents) {
  const before = db.prepare("SELECT balance_cents AS b FROM users WHERE id = ?").get(userId).b;
  const after = before + deltaCents;
  if (after < 0) throw new HttpError(422, "Saldo insuficiente.");
  db.prepare("UPDATE users SET balance_cents = ? WHERE id = ?").run(after, userId);
  if (before >= LOW_BALANCE_CENTS && after < LOW_BALANCE_CENTS) {
    addNotice(db, userId, {
      kind: "saldo",
      title: "Saldo baixo",
      message: `Seu saldo está em ${money(after)}. Recarregue para continuar viajando.`,
    });
  }
  return after;
}

function requireCard(db, userId, message = "Vincule um cartão Voyage para continuar.") {
  const card = db.prepare("SELECT * FROM cards WHERE user_id = ?").get(userId);
  if (!card) throw new HttpError(422, message);
  return card;
}

/* ------------------------------- Cartão ------------------------------- */
export function linkCard(db, userId, { number, holder, type }) {
  const digits = String(number ?? "").replace(/\D/g, "");
  if (digits.length !== 16) throw new HttpError(400, "O número do cartão deve ter 16 dígitos.");
  if (String(holder ?? "").trim().length < 3) throw new HttpError(400, "Informe o nome do titular.");
  if (!CARD_TYPES.includes(type)) throw new HttpError(400, "Tipo de cartão inválido.");
  if (db.prepare("SELECT 1 AS x FROM cards WHERE user_id = ?").get(userId)) {
    throw new HttpError(409, "Você já tem um cartão vinculado. Desvincule antes de vincular outro.");
  }
  if (db.prepare("SELECT 1 AS x FROM cards WHERE number = ?").get(digits)) {
    throw new HttpError(409, "Este cartão já está vinculado a outra conta.");
  }
  db.prepare("INSERT INTO cards (user_id, number, holder, type, status, linked_at) VALUES (?, ?, ?, ?, 'ativo', ?)").run(
    userId, digits, String(holder).trim(), type, now(),
  );
  return { message: "Cartão vinculado à sua conta." };
}

export function generateCard(db, userId, { holder, type }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let digits = "6034";
    for (let i = 0; i < 12; i++) digits += randomInt(0, 10);
    if (!db.prepare("SELECT 1 AS x FROM cards WHERE number = ?").get(digits)) {
      linkCard(db, userId, { number: digits, holder, type });
      return { message: "Cartão virtual criado e vinculado à sua conta." };
    }
  }
  throw new HttpError(500, "Não foi possível gerar o cartão. Tente de novo.");
}

export function unlinkCard(db, userId) {
  db.prepare("DELETE FROM cards WHERE user_id = ?").run(userId);
  return { message: "Cartão desvinculado." };
}

/* ------------------------------- Recarga ------------------------------- */
export async function recharge(db, userId, { amount, method }, pay = processPayment) {
  const value = Number(amount);
  if (!PAYMENT_LABEL[method]) throw new HttpError(400, "Forma de pagamento inválida.");
  if (!Number.isFinite(value) || value < MIN_RECHARGE || value > MAX_RECHARGE) {
    throw new HttpError(400, `Escolha um valor entre ${money(MIN_RECHARGE * 100)} e ${money(MAX_RECHARGE * 100)}.`);
  }
  requireCard(db, userId, "Vincule um cartão Voyage antes de recarregar.");

  const payment = await pay({ amount: value, method });
  if (!payment.ok) throw new HttpError(402, "Pagamento não aprovado. Tente novamente.");

  const cents = toCents(value);
  db.transaction(() => {
    const card = requireCard(db, userId, "Vincule um cartão Voyage antes de recarregar.");
    const last4 = card.number.slice(-4);
    changeBalance(db, userId, cents);
    addTx(db, userId, {
      type: "recarga",
      title: "Recarga confirmada",
      subtitle: `${PAYMENT_LABEL[method]} · Cartão ${last4}`,
      amountCents: cents,
    });
    addNotice(db, userId, {
      kind: "recarga",
      title: "Recarga realizada",
      message: `${money(cents)} adicionados ao cartão final ${last4}.`,
    });
  })();
  return { message: `Recarga de ${money(cents)} confirmada.` };
}

/* ------------------------------- Passes ------------------------------- */
export function buyPass(db, userId, passId) {
  const def = db.prepare("SELECT * FROM pass_catalog WHERE id = ?").get(passId);
  if (!def) throw new HttpError(404, "Passe não encontrado.");
  return db.transaction(() => {
    requireCard(db, userId, "Vincule um cartão Voyage para comprar passes.");
    const balance = db.prepare("SELECT balance_cents AS b FROM users WHERE id = ?").get(userId).b;
    if (balance < def.price_cents) {
      throw new HttpError(
        422,
        `Saldo insuficiente. Você tem ${money(balance)} e o passe custa ${money(def.price_cents)}.`,
      );
    }
    const t = now();
    changeBalance(db, userId, -def.price_cents);
    db.prepare(
      `INSERT INTO user_passes (id, user_id, pass_id, name, kind, scope, price_cents, purchased_at, expires_at, uses_left, expiry_notified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(uid(), userId, def.id, def.name, def.kind, def.scope, def.price_cents, t, t + def.duration_hours * 3600000, def.uses);
    addTx(db, userId, {
      type: "passe",
      title: def.name,
      subtitle: `${def.scope === "regional" ? "Regional" : "Urbano"} · ativado agora`,
      amountCents: -def.price_cents,
      ts: t,
    });
    return { message: `${def.name} ativado.` };
  })();
}

/* --------------------------- Embarque (viagem) --------------------------- */
export function board(db, userId, lineId) {
  const line = db.prepare("SELECT id, code, name, kind, fare_cents FROM lines WHERE id = ?").get(lineId);
  if (!line) throw new HttpError(404, "Linha não encontrada.");
  return db.transaction(() => {
    requireCard(db, userId, "Vincule um cartão Voyage para embarcar.");
    const t = now();
    // passes válidos que cobrem a linha (passe regional cobre urbano e regional); gasta antes os não-únicos
    const pass = db
      .prepare(
        `SELECT * FROM user_passes
         WHERE user_id = ? AND expires_at > ? AND (uses_left IS NULL OR uses_left > 0)
         ORDER BY (kind = 'unico') ASC, expires_at ASC`,
      )
      .all(userId, t)
      .find((p) => p.scope === "regional" || line.kind === "urbana");

    if (pass) {
      if (pass.uses_left !== null) {
        db.prepare("UPDATE user_passes SET uses_left = uses_left - 1 WHERE id = ?").run(pass.id);
      }
      addTx(db, userId, { type: "viagem", title: `Linha ${line.code}`, subtitle: `${line.name} · ${pass.name}`, amountCents: 0, ts: t });
      return { message: `Embarque na linha ${line.code} liberado com o ${pass.name.toLowerCase()}.` };
    }

    const balance = db.prepare("SELECT balance_cents AS b FROM users WHERE id = ?").get(userId).b;
    if (balance < line.fare_cents) {
      throw new HttpError(422, `Saldo insuficiente. A tarifa é ${money(line.fare_cents)} e você tem ${money(balance)}.`);
    }
    changeBalance(db, userId, -line.fare_cents);
    addTx(db, userId, { type: "viagem", title: `Linha ${line.code}`, subtitle: line.name, amountCents: -line.fare_cents, ts: t });
    return { message: `Embarque na linha ${line.code}. Tarifa de ${money(line.fare_cents)} debitada.` };
  })();
}

/* ------------------------------ Consultas ------------------------------ */
export function listCatalog(db) {
  return db.prepare("SELECT * FROM pass_catalog ORDER BY price_cents").all().map((p) => ({
    id: p.id,
    kind: p.kind,
    scope: p.scope,
    name: p.name,
    description: p.description,
    price: fromCents(p.price_cents),
    durationHours: p.duration_hours,
    uses: p.uses,
  }));
}

export function listTransactions(db, userId, { type, limit = 200 } = {}) {
  const max = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const rows = type
    ? db.prepare("SELECT * FROM transactions WHERE user_id = ? AND type = ? ORDER BY created_at DESC, rowid DESC LIMIT ?").all(userId, type, max)
    : db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?").all(userId, max);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    amount: fromCents(r.amount_cents),
    ts: r.created_at,
  }));
}

export function listPasses(db, userId) {
  return db
    .prepare("SELECT * FROM user_passes WHERE user_id = ? ORDER BY purchased_at DESC, rowid DESC")
    .all(userId)
    .map((p) => ({
      id: p.id,
      passId: p.pass_id,
      name: p.name,
      kind: p.kind,
      scope: p.scope,
      price: fromCents(p.price_cents),
      purchasedAt: p.purchased_at,
      expiresAt: p.expires_at,
      usesLeft: p.uses_left,
      expiryNotified: p.expiry_notified === 1,
    }));
}
