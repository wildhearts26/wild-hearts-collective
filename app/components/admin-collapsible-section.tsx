"use client";

import { useState } from "react";

export function AdminCollapsibleSection({
  title,
  children,
  defaultOpen = false,
  empty,
  summary,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  empty?: boolean;
  summary?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mt-8 rounded-lg border border-plum/10 bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-plum">{title}</h2>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open ? (
        children
      ) : (
        <p className="mt-3 text-sm text-muted">
          {summary ??
            (empty ? "No admin actions logged yet." : "Hidden to keep the dashboard lighter.")}
        </p>
      )}
    </section>
  );
}
