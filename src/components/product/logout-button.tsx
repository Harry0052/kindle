"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
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
            const response = await fetch("/api/session/logout", { method: "POST" });
            if (!response.ok) {
              setError("Kindle could not log you out.");
              return;
            }
            window.location.assign(new URL("/", window.location.origin).toString());
          } catch {
            setError("Kindle could not reach the server. You are still signed in.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Logging out…" : "Log out"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
