import { z } from "zod";
import { isValidTimeZone } from "@/lib/time";

export const INTERESTS = [
  "basketball",
  "football",
  "running",
  "food",
  "coffee",
  "games",
  "music",
  "outdoors",
  "study",
  "other",
] as const;

export type Interest = (typeof INTERESTS)[number];

const STREET =
  /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,3}\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\b/i;

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

export const homeRegionSchema = z
  .string()
  .trim()
  .min(2, "Name an area people will recognize.")
  .max(60, "Keep the area under 60 characters.")
  .refine((value) => !value.includes("@"), "Use a place name, not an email.")
  .refine((value) => !STREET.test(value), "Use an area, not a street address.");

export const interestsSchema = z
  .array(z.enum(INTERESTS))
  .min(1, "Pick at least one interest.")
  .max(INTERESTS.length)
  .refine((values) => new Set(values).size === values.length, "Each interest can be picked once.");

export const profileSchema = z.object({
  displayName: displayNameSchema,
  timezone: timezoneSchema,
  homeRegion: homeRegionSchema,
  interests: interestsSchema,
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

export function profileReady(input: { homeRegion: string; interests: string[]; ageAttested: boolean; kind: string }) {
  return input.kind === "member" && input.ageAttested && input.homeRegion.trim().length >= 2 && input.interests.length > 0;
}
