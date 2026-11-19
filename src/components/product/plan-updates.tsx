"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

export function TimeForm({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [startsLocal, setStartsLocal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
          const response = await fetch(`/api/activities/${activityId}/time`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ startsLocal }),
          });
          const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
          if (!response.ok) {
            setError(payload?.error?.message ?? "Kindle could not save that time.");
            return;
          }
          setStartsLocal("");
          router.refresh();
        } catch {
          setError("Kindle could not reach the server. The time was not changed.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="New time" name="new-time" error={error ?? undefined} hint="People who are in or waiting see an update here. Kindle does not text or email them.">
        <input id="new-time" type="datetime-local" required className={inputClass} value={startsLocal} aria-invalid={error ? true : undefined} aria-describedby={error ? "new-time-error" : "new-time-hint"} onChange={(event) => setStartsLocal(event.target.value)} />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Update time"}
      </Button>
    </form>
  );
}

export function CommentForm({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
          const response = await fetch(`/api/activities/${activityId}/messages`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ body }),
          });
          const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
          if (!response.ok) {
            setError(payload?.error?.message ?? "Kindle could not save that comment.");
            return;
          }
          setBody("");
          router.refresh();
        } catch {
          setError("Kindle could not reach the server. The comment was not saved.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="Comment" name="comment" error={error ?? undefined} hint="Only people who are in can read comments.">
        <textarea id="comment" required maxLength={500} className={`${inputClass} min-h-24 py-3`} value={body} aria-invalid={error ? true : undefined} aria-describedby={error ? "comment-error" : "comment-hint"} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Post update"}
      </Button>
    </form>
  );
}
