"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminMemberAvatar } from "@/app/components/admin-member-avatar";
import { AdminParQPanel } from "@/app/components/admin-parq-panel";
import {
  ACCOUNT_STATUS,
  accountStatusLabel,
  DISCIPLINE_INTERESTS,
  EXPERIENCE_LEVELS,
} from "@/lib/profile-config";
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  membershipPlanLabel,
  membershipStatusLabel,
  membershipStatusTone,
} from "@/lib/membership-config";
import {
  formatUkDateShort,
  formatUkDateTimeShort,
} from "@/lib/booking-config";
import type { MemberProfile } from "@/lib/member-profile-service";
import { idDocumentStatusLabel, memberTypeLabel } from "@/lib/household-config";

type AdminMemberDetailProps = {
  memberId: string;
  initialMember: MemberProfile & {
    internalNotes: string | null;
    signupMethod: string;
    bookingCount: number;
  };
  timeline: {
    id: string;
    type: string;
    note: string | null;
    effectiveAt: string;
    endsAt: string | null;
    createdBy: string;
  }[];
  recentBookings: {
    id: string;
    status: string;
    attendance: string | null;
    classTitle: string;
    startsAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
  parQStatus: {
    completed: boolean;
    completedAt: string | null;
    data: Record<string, unknown> | null;
  };
  guardian?: { id: string; name: string } | null;
  householdChildren?: { id: string; name: string }[];
  idDocument?: {
    id: string;
    fileName: string;
    mimeType: string;
    uploadedAt: string;
    status: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  } | null;
};

const inputClass =
  "w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1";

function formatDate(value: string | null) {
  if (!value) return "—";
  return formatUkDateShort(value);
}

export function AdminMemberDetail({
  memberId,
  initialMember,
  timeline,
  recentBookings,
  auditLogs,
  parQStatus,
  guardian = null,
  householdChildren = [],
  idDocument = null,
}: AdminMemberDetailProps) {
  const router = useRouter();
  const [member, setMember] = useState(initialMember);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone ?? "",
    dateOfBirth: member.dateOfBirth ?? "",
    emergencyContactName: member.emergencyContact.name ?? "",
    emergencyContactRelationship: member.emergencyContact.relationship ?? "",
    emergencyContactPhone: member.emergencyContact.phone ?? "",
    medicalNotes: member.healthSafety.medicalNotes ?? "",
    injuriesLimitations: member.healthSafety.injuriesLimitations ?? "",
    allergiesSafetyAlerts: member.healthSafety.allergiesSafetyAlerts ?? "",
    disciplineSkills: { ...member.disciplineSkills },
    internalNotes: member.internalNotes ?? "",
    membershipPlan: member.membership.plan,
    membershipStatus: member.membership.status,
    creditsRemaining: member.membership.creditsRemaining,
    accountStatus: member.membership.accountStatus,
  });

  const [pauseStart, setPauseStart] = useState("");
  const [resumeAt, setResumeAt] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [idReviewNote, setIdReviewNote] = useState(idDocument?.reviewNote ?? "");

  async function reviewIdDocument(status: "approved" | "rejected") {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/members/${memberId}/id-document`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNote: idReviewNote.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update identification status.");
      }
      setMessage(
        status === "approved"
          ? "Identification approved. Parent notified by email."
          : "Identification rejected. Parent notified by email — they must re-upload before this child can book.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update identification status.");
    } finally {
      setLoading(false);
    }
  }

  async function saveMember(payload: Record<string, unknown>) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed.");
      setMember((current) => ({ ...current, ...data.member, internalNotes: form.internalNotes }));
      setMessage("Member updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runMembershipAction(action: "pause" | "resume" | "cancel" | "terminate") {
    if (action === "cancel" || action === "terminate") {
      const label = action === "terminate" ? "terminate immediately" : "cancel at period end";
      if (!window.confirm(`Confirm you want to ${label} this membership?`)) return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/members/${memberId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pauseStart: pauseStart || undefined,
          resumeAt: resumeAt || null,
          reason: actionReason || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action failed.");
      if (data.membership) {
        setMember((current) => ({
          ...current,
          membership: { ...current.membership, ...data.membership },
        }));
      }
      setMessage(`Membership ${action} completed.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {(message || error) && (
        <div
          className={`rounded-sm px-4 py-3 text-sm ${
            error ? "border border-red-200 bg-red-50 text-red-800" : "border border-sage/30 bg-sage-light text-plum"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AdminMemberAvatar
              name={member.name}
              image={member.image}
              sizeClass="h-20 w-20"
              initialsClassName="text-2xl"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {memberTypeLabel(member.memberType)}
              </p>
              <h2 className="mt-2 font-display text-3xl text-plum">{member.name}</h2>
              <p className="mt-1 text-sm text-muted">{member.email}</p>
              {guardian ? (
                <p className="mt-1 text-sm text-muted">
                  Guardian:{" "}
                  <Link href={`/admin/members/${guardian.id}`} className="font-semibold text-brand hover:underline">
                    {guardian.name}
                  </Link>
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                Joined {formatDate(member.createdAt)} · {member.signupMethod} ·{" "}
                {member.bookingCount} booking{member.bookingCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${membershipStatusTone(member.membership.status)}`}
            >
              {membershipStatusLabel(member.membership.status)}
            </span>
            {member.isChild && (
              <span className="inline-flex rounded-full bg-pink-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                Child
              </span>
            )}
            {member.membership.accountStatus !== ACCOUNT_STATUS.active && (
              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-800">
                {accountStatusLabel(member.membership.accountStatus)}
              </span>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-muted">Credits</dt>
            <dd className="font-semibold text-plum">{member.membership.creditsRemaining}</dd>
          </div>
          <div>
            <dt className="text-muted">Plan</dt>
            <dd className="font-semibold text-plum">{membershipPlanLabel(member.membership.plan)}</dd>
          </div>
          <div>
            <dt className="text-muted">Started</dt>
            <dd className="font-semibold text-plum">{formatDate(member.membership.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Renews</dt>
            <dd className="font-semibold text-plum">{formatDate(member.membership.renewsAt)}</dd>
          </div>
        </dl>
      </section>

      {(member.isChild || householdChildren.length > 0) && (
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">
            {member.isChild ? "Parental consent & identification" : "Child members"}
          </h3>
          {member.isChild ? (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Consent given</dt>
                <dd className="font-semibold text-plum">
                  {member.parentalConsent.givenAt
                    ? `${formatDate(member.parentalConsent.givenAt)} by ${member.parentalConsent.name ?? "parent/guardian"}`
                    : "Missing"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Relationship</dt>
                <dd className="font-semibold text-plum">
                  {member.parentalConsent.relationship ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Identification</dt>
                <dd className="mt-1">
                  {idDocument ? (
                    <div className="space-y-3">
                      <p className="font-semibold text-plum">
                        {idDocument.fileName} · {idDocumentStatusLabel(idDocument.status)}
                      </p>
                      <p className="text-xs text-muted">
                        Uploaded {formatUkDateTimeShort(idDocument.uploadedAt)}
                      </p>
                      <a
                        href={`/api/admin/members/${memberId}/id-document`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-semibold text-brand hover:underline"
                      >
                        View identification document
                      </a>
                      <p className="text-xs text-muted">
                        Approving or rejecting emails the parent/guardian. A rejected ID blocks
                        bookings for this child until a new document is uploaded.
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-plum">
                          Review note (optional)
                        </label>
                        <p className="mt-1 text-xs text-muted">
                          Included in the email if you reject. Keep it brief and practical.
                        </p>
                        <textarea
                          className={`${inputClass} mt-2 min-h-20`}
                          value={idReviewNote}
                          onChange={(e) => setIdReviewNote(e.target.value)}
                          placeholder="e.g. Photo too blurry — please upload a clearer scan of your passport or driving licence."
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => reviewIdDocument("approved")}
                          className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60"
                        >
                          Approve ID
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => reviewIdDocument("rejected")}
                          className="rounded-sm border border-plum/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-brand hover:text-brand disabled:opacity-60"
                        >
                          Reject ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-semibold text-brand">No identification uploaded</p>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {householdChildren.map((child) => (
                <li key={child.id}>
                  <Link href={`/admin/members/${child.id}`} className="font-semibold text-brand hover:underline">
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <AdminParQPanel
        completed={parQStatus.completed}
        completedAt={parQStatus.completedAt}
        data={parQStatus.data}
      />

      <form
        className="grid gap-8 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          saveMember(form);
        }}
      >
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Personal & contact</h3>
          <div className="mt-4 space-y-4">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
            <input className={inputClass} type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Emergency contact</h3>
          <div className="mt-4 space-y-4">
            <input className={inputClass} value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} placeholder="Name" />
            <input className={inputClass} value={form.emergencyContactRelationship} onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })} placeholder="Relationship" />
            <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} placeholder="Phone" />
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-display text-2xl text-plum">Health & safety (staff only)</h3>
          <p className="mt-2 text-sm text-muted">
            Sensitive information for instructor safety. Never share outside the studio team.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <textarea className={`${inputClass} min-h-28`} value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} placeholder="Medical notes" />
            <textarea className={`${inputClass} min-h-28`} value={form.injuriesLimitations} onChange={(e) => setForm({ ...form, injuriesLimitations: e.target.value })} placeholder="Injuries / limitations" />
            <textarea className={`${inputClass} min-h-28`} value={form.allergiesSafetyAlerts} onChange={(e) => setForm({ ...form, allergiesSafetyAlerts: e.target.value })} placeholder="Allergies / safety alerts" />
          </div>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Skills & interests</h3>
          <p className="mt-2 text-sm text-muted">
            Set a skill level for each discipline this member practises.
          </p>
          <ul className="mt-4 space-y-3">
            {DISCIPLINE_INTERESTS.map((discipline) => {
              const selected = Boolean(form.disciplineSkills[discipline.id]);
              const level = form.disciplineSkills[discipline.id] ?? "beginner";

              return (
                <li
                  key={discipline.id}
                  className="flex flex-col gap-3 rounded-lg border border-plum/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="flex items-center gap-3 text-sm font-medium text-plum">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setForm((current) => {
                          const next = { ...current.disciplineSkills };
                          if (selected) {
                            delete next[discipline.id];
                          } else {
                            next[discipline.id] = "beginner";
                          }
                          return { ...current, disciplineSkills: next };
                        })
                      }
                      className="h-4 w-4 rounded border-plum/30 text-sage focus:ring-pink"
                    />
                    {discipline.label}
                  </label>
                  <select
                    className={`${inputClass} sm:max-w-[11rem]`}
                    value={level}
                    disabled={!selected}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        disciplineSkills: {
                          ...current.disciplineSkills,
                          [discipline.id]: e.target.value,
                        },
                      }))
                    }
                    aria-label={`${discipline.label} skill level`}
                  >
                    {EXPERIENCE_LEVELS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Membership & account controls</h3>
          <p className="mt-2 text-sm text-muted">
            These settings control how this member appears for billing and studio access. Save
            after making changes.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-plum">Membership plan</label>
              <p className="mt-1 text-xs text-muted">
                Studio Member is the standard free account used for booking. Monthly Membership
                is a legacy paid plan and is no longer offered to new members.
              </p>
              <select
                className={`${inputClass} mt-2`}
                value={form.membershipPlan}
                onChange={(e) => setForm({ ...form, membershipPlan: e.target.value })}
              >
                <option value={MEMBERSHIP_PLAN.account}>Studio Member</option>
                <option value={MEMBERSHIP_PLAN.monthly}>Monthly Membership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-plum">Membership status</label>
              <p className="mt-1 text-xs text-muted">
                Lifecycle of the membership record: Active can book as normal; Paused temporarily
                holds a paid membership; Cancelled/Expired/Inactive mark it as ended or inactive.
                Prefer the Membership actions below for pause/cancel when possible.
              </p>
              <select
                className={`${inputClass} mt-2`}
                value={form.membershipStatus}
                onChange={(e) => setForm({ ...form, membershipStatus: e.target.value })}
              >
                {Object.values(MEMBERSHIP_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {membershipStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-plum">Class credits remaining</label>
              <p className="mt-1 text-xs text-muted">
                How many class-pack credits this member currently has. Increase or decrease to
                adjust their balance manually.
              </p>
              <input
                className={`${inputClass} mt-2`}
                type="number"
                min={0}
                step={0.5}
                value={form.creditsRemaining}
                onChange={(e) =>
                  setForm({ ...form, creditsRemaining: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-plum">Account access</label>
              <p className="mt-1 text-xs text-muted">
                Staff safeguarding flag (Active / Suspended / Banned). Separate from membership
                billing status. Use for conduct or safety notes — it does not currently block
                bookings on its own.
              </p>
              <select
                className={`${inputClass} mt-2`}
                value={form.accountStatus}
                onChange={(e) => setForm({ ...form, accountStatus: e.target.value })}
              >
                {Object.values(ACCOUNT_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {accountStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-plum">
                Internal admin notes
              </label>
              <p className="mt-1 text-xs text-muted">
                Staff-only notes. Members never see this field.
              </p>
              <textarea
                className={`${inputClass} mt-2 min-h-28`}
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                placeholder="Internal admin notes (staff only)"
              />
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
          >
            Save member details
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h3 className="font-display text-2xl text-plum">Membership actions</h3>
        <p className="mt-2 text-sm text-muted">
          Destructive actions are logged with timestamp. Stripe subscriptions sync when configured.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-sm border border-plum/10 p-4">
            <p className="text-sm font-semibold text-plum">Pause membership</p>
            <input className={inputClass} type="date" value={pauseStart} onChange={(e) => setPauseStart(e.target.value)} />
            <input className={inputClass} type="date" value={resumeAt} onChange={(e) => setResumeAt(e.target.value)} placeholder="Resume date (optional)" />
            <button type="button" disabled={loading} onClick={() => runMembershipAction("pause")} className="rounded-sm border border-plum/20 px-4 py-2 text-sm font-semibold text-plum hover:border-pink">
              Pause
            </button>
          </div>
          <div className="space-y-3 rounded-sm border border-plum/10 p-4">
            <p className="text-sm font-semibold text-plum">Resume membership</p>
            <button type="button" disabled={loading} onClick={() => runMembershipAction("resume")} className="rounded-sm border border-plum/20 px-4 py-2 text-sm font-semibold text-plum hover:border-pink">
              Resume now
            </button>
          </div>
          <div className="space-y-3 rounded-sm border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-sm font-semibold text-plum">Cancel at period end</p>
            <input className={inputClass} value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Reason (optional)" />
            <button type="button" disabled={loading} onClick={() => runMembershipAction("cancel")} className="rounded-sm border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
              Cancel membership
            </button>
          </div>
          <div className="space-y-3 rounded-sm border border-red-200 bg-red-50/40 p-4">
            <p className="text-sm font-semibold text-red-900">Terminate immediately</p>
            <p className="text-xs text-red-800">Immediate access removal. No refund unless handled manually in Stripe.</p>
            <button type="button" disabled={loading} onClick={() => runMembershipAction("terminate")} className="rounded-sm bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
              Terminate now
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Membership timeline</h3>
          {timeline.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No membership events yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {timeline.map((event) => (
                <li key={event.id} className="py-3 text-sm">
                  <p className="font-semibold capitalize text-plum">{event.type.replaceAll("_", " ")}</p>
                  <p className="text-muted">{formatUkDateTimeShort(event.effectiveAt)} · {event.createdBy}</p>
                  {event.note && <p className="mt-1 text-xs text-muted">{event.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h3 className="font-display text-2xl text-plum">Recent bookings</h3>
          {recentBookings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No bookings yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="py-3 text-sm">
                  <p className="font-semibold text-plum">{booking.classTitle}</p>
                  <p className="text-muted">{formatUkDateTimeShort(booking.startsAt)}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-brand">{booking.status}{booking.attendance ? ` · ${booking.attendance}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/bookings" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            View all bookings
          </Link>
        </section>
      </div>

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <h3 className="font-display text-2xl text-plum">Audit log</h3>
        {auditLogs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No audit entries for this member.</p>
        ) : (
          <ul className="mt-4 divide-y divide-plum/10">
            {auditLogs.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold text-plum">{entry.action}</p>
                  {entry.details && <p className="text-xs text-muted">{entry.details}</p>}
                </div>
                <time className="text-xs text-muted">{formatUkDateTimeShort(entry.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
