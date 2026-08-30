"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MemberCollapsibleSection } from "@/app/components/member-collapsible-section";
import { MemberProfilePhotoField } from "@/app/components/member-profile-photo-field";
import { MemberBillingSection } from "@/app/components/member-billing-section";
import {
  DISCIPLINE_INTERESTS,
  EXPERIENCE_LEVELS,
  NOTIFICATION_KEYS,
  type NotificationPreferences,
} from "@/lib/profile-config";
import {
  membershipPlanLabel,
  membershipStatusLabel,
  membershipStatusTone,
} from "@/lib/membership-config";
import {
  formatUkDateLong,
  formatUkDateTimeShort,
} from "@/lib/booking-config";
import type { MemberProfile } from "@/lib/member-profile-service";

type ActivityBooking = {
  id: string;
  status: string;
  attendance: string | null;
  classTitle: string;
  startsAt: string;
};

type TimelineEvent = {
  id: string;
  type: string;
  note: string | null;
  effectiveAt: string;
  endsAt: string | null;
};

type MemberProfileDashboardProps = {
  initialProfile: MemberProfile;
  isGoogleAccount: boolean;
  upcomingBookings: ActivityBooking[];
  pastBookings: ActivityBooking[];
  timeline: TimelineEvent[];
};

const sections = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health & safety" },
  { id: "membership", label: "Membership" },
  { id: "credits", label: "Credits" },
  { id: "activity", label: "Activity" },
  { id: "skills", label: "Skills" },
  { id: "billing", label: "Billing" },
  { id: "preferences", label: "Preferences" },
  { id: "security", label: "Security" },
];

