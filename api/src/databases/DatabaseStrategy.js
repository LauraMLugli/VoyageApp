// Implementação para MySQL
export class MySQLStrategy {
    constructor(pool) { this.pool = pool; }
    
    async execute(query, params = []) {
        // O mysql2 já retorna [results, fields], então apenas repassamos o array completo
        return await this.pool.execute(query, params);
    }
}

// Implementação para SQLite
export class SQLiteStrategy {
    constructor(db) { this.db = db; }

    async execute(query, params = []) {
        const fields = []; // SQLite não fornece metadados de coluna facilmente, enviamos vazio

        if (query.trim().toUpperCase().startsWith('SELECT')) {
            const results = await this.db.all(query, params);
            // Retorna no formato [ dados, colunas ]
            return [results, fields];
        } else {
            const result = await this.db.run(query, params);       
            // O MySQL em comandos de escrita retorna um objeto com essas propriedades
            // na primeira posição do array
            const mysqlLikeResult = {
                insertId: result.lastID,
                affectedRows: result.changes,
                warningStatus: 0
            };

            return [mysqlLikeResult, fields];
        }
    }
}