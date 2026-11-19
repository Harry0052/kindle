import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError } from "@/lib/http";
import { listTonight } from "@/lib/plans/service";

export async function GET(request: Request) {
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user || user.kind !== "member") return jsonError(401, "auth", "Save your profile before seeing Tonight.");
  const category = new URL(request.url).searchParams.get("category") ?? undefined;
  if (category && category !== "sport" && category !== "food" && category !== "hobby") {
    return jsonError(400, "invalid", "Filter by sport, food, or hobby.");
  }
  const plans = listTonight(db, user, { category });
  return Response.json({
    ok: true,
    activities: plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      category: plan.category,
      startsAt: plan.startsAt,
      timeLabel: plan.timeLabel,
      areaLabel: plan.areaLabel,
      capacity: plan.capacity,
      exactHidden: plan.exactHidden,
      exactLocation: plan.exactLocation,
    })),
  });
}
