import { fromCents } from "../util.js";
import { getUser } from "./accounts.js";
import { checkExpiry, listNotices } from "./notifications.js";
import { listPasses, listTransactions } from "./wallet.js";

// "Foto" completa da conta do usuário. É o que o app carrega ao abrir e o que
// toda ação (recarga, compra, embarque...) devolve atualizado.
export function getState(db, userId) {
  checkExpiry(db, userId);
  const user = getUser(db, userId);
  const card = db.prepare("SELECT number, holder, type, status, linked_at FROM cards WHERE user_id = ?").get(userId);
  return {
    balance: fromCents(user.balance_cents),
    card: card
      ? { number: card.number, holder: card.holder, type: card.type, status: card.status, linkedAt: card.linked_at }
      : null,
    passes: listPasses(db, userId),
    txs: listTransactions(db, userId),
    notices: listNotices(db, userId),
    favLines: db
      .prepare("SELECT line_id FROM favorite_lines WHERE user_id = ? ORDER BY created_at")
      .all(userId)
      .map((r) => r.line_id),
    favRoutes: db
      .prepare("SELECT id, origin_id, dest_id FROM favorite_routes WHERE user_id = ? ORDER BY created_at")
      .all(userId)
      .map((r) => ({ id: r.id, originId: r.origin_id, destId: r.dest_id })),
  };
}
