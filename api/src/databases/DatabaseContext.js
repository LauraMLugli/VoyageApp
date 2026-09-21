import { pool } from "./connections/connectionMysql.js";
import { getDbConnection } from "./connections/connectionSqllite.js"; 
import { MySQLStrategy, SQLiteStrategy } from "./DatabaseStrategy.js";
import { DatabaseSchema } from "./schema/databaseSchema.js";

class DatabaseContext {
    constructor() {
        this.strategy = null;
    }

    async init() {
        // Centraliza a flag de reset (pode vir do .env se quiser)
        const resetarBanco = process.env.DB_RESET?.toLowerCase() === 'true';
        const db_name = process.env.DB_DATABASE?.toLowerCase() || 'apirest';
        //console.log( ` init- context: ${resetarBanco}`);

        if (process.env.DB_TYPE === 'sqlite') {
            const db = await getDbConnection(resetarBanco);
            
            // CORREÇÃO 1: Instanciar a estratégia correspondente
            this.strategy = new SQLiteStrategy(db);
            
            // GARANTIA: Define o tipo na estratégia para o Schema mapear corretamente
            this.strategy.type = 'sqlite';
            this.strategy.databaseName = db_name ;

            // Inicializa o schema dinâmico usando a estratégia configurada
            await DatabaseSchema.initialize(this.strategy, resetarBanco);
            
            console.log("Ambiente SQLite configurado com sucesso.");
            
        } else {
            this.strategy = new MySQLStrategy(pool);
            
            // GARANTIA: Define o tipo na estratégia para o Schema mapear corretamente
            this.strategy.type = 'mysql';
            this.strategy.databaseName = db_name ;

            await DatabaseSchema.initialize(this.strategy, resetarBanco);

            console.log("Ambiente MySQL configurado com sucesso.");
        }
    }
  
    async execute(query, params) {
        if (!this.strategy) {
            throw new Error("Contexto de banco de dados não inicializado.");
        }
        return await this.strategy.execute(query, params);
    }
}

export const db = new DatabaseContext();
await db.init();