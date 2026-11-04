import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "caliber_final.db");
const globalWithDb = globalThis as unknown as {
  _writableDb?: Database.Database;
};
let writableDb: Database.Database | undefined;

export function getWritableDb() {
  if (globalWithDb._writableDb) return globalWithDb._writableDb;
  if (writableDb) return writableDb;

  writableDb = new Database(DB_PATH, { fileMustExist: true });
  writableDb.pragma("foreign_keys = ON");

  if (process.env.NODE_ENV !== "production") {
    globalWithDb._writableDb = writableDb;
  }

  return writableDb;
}
