import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/db/client";
import { serverSnapshot } from "./metrics";

describe("server snapshot", () => {
  it("counts an empty server as zero instead of inventing traction", () => {
    const snapshot = serverSnapshot(createTestDb());
    expect(snapshot).toEqual({
      memberProfiles: 0,
      publishedPlans: 0,
      plansWithThreeGoingWithin24h: 0,
      membersWhoHostedAndJoined: 0,
    });
  });
});
