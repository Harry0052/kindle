import { z } from "zod";
import { isValidTimeZone } from "@/lib/time";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(40, "Keep your name under 40 characters.")
  .refine((value) => !value.includes("@"), "Use a name, not an email address.")
  .refine((value) => !/https?:|www\./i.test(value), "Use a name, not a link.");

export const timezoneSchema = z
  .string()
  .trim()
  .refine((value) => isValidTimeZone(value), "Choose a valid timezone.");

export const profileSchema = z.object({
  displayName: displayNameSchema,
  timezone: timezoneSchema,
  ageAttested: z.boolean().refine((value) => value, "Confirm that you are 18 or older to use Kindle."),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function zodFields(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
