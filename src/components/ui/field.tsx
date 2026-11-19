export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${name}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="text-sm font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink";
