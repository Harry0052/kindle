import { z } from "zod";
import { homeRegionSchema } from "./profile";

export const CATEGORIES = ["sport", "food", "hobby"] as const;
export type Category = (typeof CATEGORIES)[number];

export const activitySchema = z.object({
  title: z.string().trim().min(3, "Give the plan a name of at least 3 characters.").max(80, "Keep the name under 80 characters."),
  category: z.enum(CATEGORIES, { message: "Choose sport, food, or hobby." }),
  startsLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a date and time."),
  capacity: z.number().int().min(2, "A plan needs at least 2 spots.").max(30, "Keep the plan to 30 spots."),
  areaLabel: homeRegionSchema,
  exactLocation: z
    .string()
    .trim()
    .max(120, "Keep the exact spot under 120 characters.")
    .optional()
    .transform((value) => value ?? ""),
  publish: z.boolean(),
  idempotencyKey: z.string().trim().min(8).max(80).optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;
