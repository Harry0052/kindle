"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

export function AccountTools({ displayName, hosted, going }: { displayName: string; hosted: number; going: number }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"export" | "delete" | null>(null);

  return (
    <section className="grid gap-4 rounded-[1.75rem] bg-white p-5">
      <h2 className="font-display text-3xl">Your data</h2>
      <p className="text-sm text-ink-soft">
        Plans you hosted: {hosted}. Plans you joined: {going}. These numbers are only yours. Kindle does not show a public score.
      </p>
      <Button
        variant="secondary"
        disabled={pending !== null}
        onClick={async () => {
          setPending("export");
          setError(null);
          try {
            const response = await fetch("/api/account/export", { method: "POST" });
            if (!response.ok) {
              setError("Kindle could not prepare that download.");
              return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "kindle-export.json";
            link.click();
            URL.revokeObjectURL(url);
          } catch {
            setError("Kindle could not reach the server. Nothing was downloaded.");
          } finally {
            setPending(null);
          }
        }}
      >
        {pending === "export" ? "Preparing…" : "Download JSON"}
      </Button>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending("delete");
          setError(null);
          try {
            const response = await fetch("/api/account/delete", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ displayName: typed }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
            if (!response.ok) {
              setError(payload?.error?.message ?? "Kindle could not delete that profile.");
              return;
            }
            window.location.assign(new URL("/", window.location.origin).toString());
          } catch {
            setError("Kindle could not reach the server. The profile was not deleted.");
          } finally {
            setPending(null);
          }
        }}
      >
        <Field label="Delete profile" name="delete-name" error={error ?? undefined} hint={`Type ${displayName} to delete this profile on this server. Hosted plans are cancelled and exact spots are cleared.`}>
          <input id="delete-name" className={inputClass} value={typed} onChange={(event) => setTyped(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "delete-name-error" : "delete-name-hint"} />
        </Field>
        <Button type="submit" variant="danger" disabled={pending !== null || typed !== displayName}>
          {pending === "delete" ? "Deleting…" : "Delete profile"}
        </Button>
      </form>
    </section>
  );
}
