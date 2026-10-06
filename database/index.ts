import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DATABASE_NAME = 'burrow_local.db';
let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async () => {
    if (db) {
        return db;
    }

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(` PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
    await runMigrations(db);

    return db;
}
