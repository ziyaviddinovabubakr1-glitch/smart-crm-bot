import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { SCHEMA } from "./schema";
import { runMigrations } from "./migrations";

let db: DatabaseSync | null = null;

export function getDb() {
  if (db) return db;

  const dbPath =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "crm.sqlite");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  runMigrations(db);

  return db;
}

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}
