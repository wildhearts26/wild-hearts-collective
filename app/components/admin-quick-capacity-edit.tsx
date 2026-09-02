"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_SESSION_CAPACITY_MAX } from "@/lib/admin-studio-config";

export function AdminQuickCapacityEdit({
  sessionId,
  capacity,
}: {
  sessionId: string;
  classSlug: string;
  capacity: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(capacity));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveCapacity() {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1 || next > ADMIN_SESSION_CAPACITY_MAX) return;

    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update capacity.");
      setSaved(true);
      router.refresh();
    } catch {
      setValue(String(capacity));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="text-xs text-muted">
        Max slots
        <input
          type="number"
          min={1}
          max={ADMIN_SESSION_CAPACITY_MAX}
          value={value}
          onChange={(event) => {
            setSaved(false);
            setValue(event.target.value);
          }}
          className="ml-2 w-16 rounded-sm border border-plum/15 px-2 py-1 text-sm text-plum"
        />
      </label>
      <button
        type="button"
        disabled={loading || Number(value) === capacity}
        onClick={saveCapacity}
        className="rounded-sm border border-plum/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-plum hover:border-pink disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save slots"}
      </button>
      {saved && <span className="text-xs text-emerald-700">Updated</span>}
    </div>
  );
}
