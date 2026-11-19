export function nowIso(now = new Date()) {
  return now.toISOString();
}

type WallParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function partsInZone(date: Date, timeZone: string): WallParts | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    let hour = Number(read("hour"));
    if (hour === 24) hour = 0;
    return {
      year: Number(read("year")),
      month: Number(read("month")),
      day: Number(read("day")),
      hour,
      minute: Number(read("minute")),
      second: Number(read("second")),
    };
  } catch {
    return null;
  }
}

export function zoneOffsetMs(date: Date, timeZone: string) {
  const parts = partsInZone(date, timeZone);
  if (!parts) return null;
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

export function wallClock(date: Date, timeZone: string) {
  const parts = partsInZone(date, timeZone);
  if (!parts) return null;
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");
  return `${parts.year}-${month}-${day}T${hour}:${minute}`;
}

/** Interpret a datetime-local value as wall time in an IANA timezone. */
export function zonedLocalToUtc(local: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const first = zoneOffsetMs(new Date(utcGuess), timeZone);
  if (first === null) return null;
  const firstUtc = new Date(utcGuess - first);
  if (wallClock(firstUtc, timeZone) === local) return firstUtc.toISOString();

  const second = zoneOffsetMs(firstUtc, timeZone);
  if (second === null) return null;
  const secondUtc = new Date(utcGuess - second);
  if (wallClock(secondUtc, timeZone) !== local) return null;
  return secondUtc.toISOString();
}

export function isValidTimeZone(value: string) {
  if (!value || value.length > 80) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function formatInZone(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

export function formatTimeInZone(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

export function localDateInZone(iso: string, timeZone: string) {
  const parts = partsInZone(new Date(iso), timeZone);
  if (!parts) return null;
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function todayLabel(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(now);
}

export const COMMON_TIME_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;
