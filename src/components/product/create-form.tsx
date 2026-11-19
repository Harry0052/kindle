"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { disabledReason } from "@/lib/flags";

type Fields = Record<string, string>;

export function CreateForm({ defaultArea }: { defaultArea: string }) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sport");
  const [startsLocal, setStartsLocal] = useState(defaultStart);
  const [capacity, setCapacity] = useState(6);
  const [areaLabel, setAreaLabel] = useState(defaultArea);
  const [exactLocation, setExactLocation] = useState("");
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"publish" | "draft" | null>(null);

  async function submit(publish: boolean) {
    setPending(publish ? "publish" : "draft");
    setFormError(null);
    setErrors({});
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          startsLocal,
          capacity: Number(capacity),
          areaLabel,
          exactLocation,
          publish,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        activity?: { id: string };
        error?: { message?: string; fields?: Fields };
      } | null;
      if (!response.ok || !payload?.activity) {
        setErrors(payload?.error?.fields ?? {});
        setFormError(payload?.error?.message ?? "Kindle could not save that plan.");
        idempotencyKey.current = crypto.randomUUID();
        return;
      }
      window.location.assign(new URL(`/plans/${payload.activity.id}`, window.location.origin).toString());
    } catch {
      setFormError("Kindle could not reach the server. Nothing was saved.");
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-[1.75rem] bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(true);
      }}
    >
      <Field label="What are you doing?" name="title" error={errors.title}>
        <input id="title" className={inputClass} required minLength={3} maxLength={80} value={title} aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? "title-error" : undefined} onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold">Kind of plan</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["sport", "food", "hobby"] as const).map((item) => (
            <label key={item} className={`flex min-h-12 items-center justify-center rounded-full border text-sm font-bold capitalize ${category === item ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
              <input className="sr-only" type="radio" name="category" value={item} checked={category === item} onChange={() => setCategory(item)} />
              {item}
            </label>
          ))}
        </div>
        {errors.category ? <p className="text-sm font-semibold text-clay">{errors.category}</p> : null}
      </fieldset>
      <Field label="When" name="startsLocal" error={errors.startsLocal} hint="This time is in the timezone on your profile.">
        <input id="startsLocal" type="datetime-local" className={inputClass} required value={startsLocal} aria-invalid={errors.startsLocal ? true : undefined} aria-describedby={errors.startsLocal ? "startsLocal-error" : "startsLocal-hint"} onChange={(event) => setStartsLocal(event.target.value)} />
      </Field>
      <Field label="Spots" name="capacity" error={errors.capacity} hint="Includes you. A full plan will not pretend to have room.">
        <input id="capacity" type="number" min={2} max={30} className={inputClass} required value={capacity} aria-invalid={errors.capacity ? true : undefined} aria-describedby={errors.capacity ? "capacity-error" : "capacity-hint"} onChange={(event) => setCapacity(Number(event.target.value))} />
      </Field>
      <Field label="Area" name="areaLabel" error={errors.areaLabel} hint="Neighborhood, park, or campus. Not a street address.">
        <input id="areaLabel" className={inputClass} required maxLength={60} value={areaLabel} aria-invalid={errors.areaLabel ? true : undefined} aria-describedby={errors.areaLabel ? "areaLabel-error" : "areaLabel-hint"} onChange={(event) => setAreaLabel(event.target.value)} />
      </Field>
      <Field label="Exact spot" name="exactLocation" error={errors.exactLocation} hint="Optional. Friends see this only after they are in. Kindle does not put it on a map.">
        <input id="exactLocation" className={inputClass} maxLength={120} value={exactLocation} aria-invalid={errors.exactLocation ? true : undefined} aria-describedby={errors.exactLocation ? "exactLocation-error" : "exactLocation-hint"} onChange={(event) => setExactLocation(event.target.value)} />
      </Field>
      <p className="text-sm text-ink-soft">{disabledReason("venuePartners")} {disabledReason("publicMap")}</p>
      {formError ? (
        <p role="alert" className="rounded-2xl bg-clay-bg px-4 py-3 text-sm font-semibold text-clay">
          {formError}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="submit" variant="sunset" disabled={pending !== null}>
          {pending === "publish" ? "Publishing…" : "Publish to friends"}
        </Button>
        <Button type="button" variant="secondary" disabled={pending !== null} onClick={() => void submit(false)}>
          {pending === "draft" ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}

function defaultStart() {
  const date = new Date(Date.now() + 3 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
