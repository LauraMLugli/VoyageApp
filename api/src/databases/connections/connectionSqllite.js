import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DATABASE = process.env.DB_DATABASE || 'database';

const DB_PATH = path.join(
    __dirname,
    `../${DB_DATABASE}.db`
);

export const getDbConnection = async (forceRefresh = false) => {

    const filename = DB_PATH ;
    
    console.log('--------------------------------');
    console.log('Abrindo banco SQLite');
    console.log('DB_PATH:', filename);
    console.log('forceRefresh:', forceRefresh);
    console.log('Banco existe?', fs.existsSync(filename));
    console.log('--------------------------------');

    // Se forceRefresh for true, apaga o banco existente
    if (forceRefresh === true) {

        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
            console.log(`Banco de dados removido: ${filename}`);
        }

    } else {

        // Se não for refresh, o banco obrigatoriamente deve existir
        if (!fs.existsSync(filename)) {
            throw new Error(`Banco de dados não encontrado: ${filename}`);
        }
    }

    // Abre o banco existente ou cria um novo
    // caso tenha sido apagado pelo forceRefresh
    return open({
        filename,
        driver: sqlite3.Database
    });
};