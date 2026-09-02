import { formatCredits } from "@/lib/credit-units";

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  phone: "phone",
  dateOfBirth: "date of birth",
  emergencyContactName: "emergency contact name",
  emergencyContactRelationship: "emergency contact relationship",
  emergencyContactPhone: "emergency contact phone",
  medicalNotes: "medical notes",
  injuriesLimitations: "injuries / limitations",
  allergiesSafetyAlerts: "allergies / safety alerts",
  experienceLevel: "experience level",
  disciplineInterests: "discipline interests",
  internalNotes: "internal notes",
  membershipStatus: "membership status",
  creditsRemaining: "class credits",
  accountStatus: "account access",
};

export type AdminAuditChange = {
  field: string;
  from: unknown;
  to: unknown;
};

function parseDetails(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "none";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") {
    return Number.isFinite(value) ? formatCredits(value) : String(value);
  }
  return String(value);
}

function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field;
}

function describeCreditChange(from: unknown, to: unknown) {
  const before = Number(from ?? 0);
  const after = Number(to ?? 0);
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    return `changed class credits from ${displayValue(from)} to ${displayValue(to)}`;
  }
  const delta = Math.round((after - before) * 100) / 100;
  if (delta > 0) {
    return `added ${formatCredits(delta)} credit${delta === 1 ? "" : "s"} (${formatCredits(before)} → ${formatCredits(after)})`;
  }
  if (delta < 0) {
    const removed = Math.abs(delta);
    return `removed ${formatCredits(removed)} credit${removed === 1 ? "" : "s"} (${formatCredits(before)} → ${formatCredits(after)})`;
  }
  return `set class credits to ${formatCredits(after)}`;
}

function describeMemberChanges(changes: AdminAuditChange[]) {
  if (changes.length === 0) return "updated member details";

  const credit = changes.find((change) => change.field === "creditsRemaining");
  const others = changes.filter((change) => change.field !== "creditsRemaining");

  const parts: string[] = [];
  if (credit) {
    parts.push(describeCreditChange(credit.from, credit.to));
  }
  for (const change of others.slice(0, 4)) {
    parts.push(
      `changed ${fieldLabel(change.field)} from “${displayValue(change.from)}” to “${displayValue(change.to)}”`,
    );
  }
  if (others.length > 4) {
    parts.push(`and ${others.length - 4} other field${others.length - 4 === 1 ? "" : "s"}`);
  }
  return parts.join("; ");
}

const ACTION_FALLBACKS: Record<string, string> = {
  "member.updated": "updated member details",
  "member.id_approved": "approved identification",
  "member.id_rejected": "rejected identification",
  "membership.paused": "paused membership",
  "membership.resumed": "resumed membership",
  "membership.cancelled": "cancelled membership",
  "membership.terminated": "terminated membership",
  booking_removed: "removed a booking",
  booking_deleted: "deleted a booking",
  booking_force_added: "force-booked a member onto a class",
  session_created: "created a class session",
  session_updated: "updated a class session",
  session_cancelled: "cancelled a class session",
};

export function formatAdminAuditSummary(entry: {
  action: string;
  adminLabel?: string | null;
  details?: string | null;
  targetUser?: { name: string } | null;
}) {
  const actor = entry.adminLabel?.trim() || "Admin";
  const target = entry.targetUser?.name?.trim();
  const details = parseDetails(entry.details);

  let verb = ACTION_FALLBACKS[entry.action] ?? entry.action.replace(/[._]/g, " ");

  if (entry.action === "member.updated" && details) {
    const changes = Array.isArray(details.changes)
      ? (details.changes as AdminAuditChange[])
      : [];
    if (changes.length > 0) {
      verb = describeMemberChanges(changes);
    } else if (Array.isArray(details.fields) && details.fields.length > 0) {
      const fields = (details.fields as string[]).map(fieldLabel);
      verb = `updated ${fields.slice(0, 5).join(", ")}${fields.length > 5 ? `, and ${fields.length - 5} more` : ""}`;
    }
  }

  if (target) {
    if (entry.action === "member.updated" && verb.startsWith("added ")) {
      return `${actor} ${verb} to ${target}`;
    }
    if (entry.action === "member.updated" && verb.startsWith("removed ")) {
      return `${actor} ${verb} from ${target}`;
    }
    return `${actor} ${verb} for ${target}`;
  }

  return `${actor} ${verb}`;
}

/** Compare existing member values with the patch payload; return only real changes. */
export function buildMemberAuditChanges(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>,
): AdminAuditChange[] {
  const changes: AdminAuditChange[] = [];

  for (const [field, nextRaw] of Object.entries(patch)) {
    const prevRaw = existing[field];
    const prev = normalizeAuditValue(field, prevRaw);
    const next = normalizeAuditValue(field, nextRaw);
    if (prev === next) continue;
    changes.push({ field, from: prevRaw ?? null, to: nextRaw ?? null });
  }

  return changes;
}

function normalizeAuditValue(field: string, value: unknown): string {
  if (value == null) return "";
  if (field === "creditsRemaining") {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.round(num * 100) / 100) : String(value);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  if (typeof value === "string") return value.trim();
  return String(value);
}
