"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as { message?: string; activityId?: string; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload?.error?.message ?? "Kindle could not save that.");
  return payload;
}

export function BlockButton({ userId, label }: { userId: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Block {label}
      </Button>
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm text-ink-soft">They will lose your plans immediately, including ones they already joined.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            try {
              await post("/api/blocks", { userId });
              router.refresh();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Kindle could not save that block.");
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Blocking…" : "Block now"}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Keep them
        </Button>
      </div>
      {error ? <p role="alert" className="text-sm font-semibold text-clay">{error}</p> : null}
    </div>
  );
}

export function ReportForm({ subjectType, subjectId }: { subjectType: "user" | "activity" | "message"; subjectId: string }) {
  const [reason, setReason] = useState("uncomfortable");
  const [message, setMessage] = useState<string | null>(null);
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
          const payload = await post("/api/reports", { subjectType, subjectId, reason });
          setMessage(payload?.message ?? "Saved on this server.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Kindle could not save that report.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="Report" name={`report-${subjectId}`} hint="Saved on this server only. Nobody is emailed.">
        <select id={`report-${subjectId}`} className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="uncomfortable">I feel uncomfortable</option>
          <option value="spam">Spam</option>
          <option value="safety">Safety concern</option>
          <option value="other">Something else</option>
        </select>
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save report"}
      </Button>
      {message ? <p role="status" className="text-sm font-semibold">{message}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-clay">{error}</p> : null}
    </form>
  );
}

export function LeaveButton({ activityId }: { activityId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await post(`/api/activities/${activityId}/leave`);
            window.location.assign(new URL("/plans", window.location.origin).toString());
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Kindle could not save that.");
            setPending(false);
          }
        }}
      >
        {pending ? "Leaving…" : "Leave plan"}
      </Button>
      {error ? <p role="alert" className="text-sm font-semibold text-clay">{error}</p> : null}
    </div>
  );
}

export function CancelPlan({ activityId }: { activityId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Cancel plan
      </Button>
    );
  }
  return (
    <div className="grid gap-2">
      <p className="text-sm text-ink-soft">Everyone who joined will see that it is cancelled, and the exact spot will be hidden.</p>
      <Button
        variant="danger"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await post(`/api/activities/${activityId}/cancel`);
            window.location.assign(new URL(`/plans/${activityId}`, window.location.origin).toString());
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Kindle could not cancel that plan.");
            setPending(false);
          }
        }}
      >
        {pending ? "Cancelling…" : "Cancel for everyone"}
      </Button>
      {error ? <p role="alert" className="text-sm font-semibold text-clay">{error}</p> : null}
    </div>
  );
}

export function ReuseForm({ activityId }: { activityId: string }) {
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
          const payload = await post(`/api/activities/${activityId}/duplicate`, { startsLocal });
          if (!payload?.activityId) throw new Error("Kindle could not copy that plan.");
          window.location.assign(new URL(`/plans/${payload.activityId}`, window.location.origin).toString());
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Kindle could not copy that plan.");
          setPending(false);
        }
      }}
    >
      <Field label="Plan this again" name="reuse-time" error={error ?? undefined} hint="Copies the name, area, and exact spot into a draft. Nobody is re-invited.">
        <input id="reuse-time" type="datetime-local" required className={inputClass} value={startsLocal} onChange={(event) => setStartsLocal(event.target.value)} />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Copying…" : "Make a new draft"}
      </Button>
    </form>
  );
}
