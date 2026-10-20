import { hashPassword } from "./security.js";
import { LINES, PASS_CATALOG, STOPS } from "./seedData.js";
import { createUser } from "./services/accounts.js";
import { addNotice } from "./services/notifications.js";
import { NOMINAL_SPEED } from "./services/transit.js";
import { now, uid } from "./util.js";

// Cria paradas, linhas, ônibus e catálogo de passes (só se ainda não existirem).
export function seedReference(db) {
  db.transaction(() => {
    const insertStop = db.prepare("INSERT OR IGNORE INTO stops (id, name, x, y) VALUES (?, ?, ?, ?)");
    STOPS.forEach((s) => insertStop.run(s.id, s.name, s.x, s.y));

    const insertLine = db.prepare("INSERT OR IGNORE INTO lines (id, code, name, kind, color, fare_cents) VALUES (?, ?, ?, ?, ?, ?)");
    const insertLink = db.prepare("INSERT OR IGNORE INTO line_stops (line_id, position, stop_id) VALUES (?, ?, ?)");
    LINES.forEach((l) => {
      insertLine.run(l.id, l.code, l.name, l.kind, l.color, l.fareCents);
      l.stopIds.forEach((stopId, i) => insertLink.run(l.id, i, stopId));
    });

    const insertPass = db.prepare(
      "INSERT OR IGNORE INTO pass_catalog (id, kind, scope, name, description, price_cents, duration_hours, uses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    PASS_CATALOG.forEach((p) => insertPass.run(p.id, p.kind, p.scope, p.name, p.description, p.priceCents, p.durationHours, p.uses));

    // frota inicial (só se a tabela estiver vazia)
    if (db.prepare("SELECT COUNT(*) AS n FROM buses").get().n === 0) {
      const insertBus = db.prepare("INSERT INTO buses (id, line_id, dist, dir, speed, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
      LINES.forEach((line, li) => {
        let length = 0;
        const pts = line.stopIds.map((id) => STOPS.find((s) => s.id === id));
        for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        const count = line.kind === "regional" ? 2 : 3;
        for (let i = 0; i < count; i++) {
          insertBus.run(
            `VY-${line.code}-${String(i + 1).padStart(2, "0")}`,
            line.id,
            (length * (i + 1)) / (count + 1),
            i % 2 === 0 ? 1 : -1,
            NOMINAL_SPEED * (0.88 + ((li * 3 + i) % 5) * 0.06),
            now(),
          );
        }
      });
    }
  })();
}

// Conta de teste: usuário "demo", senha "123456" (já com cartão, saldo, passe e histórico).
export function seedDemo(db) {
  if (db.prepare("SELECT 1 AS x FROM users WHERE usuario = 'demo'").get()) return;
  db.transaction(() => {
    const user = createUser(db, {
      name: "Passageiro Demo",
      usuario: "demo",
      email: "demo@voyage.app",
      passwordHash: hashPassword("123456"),
    });
    const t = now();
    // a conta demo não começa com o aviso de "saldo baixo"
    db.prepare("DELETE FROM notifications WHERE user_id = ? AND kind = 'saldo'").run(user.id);
    db.prepare("UPDATE users SET balance_cents = 4280 WHERE id = ?").run(user.id);
    db.prepare("INSERT INTO cards (user_id, number, holder, type, status, linked_at) VALUES (?, '6034120045678901', ?, 'comum', 'ativo', ?)").run(
      user.id, user.name, t - 20 * 86400000,
    );
    db.prepare(
      `INSERT INTO user_passes (id, user_id, pass_id, name, kind, scope, price_cents, purchased_at, expires_at, uses_left, expiry_notified)
       VALUES (?, ?, 'diario-urbano', 'Passe diário', 'diario', 'urbano', 1600, ?, ?, NULL, 0)`,
    ).run(uid(), user.id, t - 3 * 3600000, t + 21 * 3600000);
    const tx = db.prepare("INSERT INTO transactions (id, user_id, type, title, subtitle, amount_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    tx.run(uid(), user.id, "passe", "Passe diário", "Urbano · 24 horas", -1600, t - 3 * 3600000);
    tx.run(uid(), user.id, "viagem", "Linha 302", "Terminal Central", -550, t - 26 * 3600000);
    tx.run(uid(), user.id, "recarga", "Recarga confirmada", "Pix · Cartão 8901", 2000, t - 27 * 3600000);
    const fav = db.prepare("INSERT INTO favorite_lines (user_id, line_id, created_at) VALUES (?, ?, ?)");
    fav.run(user.id, "201", t);
    fav.run(user.id, "302", t + 1);
    addNotice(db, user.id, { kind: "recarga", title: "Recarga realizada", message: "R$ 20,00 adicionados ao cartão final 8901.", ts: t - 27 * 3600000 });
  })();
}
