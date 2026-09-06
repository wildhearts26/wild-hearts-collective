import type { Metadata } from "next";
import Link from "next/link";
import { AdminBookingActions } from "@/app/components/admin-booking-actions";
import { AdminCollapsibleSection } from "@/app/components/admin-collapsible-section";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminWaitlistActions } from "@/app/components/admin-waitlist-actions";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  BOOKING_STATUS,
  formatSessionDateTime,
  formatUkDateTimeShort,
} from "@/lib/booking-config";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Bookings",
  robots: { index: false, follow: false },
};

type AdminBookingRow = {
  id: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  amountPaid: number | null;
  attendance: string | null;
  createdAt: Date;
  session: {
    startsAt: Date;
    class: { title: string };
  };
};

type WaitlistRow = {
  id: string;
  status: string;
  name: string;
  email: string;
  createdAt: Date;
  session: {
    startsAt: Date;
    class: { title: string };
  };
};

function isUpcomingBooking(booking: AdminBookingRow, now: Date) {
  const isActive =
    booking.status === BOOKING_STATUS.pending ||
    booking.status === BOOKING_STATUS.confirmed;
  return isActive && booking.session.startsAt >= now;
}

function formatPaid(amountPaid: number | null) {
  return amountPaid != null ? `£${(amountPaid / 100).toFixed(2)}` : "—";
}

