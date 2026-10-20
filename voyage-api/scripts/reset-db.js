import fs from "node:fs";
import { config } from "../src/config.js";

for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(config.dbPath + suffix, { force: true });
}
console.log("Banco apagado. Ele será recriado (com os dados iniciais) na próxima vez que o servidor iniciar.");
