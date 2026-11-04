import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "caliber_final.db");

// Singleton: cegah banyak koneksi saat hot reload di dev
const g = globalThis as unknown as { _db?: Database.Database };

export const db =
    g._db ?? new Database(DB_PATH, { readonly: true, fileMustExist: true });

if (process.env.NODE_ENV !== "production") g._db = db;