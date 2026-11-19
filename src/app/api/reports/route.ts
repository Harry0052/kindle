import { z } from "zod";
import { mutationGuard } from "@/lib/http/guard";
import { jsonError, readJson } from "@/lib/http";
import { logFailure } from "@/lib/observability";
import { fileReport } from "@/lib/plans/safety";

const bodySchema = z.object({
  subjectType: z.enum(["user", "activity", "message"]),
  subjectId: z.string().min(1).max(80),
  reason: z.enum(["uncomfortable", "spam", "safety", "other"]),
});

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "report");
  if (!guard.ok) return guard.response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "invalid", "Choose what you are reporting and a reason.");
  try {
    const filed = fileReport(guard.db, guard.user, parsed.data);
    if (!filed.ok) return jsonError(400, "invalid", filed.message);
    return Response.json({ ok: true, message: filed.message });
  } catch (error) {
    logFailure("report", error);
    return jsonError(500, "store", "Kindle could not save that report.");
  }
}
