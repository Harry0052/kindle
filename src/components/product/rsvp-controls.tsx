"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RsvpControls({
  activityId,
  viewerStatus,
  full,
}: {
  activityId: string;
  viewerStatus: "host" | "going" | "waitlist" | "declined" | "left" | "none";
  full: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"going" | "declined" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(intent: "going" | "declined") {
    setPending(intent);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/activities/${activityId}/rsvp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string | null; error?: { message?: string } } | null;
      if (!response.ok) {
        setError(payload?.error?.message ?? "Kindle could not save that response.");
        return;
      }
      if (payload?.message) setMessage(payload.message);
      router.refresh();
    } catch {
      setError("Kindle could not reach the server. Your response was not saved.");
    } finally {
      setPending(null);
    }
  }

  if (viewerStatus === "host") {
    return <p className="font-semibold">You are hosting. That uses one of the spots.</p>;
  }

  const goingLabel = full && viewerStatus !== "going" ? "Join waitlist" : "I'm in";

  return (
    <div className="grid gap-3">
      {viewerStatus === "going" ? <p className="font-semibold text-good">You are in. The exact spot is below.</p> : null}
      {viewerStatus === "waitlist" ? (
        <p className="rounded-2xl bg-warn-bg px-4 py-3 font-semibold text-warn">You are on the waitlist. A spot is not held.</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="sunset" disabled={pending !== null || viewerStatus === "going"} onClick={() => void send("going")}>
          {pending === "going" ? "Saving…" : goingLabel}
        </Button>
        <Button variant="secondary" disabled={pending !== null || viewerStatus === "declined"} onClick={() => void send("declined")}>
          {pending === "declined" ? "Saving…" : "Can't go"}
        </Button>
      </div>
      {full && viewerStatus !== "going" ? (
        <p className="text-sm text-ink-soft">The plan is full. Joining the waitlist does not hold a spot.</p>
      ) : null}
      {message ? <p role="status" className="text-sm font-semibold text-warn">{message}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-clay">{error}</p> : null}
    </div>
  );
}