function ProfileCard({
  id,
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm">
      <div className="mb-6 border-b border-plum/10 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-plum">{title}</h2>
            {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              className="text-sm font-semibold uppercase tracking-wider text-brand hover:underline"
            >
              {open ? "Hide" : "Show"}
            </button>
          )}
        </div>
      </div>
      {(!collapsible || open) && children}
      {collapsible && !open && (
        <p className="text-sm text-muted">Hidden to keep your profile tidy. Tap show to expand.</p>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-plum">{label}</label>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1";

export function MemberProfileDashboard({
  initialProfile,
  isGoogleAccount,
  upcomingBookings,
  pastBookings,
}: MemberProfileDashboardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone ?? "",
    image: profile.image ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    emergencyContactName: profile.emergencyContact.name ?? "",
    emergencyContactRelationship: profile.emergencyContact.relationship ?? "",
    emergencyContactPhone: profile.emergencyContact.phone ?? "",
    medicalNotes: profile.healthSafety.medicalNotes ?? "",
    injuriesLimitations: profile.healthSafety.injuriesLimitations ?? "",
    allergiesSafetyAlerts: profile.healthSafety.allergiesSafetyAlerts ?? "",
    safetyConsent: Boolean(profile.healthSafety.safetyConsentAt),
    disciplineSkills: { ...profile.disciplineSkills },
    notificationPreferences: profile.notificationPreferences,
    currentPassword: "",
    newPassword: "",
  });

  const initials = useMemo(
    () =>
      profile.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [profile.name],
  );

  async function saveProfile(payload: Record<string, unknown>) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/members/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to save profile.");
        return;
      }
      setProfile(data.profile);
      setMessage("Profile updated.");
      router.refresh();
    } catch {
      setError("Unable to save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Member profile</p>
          <h1 className="font-display text-4xl text-plum">Your studio profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Manage your details, membership, and safety information in one secure place.
          </p>
        </div>
        <div className="rounded-2xl border border-plum/10 bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Profile completion
          </p>
          <p className="mt-1 font-display text-3xl text-plum">{profile.profileCompletion.percent}%</p>
          {profile.profileCompletion.missingSteps.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Next: {profile.profileCompletion.missingSteps[0]}
            </p>
          )}
        </div>
      </div>

      {profile.profileCompletion.percent < 100 && (
        <div className="mb-8 rounded-2xl border border-pink/30 bg-pink-soft px-5 py-4">
          <p className="text-sm font-semibold text-plum">Complete your profile</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.profileCompletion.missingSteps.map((step) => (
              <li
                key={step}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand"
              >
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(message || error) && (
        <div
          className={`mb-8 rounded-sm px-4 py-3 text-sm ${
            error ? "border border-brand/20 bg-pink-soft text-brand" : "border border-sage/30 bg-sage-light text-plum"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="sticky top-28 space-y-1 rounded-2xl border border-plum/10 bg-surface p-3">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-plum transition hover:bg-pink-soft hover:text-brand"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          <ProfileCard id="overview" title="Profile overview" collapsible defaultOpen={false}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <MemberProfilePhotoField
                image={profile.image}
                initials={initials}
                isGoogleAccount={isGoogleAccount}
                loading={loading}
                setLoading={setLoading}
                onUploaded={(image) => {
                  setProfile((current) => ({ ...current, image }));
                  setForm((current) => ({ ...current, image: image ?? "" }));
                  router.refresh();
                }}
                onError={setError}
                onMessage={setMessage}
              />

              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="text-xl font-semibold text-plum">{profile.name}</p>
                  <p className="mt-1 text-sm text-muted">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${membershipStatusTone(profile.membership.status)}`}>
                    {membershipStatusLabel(profile.membership.status)}
                  </span>
                  <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-plum">
                    {membershipPlanLabel(profile.membership.plan)}
                  </span>
                  {profile.isChild ? (
                    <span className="rounded-full bg-pink-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                      Child member
                    </span>
                  ) : null}
                </div>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Member since</dt>
                    <dd className="font-medium text-plum">
                      {profile.membership.startedAt
                        ? formatUkDateLong(profile.membership.startedAt)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Next renewal</dt>
                    <dd className="font-medium text-plum">
                      {profile.membership.renewsAt
                        ? formatUkDateLong(profile.membership.renewsAt)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </ProfileCard>

          <ProfileCard
            id="personal"
            title="Personal information"
            description="We only collect essentials now. You can add more details whenever you're ready."
            collapsible
            defaultOpen={false}
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile({
                  name: form.name,
                  phone: form.phone,
                  dateOfBirth: form.dateOfBirth || null,
                  emergencyContactName: form.emergencyContactName,
                  emergencyContactRelationship: form.emergencyContactRelationship,
                  emergencyContactPhone: form.emergencyContactPhone,
                });
              }}
            >
              <Field label="Full name">
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field
                label="Email"
                hint={
                  profile.isChild
                    ? "This child uses the household email. Sign in still happens on the parent account."
                    : "Child members you add will share this email."
                }
              >
                <input className={`${inputClass} bg-cream/60 text-muted`} value={profile.email} disabled />
              </Field>
              <Field label="Phone number">
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Date of birth" hint="Private. Used for safety and age-appropriate class guidance only.">
                <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Emergency contact name">
                  <input className={inputClass} value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
                </Field>
                <Field label="Relationship">
                  <input className={inputClass} value={form.emergencyContactRelationship} onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })} />
                </Field>
                <Field label="Emergency phone">
                  <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
                </Field>
              </div>
              <button type="submit" disabled={loading} className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60">
                Save personal details
              </button>
            </form>
          </ProfileCard>

          <ProfileCard
            id="health"
            title="Health & safety"
            description="Optional and secure. Shared with studio staff and instructors only to help keep you safe in class."
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile({
                  medicalNotes: form.medicalNotes,
                  injuriesLimitations: form.injuriesLimitations,
                  allergiesSafetyAlerts: form.allergiesSafetyAlerts,
                  safetyConsent: form.safetyConsent,
                });
              }}
            >
              <Field label="Medical notes" hint="Optional free-text for conditions we should be aware of.">
                <textarea className={`${inputClass} min-h-24`} value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} />
              </Field>
              <Field label="Injuries or physical limitations">
                <textarea className={`${inputClass} min-h-24`} value={form.injuriesLimitations} onChange={(e) => setForm({ ...form, injuriesLimitations: e.target.value })} />
              </Field>
              <Field label="Allergies or safety alerts">
                <textarea className={`${inputClass} min-h-24`} value={form.allergiesSafetyAlerts} onChange={(e) => setForm({ ...form, allergiesSafetyAlerts: e.target.value })} />
              </Field>
              <label className="flex items-start gap-3 rounded-sm border border-plum/10 bg-pink-soft/40 px-4 py-3 text-sm text-plum">
                <input
                  type="checkbox"
                  checked={form.safetyConsent}
                  onChange={(event) => setForm({ ...form, safetyConsent: event.target.checked })}
                  className="mt-1"
                />
                <span>
                  I understand that participation involves physical activity and I will inform instructors of any changes to my health.
                </span>
              </label>
              <button type="submit" disabled={loading} className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60">
                Save health information
              </button>
            </form>
          </ProfileCard>

          <ProfileCard id="credits" title="Class credits">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  Available balance
                </p>
                <p className="mt-2 font-display text-5xl text-plum">
                  {profile.membership.creditsRemaining}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Use credits when booking to skip paying the class fee.
                </p>
              </div>
              <Link
                href="/account/credits"
                className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
              >
                Manage credits
              </Link>
            </div>
          </ProfileCard>

          <ProfileCard id="activity" title="Membership & class activity">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold text-plum">Plan details</h3>
                <p className="mt-2 text-sm text-muted">
                  {membershipPlanLabel(profile.membership.plan)} · Credits remaining: {profile.membership.creditsRemaining}
                </p>
                <Link href="/account/credits" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
                  View credit activity & buy packs
                </Link>
                <Link href="/account/bookings" className="mt-2 block text-sm font-semibold text-brand hover:underline">
                  View all bookings
                </Link>
              </div>
              <div>
                <h3 className="font-semibold text-plum">Upcoming bookings</h3>
                <ul className="mt-3 space-y-2">
                  {upcomingBookings.length === 0 ? (
                    <li className="text-sm text-muted">No upcoming classes.</li>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <li key={booking.id} className="rounded-lg border border-plum/10 px-3 py-2 text-sm">
                        <p className="font-medium text-plum">{booking.classTitle}</p>
                        <p className="text-muted">{formatUkDateTimeShort(booking.startsAt)}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <MemberCollapsibleSection
              title="Past attendance"
              className="mt-6 rounded-lg border border-plum/10 bg-white/60 p-4"
              headingClassName="font-semibold text-plum"
              collapsedHint="Past classes are hidden. Show to view your attendance history."
            >
              <ul className="mt-3 divide-y divide-plum/10">
                {pastBookings.slice(0, 6).map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-plum">{booking.classTitle}</p>
                      <p className="text-muted">{formatUkDateTimeShort(booking.startsAt)}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                      {booking.attendance ?? booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            </MemberCollapsibleSection>
          </ProfileCard>

          <ProfileCard
            id="skills"
            title="Skills & interests"
            description="Select each discipline you practise and set your level for that one — for example advanced pole and beginner hoop."
            collapsible
            defaultOpen={false}
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile({
                  disciplineSkills: form.disciplineSkills,
                });
              }}
            >
              <ul className="space-y-3">
                {DISCIPLINE_INTERESTS.map((discipline) => {
                  const selected = Boolean(form.disciplineSkills[discipline.id]);
                  const level = form.disciplineSkills[discipline.id] ?? "beginner";

                  return (
                    <li
                      key={discipline.id}
                      className="flex flex-col gap-3 rounded-lg border border-plum/10 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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
              <button type="submit" disabled={loading} className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60">
                Save skills & interests
              </button>
            </form>
          </ProfileCard>

          <ProfileCard
            id="billing"
            title="Payments & billing"
            description="Pay, manage cards, and download invoices securely on-site with Stripe. We never store raw payment data."
            collapsible
            defaultOpen={false}
          >
            <MemberBillingSection />
          </ProfileCard>

          <ProfileCard id="preferences" title="Preferences & notifications" collapsible defaultOpen={false}>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile({ notificationPreferences: form.notificationPreferences });
              }}
            >
              {NOTIFICATION_KEYS.map((pref) => (
                <label key={pref.id} className="flex items-center justify-between rounded-lg border border-plum/10 px-4 py-3 text-sm">
                  <span className="text-plum">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={form.notificationPreferences[pref.id as keyof NotificationPreferences]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notificationPreferences: {
                          ...current.notificationPreferences,
                          [pref.id]: event.target.checked,
                        },
                      }))
                    }
                  />
                </label>
              ))}
              <button type="submit" disabled={loading} className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60">
                Save preferences
              </button>
            </form>
          </ProfileCard>

          <ProfileCard id="security" title="Account & security" collapsible defaultOpen={false}>
            {profile.isChild ? (
              <p className="text-sm text-muted">
                This child member shares the household login. Switch to the parent account to
                change the password.
              </p>
            ) : isGoogleAccount ? (
              <p className="text-sm text-muted">
                This account uses Google sign-in. Password changes are not available here.
              </p>
            ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile({
                  currentPassword: form.currentPassword,
                  newPassword: form.newPassword,
                });
              }}
            >
              <Field label="Current password">
                <input type="password" className={inputClass} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
              </Field>
              <Field label="New password">
                <input type="password" className={inputClass} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
              </Field>
              <button type="submit" disabled={loading} className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60">
                Update password
              </button>
            </form>
            )}
            <p className="mt-6 text-sm text-muted">
              Two-factor authentication and account deletion requests can be arranged by contacting the studio. We handle GDPR requests manually while the community features are expanded.
            </p>
          </ProfileCard>
        </div>
      </div>
    </div>
  );
}
