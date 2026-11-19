"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PublishButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <Button
        variant="sunset"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch(`/api/activities/${activityId}/publish`, { method: "POST" });
            const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
            if (!response.ok) {
              setError(payload?.error?.message ?? "Kindle could not publish that plan.");
              return;
            }
            router.refresh();
          } catch {
            setError("Kindle could not reach the server. The plan is still a draft.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Publishing…" : "Publish to friends"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
