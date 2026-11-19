import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@/lib/db/client";
import { CLAIM_SQL } from "./capacity";

describe("concurrent RSVP claims", () => {
  it("lets only one of two overlapping writes take the last spot", async () => {
    const file = path.join(os.tmpdir(), `kindle-race-${Date.now()}.db`);
    const sqlite = openDatabase(file);
    sqlite
      .prepare(
        `INSERT INTO users (id, display_name, timezone, age_attested, home_region, kind, created_at)
         VALUES ('host', 'Host', 'UTC', 1, 'Town', 'member', '2026-01-01T00:00:00.000Z')`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO activities (
          id, host_id, title, category, starts_at, capacity, visibility, area_label, exact_location,
          status, demo, idempotency_key, going_count, created_at, updated_at
        ) VALUES ('plan', 'host', 'Run', 'sport', '2026-06-01T23:00:00.000Z', 1, 'friends', 'Park', NULL,
          'published', 0, NULL, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
      )
      .run();
    sqlite.close();

    const workerSource = `
      const { parentPort, workerData } = require("node:worker_threads");
      const Database = require("better-sqlite3");
      const sqlite = new Database(workerData.file);
      sqlite.pragma("busy_timeout = 5000");
      const tx = sqlite.transaction(() => {
        const start = Date.now();
        while (Date.now() - start < 60) {}
        return sqlite.prepare(workerData.sql).run(workerData.now, workerData.id).changes;
      });
      parentPort.postMessage(tx.immediate());
    `;

    const run = () =>
      new Promise<number>((resolve, reject) => {
        const worker = new Worker(workerSource, {
          eval: true,
          workerData: { file, sql: CLAIM_SQL, now: new Date().toISOString(), id: "plan" },
        });
        worker.once("message", resolve);
        worker.once("error", reject);
      });

    const [first, second] = await Promise.all([run(), run()]);
    expect(first + second).toBe(1);
    const check = openDatabase(file);
    const row = check.prepare("SELECT going_count AS goingCount FROM activities WHERE id = 'plan'").get() as {
      goingCount: number;
    };
    expect(row.goingCount).toBe(1);
    check.close();
  });
});
