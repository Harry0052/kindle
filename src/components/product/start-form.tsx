"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { COMMON_TIME_ZONES } from "@/lib/time";

type Fields = {
  displayName?: string;
  timezone?: string;
  ageAttested?: string;
};

export function StartForm({
  mode,
  initialName = "",
  initialTimezone = "UTC",
}: {
  mode: "create" | "edit";
  initialName?: string;
  initialTimezone?: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [ageAttested, setAgeAttested] = useState(mode === "edit");
  const [zones, setZones] = useState<string[]>(() => uniqueZones(initialTimezone));
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function captureDeviceZone() {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;
    setZones(uniqueZones(detected));
    if (mode === "create" && timezone === "UTC") setTimezone(detected);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setErrors({});
    if (!ageAttested) {
      setErrors({ ageAttested: "Confirm that you are 18 or older to use Kindle." });
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, timezone, ageAttested: true }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string; fields?: Fields };
      } | null;
      if (!response.ok) {
        setErrors(payload?.error?.fields ?? {});
        setFormError(payload?.error?.message ?? "Kindle could not save that profile.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setFormError("Kindle could not reach the server. Nothing was saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="start" onSubmit={onSubmit} className="grid gap-4 rounded-[1.75rem] bg-white p-5 shadow-sm" noValidate>
      <Field label="Name" name="displayName" error={errors.displayName} hint="A name your friends already use. Not an email.">
        <input
          id="displayName"
          name="displayName"
          className={inputClass}
          autoComplete="nickname"
          maxLength={40}
          required
          value={displayName}
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={errors.displayName ? "displayName-error" : "displayName-hint"}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </Field>
      <Field label="Timezone" name="timezone" error={errors.timezone} hint="Plan times are shown in this zone.">
        <select
          id="timezone"
          name="timezone"
          className={inputClass}
          value={timezone}
          aria-invalid={errors.timezone ? true : undefined}
          aria-describedby={errors.timezone ? "timezone-error" : "timezone-hint"}
          onFocus={captureDeviceZone}
          onChange={(event) => setTimezone(event.target.value)}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-2">
        <label className="flex min-h-12 items-start gap-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={ageAttested}
            onChange={(event) => setAgeAttested(event.target.checked)}
            aria-describedby="age-hint"
          />
          <span>I am 18 or older.</span>
        </label>
        <p id="age-hint" className="text-sm text-ink-soft">
          Kindle asks you to confirm this. It does not check an ID.
        </p>
        {errors.ageAttested ? (
          <p id="ageAttested-error" className="text-sm font-semibold text-clay">
            {errors.ageAttested}
          </p>
        ) : null}
      </div>
      {formError ? (
        <p role="alert" className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold text-clay">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="sunset" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Save and see tonight" : "Save profile"}
      </Button>
    </form>
  );
}

function uniqueZones(extra: string) {
  return Array.from(new Set([extra, ...COMMON_TIME_ZONES]));
}
