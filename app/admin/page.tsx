import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCapacityBadge } from "@/app/components/admin-capacity-badge";
import { AdminCollapsibleSection } from "@/app/components/admin-collapsible-section";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-service";
import { formatAdminAuditSummary } from "@/lib/admin-audit-format";
import { formatSessionDateTime, formatUkDateTimeShort } from "@/lib/booking-config";
import { formatCredits } from "@/lib/credit-units";
import {
  membershipStatusLabel,
} from "@/lib/membership-config";
import { sessionPublicTitle } from "@/lib/session-display";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};


export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const session = await requireAdminPage();
  const params = searchParams ? await searchParams : {};

  if (!session.permissions.includes(ADMIN_PERMISSIONS.dashboard)) {
    if (session.permissions.includes(ADMIN_PERMISSIONS.checkin)) {
      redirect("/admin/schedule");
    }
    if (session.permissions.includes(ADMIN_PERMISSIONS.bookings)) {
      redirect("/admin/bookings");
    }
    if (session.permissions.includes(ADMIN_PERMISSIONS.staff)) {
      redirect("/admin/staff");
    }
    redirect("/admin/login");
  }

  const stats = await getAdminDashboardStats();
  const denied = params.denied === "1";

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Studio operations at a glance — membership health, today&apos;s classes, and
            safety alerts. Signed in as {session.name}.
          </p>
          <AdminNav active="dashboard" permissions={session.permissions} />
        </div>
        <AdminLogoutButton />
      </div>

      {denied && (
        <p className="mt-6 rounded-sm border border-brand/30 bg-pink-soft px-4 py-3 text-sm text-brand" role="alert">
          You do not have access to that section.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active members" value={stats.statusCounts.active} />
        <StatCard label="Paused" value={stats.statusCounts.paused} />
        <StatCard label="Cancelled" value={stats.statusCounts.cancelled} />
        <StatCard label="Total members" value={stats.statusCounts.total} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="New today" value={stats.signUps.today} compact />
        <StatCard label="New (7 days)" value={stats.signUps.week} compact />
        <StatCard label="New (30 days)" value={stats.signUps.month} compact />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-plum">Today&apos;s classes</h2>
            <Link href="/admin/schedule" className="text-sm font-semibold text-brand hover:underline">
              Full schedule
            </Link>
          </div>
          {stats.todaysSessions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No classes scheduled today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.todaysSessions.map((session) => {
                const confirmed = session.bookings.length;
                return (
                  <li key={session.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/admin/sessions/${session.id}`}
                          className="font-semibold text-plum hover:text-brand hover:underline"
                        >
                          {sessionPublicTitle(session)}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {formatSessionDateTime(session.startsAt)}
                        </p>
                        {session.displayTitle?.trim() ? (
                          <p className="mt-1 text-xs text-muted">
                            Class type: {session.class.title}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted">
                          Tutor: {session.tutor?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <AdminCapacityBadge
                        confirmed={confirmed}
                        capacity={session.capacity}
                        status={session.status ?? "scheduled"}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Safety alerts today</h2>
          <p className="mt-2 text-sm text-muted">
            Members with medical or safety notes booked into today&apos;s sessions.
          </p>
          {stats.safetyAlerts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No safety alerts for today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.safetyAlerts.map((booking) => (
                <li key={booking.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/members/${booking.user?.id}`}
                        className="font-semibold text-plum hover:text-brand hover:underline"
                      >
                        {booking.user?.name ?? booking.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {booking.session.class.title} ·{" "}
                        {formatSessionDateTime(booking.session.startsAt)}
                      </p>
                      <p className="mt-2 text-xs text-brand">
                        {[
                          booking.user?.medicalNotes && "Medical notes",
                          booking.user?.injuriesLimitations && "Injuries/limitations",
                          booking.user?.allergiesSafetyAlerts && "Allergies/alerts",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Class credit balances</h2>
          <p className="mt-2 text-sm text-muted">Members with credits on their account</p>
          {stats.membersWithCredits.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No members currently have class credits.</p>
          ) : (
            <ul className="mt-4 divide-y divide-plum/10">
              {stats.membersWithCredits.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="font-semibold text-plum hover:text-brand hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                  <p className="text-sm font-medium text-plum">
                    {formatCredits(member.creditsRemaining)} credits
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-2xl text-plum">Operational notes</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-plum/10 pb-3">
              <dt className="text-muted">Pending booking payments</dt>
              <dd className="font-display text-xl text-plum">{stats.pendingBookings}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-plum/10 pb-3">
              <dt className="text-muted">Expired memberships</dt>
              <dd className="font-display text-xl text-plum">{stats.statusCounts.expired}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Inactive accounts</dt>
              <dd className="font-display text-xl text-plum">{stats.statusCounts.inactive}</dd>
            </div>
          </dl>
        </section>
      </div>

      <AdminCollapsibleSection
        title="Recent admin activity"
        defaultOpen={false}
        empty={stats.recentAudit.length === 0}
        summary="Hidden by default. Show to see who changed credits, members, bookings, and sessions."
      >
        {stats.recentAudit.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No admin actions logged yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-plum/10">
            {stats.recentAudit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div className="min-w-0 max-w-3xl">
                  <p className="font-semibold text-plum">
                    {formatAdminAuditSummary(entry)}
                  </p>
                  {entry.targetUser && (
                    <Link
                      href={`/admin/members/${entry.targetUser.id}`}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Open {entry.targetUser.name}&apos;s profile
                    </Link>
                  )}
                </div>
                <time className="shrink-0 text-xs text-muted">{formatUkDateTimeShort(entry.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </AdminCollapsibleSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  compact,
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{label}</p>
      <p className={`mt-2 font-display text-plum ${compact ? "text-2xl" : "text-3xl"}`}>
        {value}
      </p>
    </div>
  );
}
