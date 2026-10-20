// Esquema do banco. Para mudar o banco no futuro, NÃO edite uma migração antiga:
// adicione uma nova string no fim de MIGRATIONS (ex.: um ALTER TABLE).
export const MIGRATIONS = [
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    usuario       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE cards (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    number    TEXT NOT NULL UNIQUE,
    holder    TEXT NOT NULL,
    type      TEXT NOT NULL CHECK (type IN ('comum','estudante','vale')),
    status    TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','bloqueado')),
    linked_at INTEGER NOT NULL
  );

  CREATE TABLE pass_catalog (
    id             TEXT PRIMARY KEY,
    kind           TEXT NOT NULL CHECK (kind IN ('unico','diario','mensal')),
    scope          TEXT NOT NULL CHECK (scope IN ('urbano','regional')),
    name           TEXT NOT NULL,
    description    TEXT NOT NULL,
    price_cents    INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL,
    uses           INTEGER
  );

  CREATE TABLE user_passes (
    id              TEXT PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pass_id         TEXT NOT NULL REFERENCES pass_catalog(id),
    name            TEXT NOT NULL,
    kind            TEXT NOT NULL,
    scope           TEXT NOT NULL,
    price_cents     INTEGER NOT NULL,
    purchased_at    INTEGER NOT NULL,
    expires_at      INTEGER NOT NULL,
    uses_left       INTEGER,
    expiry_notified INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_user_passes_user ON user_passes(user_id, expires_at);

  CREATE TABLE transactions (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK (type IN ('recarga','passe','viagem')),
    title        TEXT NOT NULL,
    subtitle     TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    created_at   INTEGER NOT NULL
  );
  CREATE INDEX idx_tx_user ON transactions(user_id, created_at DESC);

  CREATE TABLE notifications (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL CHECK (kind IN ('saldo','recarga','passe','transporte')),
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);

  CREATE TABLE stops (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    x    REAL NOT NULL,
    y    REAL NOT NULL
  );

  CREATE TABLE lines (
    id         TEXT PRIMARY KEY,
    code       TEXT NOT NULL,
    name       TEXT NOT NULL,
    kind       TEXT NOT NULL CHECK (kind IN ('urbana','regional')),
    color      TEXT NOT NULL,
    fare_cents INTEGER NOT NULL
  );

  CREATE TABLE line_stops (
    line_id  TEXT NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    stop_id  TEXT NOT NULL REFERENCES stops(id),
    PRIMARY KEY (line_id, position)
  );

  CREATE TABLE buses (
    id         TEXT PRIMARY KEY,
    line_id    TEXT NOT NULL REFERENCES lines(id),
    dist       REAL NOT NULL,
    dir        INTEGER NOT NULL CHECK (dir IN (1,-1)),
    speed      REAL NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE favorite_lines (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_id    TEXT NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, line_id)
  );

  CREATE TABLE favorite_routes (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_id  TEXT NOT NULL REFERENCES stops(id),
    dest_id    TEXT NOT NULL REFERENCES stops(id),
    created_at INTEGER NOT NULL,
    UNIQUE (user_id, origin_id, dest_id)
  );
  `,
];

export function migrate(db) {
  const current = db.prepare("PRAGMA user_version").get().user_version;
  MIGRATIONS.forEach((sql, i) => {
    if (current <= i) {
      db.exec("BEGIN");
      try {
        db.exec(sql);
        db.exec(`PRAGMA user_version = ${i + 1}`);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  });
}
