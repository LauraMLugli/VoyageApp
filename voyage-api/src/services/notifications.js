import { now, remaining, uid } from "../util.js";

export function addNotice(db, userId, { kind, title, message, ts = now() }) {
  db.prepare(
    "INSERT INTO notifications (id, user_id, kind, title, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)",
  ).run(uid(), userId, kind, title, message, ts);
}

export function markAllRead(db, userId) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0").run(userId);
}

export function listNotices(db, userId) {
  return db
    .prepare("SELECT id, kind, title, message, created_at, is_read FROM notifications WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100")
    .all(userId)
    .map((n) => ({ id: n.id, kind: n.kind, title: n.title, message: n.message, ts: n.created_at, read: n.is_read === 1 }));
}

// Aviso de passe perto do vencimento (diário: 4 h antes; mensal: 3 dias antes).
// Roda quando o app pede o estado da conta. Com um agendador (cron), pode rodar sozinho.
export function checkExpiry(db, userId) {
  const t = now();
  const passes = db
    .prepare(
      `SELECT id, name, kind, expires_at FROM user_passes
       WHERE user_id = ? AND expiry_notified = 0 AND kind <> 'unico'
         AND expires_at > ? AND (uses_left IS NULL OR uses_left > 0)`,
    )
    .all(userId, t);
  for (const p of passes) {
    const threshold = p.kind === "mensal" ? 3 * 86400000 : 4 * 3600000;
    if (p.expires_at - t <= threshold) {
      db.prepare("UPDATE user_passes SET expiry_notified = 1 WHERE id = ?").run(p.id);
      addNotice(db, userId, {
        kind: "passe",
        title: "Passe perto de vencer",
        message: `${p.name} vence em ${remaining(p.expires_at, t)}.`,
      });
    }
  }
}
