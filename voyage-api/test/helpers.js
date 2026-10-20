// Banco em memória para testes, usando o SQLite embutido do Node (>= 22).
import { DatabaseSync } from "node:sqlite";
import { wrapNodeSqlite } from "../src/db.js";
import { migrate } from "../src/schema.js";
import { seedReference } from "../src/seed.js";
import { hashPassword } from "../src/security.js";
import { createUser } from "../src/services/accounts.js";

export function memoryDb() {
  const db = wrapNodeSqlite(new DatabaseSync(":memory:"));
  db.pragma("foreign_keys = ON");
  return db;
}

export function freshDb() {
  const db = memoryDb();
  migrate(db);
  seedReference(db);
  return db;
}

export function newUser(db, usuario = "ana") {
  return createUser(db, {
    name: "Ana Souza",
    usuario,
    email: `${usuario}@teste.com`,
    passwordHash: hashPassword("segredo123"),
  });
}

export const fakePay = async () => ({ ok: true, reference: "TEST" });
