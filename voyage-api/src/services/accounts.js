import { HttpError } from "../errors.js";
import { now } from "../util.js";
import { addNotice } from "./notifications.js";

export function publicUser(row) {
  return { id: row.id, name: row.name, usuario: row.usuario, email: row.email };
}

export function getUser(db, id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function findByLogin(db, login) {
  return db.prepare("SELECT * FROM users WHERE usuario = ? OR email = ?").get(login, login);
}

export function createUser(db, { name, usuario, email, passwordHash }) {
  if (db.prepare("SELECT 1 AS x FROM users WHERE usuario = ?").get(usuario)) {
    throw new HttpError(409, "Este usuário já existe. Escolha outro.");
  }
  if (db.prepare("SELECT 1 AS x FROM users WHERE email = ?").get(email)) {
    throw new HttpError(409, "Este e-mail já está cadastrado.");
  }
  return db.transaction(() => {
    const info = db
      .prepare("INSERT INTO users (name, usuario, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(name, usuario, email, passwordHash, now());
    const id = Number(info.lastInsertRowid);
    const t = now();
    addNotice(db, id, { kind: "saldo", title: "Saldo baixo", message: "Seu saldo está em R$ 0,00. Vincule um cartão e faça sua primeira recarga.", ts: t });
    addNotice(db, id, { kind: "transporte", title: "Linha 302 com atraso", message: "Obras na região central causam atraso médio de 8 minutos na linha 302.", ts: t - 3600000 });
    addNotice(db, id, { kind: "transporte", title: "Horário especial na linha 710", message: "A linha regional 710 opera com intervalos maiores aos domingos.", ts: t - 86400000 });
    return getUser(db, id);
  })();
}

export function updateUser(db, id, { name, email }) {
  const current = getUser(db, id);
  const nextName = name ?? current.name;
  const nextEmail = email ?? current.email;
  const taken = db.prepare("SELECT id FROM users WHERE email = ? AND id <> ?").get(nextEmail, id);
  if (taken) throw new HttpError(409, "Este e-mail já está em uso.");
  db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(nextName, nextEmail, id);
  return getUser(db, id);
}
