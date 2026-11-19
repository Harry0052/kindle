export function logFailure(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(
    JSON.stringify({
      scope,
      message: message.slice(0, 200),
      at: new Date().toISOString(),
    }),
  );
}
