import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type BetterSqlite from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { migrate } from "./migrate";
import { seedDemo } from "./seed";

export type KindleDb = BetterSQLite3Database<typeof schema> & { $client: BetterSqlite.Database };

const globalForDb = globalThis as unknown as { kindleSqlite?: Database.Database };

export function databasePath() {
  return process.env.KINDLE_DB_PATH ?? path.join(process.cwd(), "data", "kindle.db");
}

export function openDatabase(filename: string) {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  if (filename !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }
  sqlite.pragma("busy_timeout = 5000");
  migrate(sqlite);
  return sqlite;
}

export function getSqlite() {
  if (!globalForDb.kindleSqlite) {
    const sqlite = openDatabase(databasePath());
    seedDemo(drizzle(sqlite, { schema }));
    globalForDb.kindleSqlite = sqlite;
  }
  return globalForDb.kindleSqlite;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}

export function databaseFrom(sqlite: Database.Database): KindleDb {
  return drizzle(sqlite, { schema });
}

export function createTestDb() {
  return databaseFrom(openDatabase(":memory:"));
}
