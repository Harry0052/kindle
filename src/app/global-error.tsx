"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fbf7f4", color: "#172033", padding: "2rem" }}>
        <h1>Kindle hit a problem.</h1>
        <p>The page could not be shown. Nothing on screen should be treated as saved.</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
