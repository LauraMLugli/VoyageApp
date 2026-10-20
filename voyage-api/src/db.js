import fs from "node:fs";
import path from "node:path";

// Adaptador: faz o SQLite embutido do Node (node:sqlite) ter a mesma "cara" do better-sqlite3
// (prepare/exec/transaction/pragma). Assim NÃO precisa instalar módulo nativo (que costuma dar
// erro de instalação no Windows). Requer Node 22.13+.
export function wrapNodeSqlite(raw) {
  let depth = 0;
  return {
    prepare: (sql) => raw.prepare(sql),
    exec: (sql) => raw.exec(sql),
    pragma: (text) => raw.exec(`PRAGMA ${text}`),
    close: () => raw.close(),
    transaction(fn) {
      return (...args) => {
        const name = `sp${depth}`;
        raw.exec(depth === 0 ? "BEGIN" : `SAVEPOINT ${name}`);
        depth++;
        try {
          const result = fn(...args);
          depth--;
          raw.exec(depth === 0 ? "COMMIT" : `RELEASE ${name}`);
          return result;
        } catch (error) {
          depth--;
          if (depth === 0) raw.exec("ROLLBACK");
          else raw.exec(`ROLLBACK TO ${name}; RELEASE ${name}`);
          throw error;
        }
      };
    },
  };
}

export async function openDb(file) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });

  let db;
  let sqlite = null;
  try {
    sqlite = await import("node:sqlite");
  } catch {
    // Node antigo: tenta o better-sqlite3 (dependência opcional)
  }

  if (sqlite?.DatabaseSync) {
    db = wrapNodeSqlite(new sqlite.DatabaseSync(file));
  } else {
    try {
      const { default: Database } = await import("better-sqlite3");
      db = new Database(file);
    } catch {
      throw new Error(
        "Não encontrei um SQLite para usar. Atualize o Node para a versão 22.13 ou mais nova (recomendado) " +
          "ou rode: npm install better-sqlite3",
      );
    }
  }

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
