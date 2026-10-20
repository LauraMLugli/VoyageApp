import { HttpError } from "../errors.js";
import { now, uid } from "../util.js";

export function addFavLine(db, userId, lineId) {
  if (!db.prepare("SELECT 1 AS x FROM lines WHERE id = ?").get(lineId)) {
    throw new HttpError(404, "Linha não encontrada.");
  }
  db.prepare("INSERT OR IGNORE INTO favorite_lines (user_id, line_id, created_at) VALUES (?, ?, ?)").run(userId, lineId, now());
}

export function removeFavLine(db, userId, lineId) {
  db.prepare("DELETE FROM favorite_lines WHERE user_id = ? AND line_id = ?").run(userId, lineId);
}

export function addFavRoute(db, userId, originId, destId) {
  if (originId === destId) throw new HttpError(400, "Origem e destino devem ser diferentes.");
  const stop = db.prepare("SELECT 1 AS x FROM stops WHERE id = ?");
  if (!stop.get(originId) || !stop.get(destId)) throw new HttpError(404, "Parada não encontrada.");
  db.prepare("INSERT OR IGNORE INTO favorite_routes (id, user_id, origin_id, dest_id, created_at) VALUES (?, ?, ?, ?, ?)").run(
    uid(), userId, originId, destId, now(),
  );
  return db.prepare("SELECT id FROM favorite_routes WHERE user_id = ? AND origin_id = ? AND dest_id = ?").get(userId, originId, destId).id;
}

export function removeFavRoute(db, userId, id) {
  db.prepare("DELETE FROM favorite_routes WHERE user_id = ? AND id = ?").run(userId, id);
}
