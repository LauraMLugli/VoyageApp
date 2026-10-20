import os from "node:os";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { openDb } from "./db.js";
import { migrate } from "./schema.js";
import { seedDemo, seedReference } from "./seed.js";
import { processPayment } from "./services/payments.js";
import { FleetSimulator } from "./services/transit.js";

const db = await openDb(config.dbPath);
migrate(db);
seedReference(db);
if (config.seedDemo) seedDemo(db);

const fleet = new FleetSimulator(db);
fleet.start();

const app = createApp({ db, fleet, pay: processPayment });
const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`\nAPI Voyage rodando na porta ${config.port}`);
  console.log(`  Neste computador:  http://localhost:${config.port}/api/health`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`  Na rede (celular): http://${net.address}:${config.port}/api   <- use este endereço no app`);
      }
    }
  }
  if (config.seedDemo) console.log("  Conta de teste:    usuário demo / senha 123456");
  console.log("");
});

function shutdown() {
  fleet.stop();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
