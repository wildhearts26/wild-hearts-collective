"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { memberTypeLabel } from "@/lib/household-config";

export type SwitcherMember = {
  id: string;
  name: string;
  memberType: string;
  isActive: boolean;
  image?: string | null;
};

export function MemberSwitcher({
  members,
  compact = false,
}: {
  members: SwitcherMember[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (members.length <= 1) return null;

  async function switchTo(memberId: string) {
    if (members.find((member) => member.id === memberId)?.isActive) return;
    setError("");
    setLoadingId(memberId);
    try {
      const response = await fetch("/api/members/household/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to switch member.");
        return;
      }
      router.refresh();
      window.location.reload();
    } catch {
      setError("Unable to switch member.");
    } finally {
      setLoadingId(null);
    }
  }

  const active = members.find((member) => member.isActive) ?? members[0];

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-brand">
        Booking as
      </label>
      <select
        value={active.id}
        disabled={Boolean(loadingId)}
        onChange={(event) => switchTo(event.target.value)}
        className="w-full rounded-sm border border-plum/15 bg-white px-3 py-2 text-sm text-plum outline-none ring-pink focus:border-pink focus:ring-1 disabled:opacity-60"
        aria-label="Switch household member"
      >
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} ({memberTypeLabel(member.memberType)})
          </option>
        ))}
      </select>
      {loadingId ? <p className="text-xs text-muted">Switching…</p> : null}
      {error ? (
        <p className="text-xs text-brand" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
