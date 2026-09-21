import schemaData from './schema.json' with { type: 'json' }; // Ajuste de import se necessário

// O mapeador fica aqui, isolado, servindo apenas ao tradutor do Schema
const TYPE_MAP = {
    sqlite: {
        int: "INTEGER",
        default: "DEFAULT",
        defaultDatetime : "CURRENT_DATE",
        datetime: "TEXT",
        string: "TEXT",
        autoIncrement: "AUTOINCREMENT",
        primaryKey: "PRIMARY KEY"
    },
    mysql: {
        int: "INT",
        datetime: "DATETIME",        
        default: "DEFAULT",
        defaultDatetime : "CURRENT_TIMESTAMP",
        defaultBoolean : [ false, true ],
        string: "VARCHAR",
        boolean: "BOOLEAN",
        size: "100",
        decimal : "3",
        autoIncrement: "AUTO_INCREMENT",
        primaryKey: "PRIMARY KEY"
    },
    sqlserver: {
        int: "INT",
        datetime: "DATETIME",        
        default: "DEFAULT",
        defaultDatetime : "CURRENT_TIMESTAMP",
        defaultBoolean : [ false, true ],
        string: "VARCHAR",
        boolean: "BOOLEAN",
        size: "100",
        decimal : "3",
        autoIncrement: "AUTO_INCREMENT",
        primaryKey: "PRIMARY KEY"
    }
};

export class DatabaseSchema {
    static async initialize(dbStrategy, forceRefresh = false) {

        const dialect = dbStrategy.type; // Lê a propriedade 'type' da estratégia instanciada
        
        if (!dialect || !TYPE_MAP[dialect]) {
            throw new Error(`[ORM] Dialeto '${dialect}' não suportado pelo Schema.`);
        }
        
        console.log(`[ORM] Verificando estrutura para: ${dialect.toUpperCase()}...`);
        
        const dbName = dbStrategy.databaseName ;
        
        const map = TYPE_MAP[dialect];
        const queriesc = [];

        console.log( ` schmea : ${forceRefresh} - ${dbName} e ${dialect}` )
        // 1. Tratativa para criação do Banco de Dados se forceRefresh for true
        if (forceRefresh && dbName) {
            if (dialect === 'mysql') {
                // No MySQL, criamos o banco se ele não existir
                             
                queriesc.push(`CREATE DATABASE IF NOT EXISTS ${dbName};`);
                
                for (const query of queriesc) {
                    await dbStrategy.execute( query );
                }
            } else if (dialect === 'sqlserver') {
                // No SQL Server, verificamos na master e criamos
                queries.push(`USE master;`);                
                queries.push(`IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'\({dbName}') CREATE DATABASE [\){dbName}];`);
                queries.push(`USE [${dbName}];`);
            }
            // O SQLite geralmente cria o arquivo automaticamente, então não precisa de CREATE DATABASE explícito.
        }
        const queries = [];
        // Opcional para MySQL: Desativar checagem de chave estrangeira para o DROP não falhar por ordem
        if (forceRefresh && dialect === 'mysql') {
            queries.push(`SET FOREIGN_KEY_CHECKS = 0;`);
        }

        for (const [tableName, tableConfig] of Object.entries(schemaData.tables)) {

            if (forceRefresh) {
                queries.push(`DROP TABLE IF EXISTS ${tableName};`);
            }

            const columnDefinitions = [];

            for (const [columnName, colConfig] of Object.entries(tableConfig.columns)) {
                
                //console.log(`${columnName} ${map[colConfig.type]}`)

                let def = `${columnName} ${map[colConfig.type]}`;
                                
                if ( map.size && colConfig.size) def += `( ${colConfig.size} )`

                if (colConfig.primaryKey) def += ` ${map.primaryKey}`;
                if (colConfig.autoIncrement) def += ` ${map.autoIncrement}`;

                if (colConfig.nullable === false && !colConfig.primaryKey) {
                    def += " NOT NULL";
                } else if (colConfig.nullable === true) {
                    def += " NULL";
                }

                if ( map.default && colConfig.default ) {
                    switch (colConfig.type) {
                        case "datetime":
                            def += ` DEFAULT ( ${map.defaultDatetime} )`
                            break;
                        case "boolean":
                            if ( colConfig.default === true) {
                                def += ` ${"DEFAULT(1)"}`
                            } else {
                                def += ` ${"DEFAULT(0)"}`
                            }
                            break
                        default:
                            def += ` DEFAULT( ${ colConfig.default})`
                            break;
                    }
                }
                         
                columnDefinitions.push(def);
            }

            const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
                ${columnDefinitions.join(',\n                ')}
            );`;
            
            
            queries.push(sql);
        }

        for (const linha of queries ) {
            console.log( linha ) ;
        }
            
        for (const query of queries) {
            await dbStrategy.execute( query );
        }
        
        console.log(`[ORM] Tabelas sincronizadas com sucesso no ${dialect.toUpperCase()}.`);
    }
}