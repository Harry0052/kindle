"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { disabledReason } from "@/lib/flags";

export function InvitePanel() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-3 rounded-[1.75rem] bg-white p-5">
      <h2 className="font-display text-3xl">Invite a friend</h2>
      <p className="text-sm text-ink-soft">
        The link works for 14 days. Kindle stores only a hash, so copy it now. {disabledReason("contactsImport")} {disabledReason("smsDelivery")}
      </p>
      <Button
        variant="sunset"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          setCopied(false);
          try {
            const response = await fetch("/api/friends/invite", { method: "POST" });
            const payload = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
            if (!response.ok || !payload?.url) {
              setError(payload?.error?.message ?? "Kindle could not create a link.");
              return;
            }
            setUrl(payload.url);
            sessionStorage.setItem("kindle-last-invite", payload.url);
          } catch {
            setError("Kindle could not reach the server. No link was created.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Creating…" : "Create friend link"}
      </Button>
      {url ? (
        <div className="grid gap-2">
          <label htmlFor="invite-url" className="text-sm font-bold">
            Friend link
          </label>
          <input id="invite-url" readOnly className="min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-sm" value={url} />
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setError("Copy it from the field. This browser blocked the clipboard.");
              }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
