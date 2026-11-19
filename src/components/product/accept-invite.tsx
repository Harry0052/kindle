"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <Button
        variant="sunset"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch("/api/friends/accept", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ token }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
            if (!response.ok) {
              setError(payload?.error?.message ?? "Kindle could not save that friendship.");
              return;
            }
            window.location.assign(new URL("/friends", window.location.origin).toString());
          } catch {
            setError("Kindle could not reach the server. You are not friends yet.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Saving…" : "Accept friend request"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
