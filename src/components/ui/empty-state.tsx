export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-line bg-white px-5 py-8">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <p className="mt-2 max-w-prose text-base leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
