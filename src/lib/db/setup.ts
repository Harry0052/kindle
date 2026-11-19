import { databasePath, getSqlite } from "./client";

getSqlite();
console.log(`Kindle database is migrated at ${databasePath()}`);
