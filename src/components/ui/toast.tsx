"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const value = useMemo(() => (next: string) => setMessage(next), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6">
        {message ? (
          <p role="status" className="pointer-events-auto max-w-md rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg">
            {message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