function AdminBookingsTable({ bookings }: { bookings: AdminBookingRow[] }) {
  if (bookings.length === 0) {
    return <p className="px-6 py-10 text-sm text-muted">No bookings in this section.</p>;
  }

  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className="rounded-lg border border-plum/10 bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-plum">{booking.session.class.title}</p>
                <p className="mt-1 text-sm leading-snug text-muted">
                  {formatSessionDateTime(booking.session.startsAt)}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted">
                {formatPaid(booking.amountPaid)}
              </p>
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Name
                </dt>
                <dd className="min-w-0 text-foreground">{booking.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Email
                </dt>
                <dd className="min-w-0">
                  <a
                    href={`mailto:${booking.email}`}
                    className="break-all text-plum hover:text-pink hover:underline"
                  >
                    {booking.email}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Phone
                </dt>
                <dd className="min-w-0 text-muted">{booking.phone ?? "—"}</dd>
              </div>
              {booking.notes ? (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                    Notes
                  </dt>
                  <dd className="min-w-0 text-muted">{booking.notes}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Booked
                </dt>
                <dd className="min-w-0 text-muted">
                  {formatUkDateTimeShort(booking.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-plum/10 pt-3">
              <AdminBookingActions
                bookingId={booking.id}
                currentStatus={booking.status}
                currentAttendance={booking.attendance}
                sessionStartsAt={booking.session.startsAt.toISOString()}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden min-w-0 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
            <tr>
              <th className="w-[9%] px-2 py-3 font-semibold">Booked</th>
              <th className="w-[11%] px-2 py-3 font-semibold">Class</th>
              <th className="w-[12%] px-2 py-3 font-semibold">Session</th>
              <th className="w-[10%] px-2 py-3 font-semibold">Name</th>
              <th className="w-[14%] px-2 py-3 font-semibold">Email</th>
              <th className="w-[9%] px-2 py-3 font-semibold">Phone</th>
              <th className="w-[10%] px-2 py-3 font-semibold">Notes</th>
              <th className="w-[6%] px-2 py-3 font-semibold">Paid</th>
              <th className="w-[19%] px-2 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-plum/8 align-top last:border-b-0"
              >
                <td className="px-2 py-3 text-muted">
                  {formatUkDateTimeShort(booking.createdAt)}
                </td>
                <td className="px-2 py-3">
                  <p
                    className="truncate font-medium text-plum"
                    title={booking.session.class.title}
                  >
                    {booking.session.class.title}
                  </p>
                </td>
                <td className="px-2 py-3 text-muted">
                  <p className="leading-snug break-words">
                    {formatSessionDateTime(booking.session.startsAt)}
                  </p>
                </td>
                <td className="px-2 py-3">
                  <p className="truncate text-foreground" title={booking.name}>
                    {booking.name}
                  </p>
                </td>
                <td className="px-2 py-3">
                  <a
                    href={`mailto:${booking.email}`}
                    className="block truncate text-plum hover:text-pink hover:underline"
                    title={booking.email}
                  >
                    {booking.email}
                  </a>
                </td>
                <td className="px-2 py-3">
                  <p className="truncate text-muted" title={booking.phone ?? undefined}>
                    {booking.phone ?? "—"}
                  </p>
                </td>
                <td className="px-2 py-3">
                  <p className="line-clamp-2 text-muted" title={booking.notes ?? undefined}>
                    {booking.notes ?? "—"}
                  </p>
                </td>
                <td className="px-2 py-3 text-muted">{formatPaid(booking.amountPaid)}</td>
                <td className="px-2 py-3">
                  <AdminBookingActions
                    bookingId={booking.id}
                    currentStatus={booking.status}
                    currentAttendance={booking.attendance}
                    sessionStartsAt={booking.session.startsAt.toISOString()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminWaitlistTable({ entries }: { entries: WaitlistRow[] }) {
  if (entries.length === 0) {
    return <p className="px-6 py-10 text-sm text-muted">No one is on the waitlist.</p>;
  }

  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-plum/10 bg-surface p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-plum">{entry.session.class.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted">
                {formatSessionDateTime(entry.session.startsAt)}
              </p>
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Name
                </dt>
                <dd className="min-w-0 text-foreground">{entry.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Email
                </dt>
                <dd className="min-w-0">
                  <a
                    href={`mailto:${entry.email}`}
                    className="break-all text-plum hover:text-pink hover:underline"
                  >
                    {entry.email}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand">
                  Joined
                </dt>
                <dd className="min-w-0 text-muted">
                  {formatUkDateTimeShort(entry.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-plum/10 pt-3">
              <AdminWaitlistActions entryId={entry.id} currentStatus={entry.status} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden min-w-0 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
            <tr>
              <th className="w-[12%] px-2 py-3 font-semibold">Joined</th>
              <th className="w-[16%] px-2 py-3 font-semibold">Class</th>
              <th className="w-[18%] px-2 py-3 font-semibold">Session</th>
              <th className="w-[14%] px-2 py-3 font-semibold">Name</th>
              <th className="w-[22%] px-2 py-3 font-semibold">Email</th>
              <th className="w-[18%] px-2 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-plum/8 align-top last:border-b-0"
              >
                <td className="px-2 py-3 text-muted">
                  {formatUkDateTimeShort(entry.createdAt)}
                </td>
                <td className="px-2 py-3">
                  <p
                    className="truncate font-medium text-plum"
                    title={entry.session.class.title}
                  >
                    {entry.session.class.title}
                  </p>
                </td>
                <td className="px-2 py-3 text-muted">
                  <p className="leading-snug break-words">
                    {formatSessionDateTime(entry.session.startsAt)}
                  </p>
                </td>
                <td className="px-2 py-3">
                  <p className="truncate text-foreground" title={entry.name}>
                    {entry.name}
                  </p>
                </td>
                <td className="px-2 py-3">
                  <a
                    href={`mailto:${entry.email}`}
                    className="block truncate text-plum hover:text-pink hover:underline"
                    title={entry.email}
                  >
                    {entry.email}
                  </a>
                </td>
                <td className="px-2 py-3">
                  <AdminWaitlistActions entryId={entry.id} currentStatus={entry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{label}</p>
      <p className="mt-2 font-display text-3xl text-plum">{value}</p>
    </div>
  );
}

export default async function AdminBookingsPage() {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.bookings);

  const now = new Date();

  const [bookings, waitlist] = await Promise.all([
    db.booking.findMany({
      include: {
        session: {
          include: { class: true },
        },
      },
    }),
    db.waitlistEntry.findMany({
      where: { status: { in: ["waiting", "notified"] } },
      orderBy: { createdAt: "asc" },
      include: {
        session: {
          include: { class: true },
        },
      },
    }),
  ]);

  const upcomingBookings = bookings
    .filter((booking) => isUpcomingBooking(booking, now))
    .sort(
      (a, b) => a.session.startsAt.getTime() - b.session.startsAt.getTime(),
    );

  const pastBookings = bookings
    .filter((booking) => !isUpcomingBooking(booking, now))
    .sort(
      (a, b) => b.session.startsAt.getTime() - a.session.startsAt.getTime(),
    );

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Bookings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Upcoming sessions and the waitlist are shown first. Past and cancelled bookings
            stay available in a collapsible archive below. Use the status dropdown to cancel,
            or <strong>Delete</strong> to permanently remove test entries (no email sent).
          </p>
          <AdminNav active="bookings" permissions={session.permissions} />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Upcoming bookings" value={upcomingBookings.length} />
        <SummaryCard label="Waitlist" value={waitlist.length} />
        <SummaryCard label="Past & cancelled" value={pastBookings.length} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-plum">Upcoming bookings</h2>
        <p className="mt-2 text-sm text-muted">
          Confirmed and pending classes with a future session date, soonest first.
        </p>
        <div className="mt-4">
          <AdminBookingsTable bookings={upcomingBookings} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-plum">Waitlist</h2>
        <p className="mt-2 text-sm text-muted">
          People waiting for full sessions. Cancelling a confirmed booking automatically emails
          the next person on the waitlist.
        </p>
        <div className="mt-4">
          <AdminWaitlistTable entries={waitlist} />
        </div>
      </section>

      <AdminCollapsibleSection
        title={`Past & cancelled bookings (${pastBookings.length})`}
        defaultOpen={false}
        empty={pastBookings.length === 0}
        summary={
          pastBookings.length > 0
            ? `${pastBookings.length} past or cancelled bookings hidden. Show to search history, attendance, and test entries.`
            : "No past or cancelled bookings yet."
        }
      >
        <div className="mt-4">
          <AdminBookingsTable bookings={pastBookings} />
        </div>
      </AdminCollapsibleSection>

      <p className="mt-8 text-sm text-muted">
        Public booking page:{" "}
        <Link href="/book" className="font-medium text-plum hover:text-pink hover:underline">
          /book
        </Link>
      </p>
    </div>
  );
}
