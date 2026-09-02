import type { Metadata } from "next";
import Link from "next/link";
import { CancelBookingButton } from "@/app/components/cancel-booking-button";
import { MemberCollapsibleSection } from "@/app/components/member-collapsible-section";
import {
  BOOKING_STATUS,
  formatSessionDateTime,
  WAITLIST_STATUS,
} from "@/lib/booking-config";
import { bookingStatusClassName, bookingStatusLabel } from "@/lib/booking-status-display";
import { enrolMemberInRemainingCourseWeeks, isCourseSeriesSession } from "@/lib/course-series";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/member-auth";
import { contact } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

type BookingWithSession = {
  id: string;
  status: string;
  session: {
    startsAt: Date;
    courseWeek: number | null;
    courseSeriesId: string | null;
    class: { title: string; slug: string };
  };
};

function isUpcomingBooking(booking: BookingWithSession, now: Date) {
  const isActive =
    booking.status === BOOKING_STATUS.pending ||
    booking.status === BOOKING_STATUS.confirmed;
  return isActive && booking.session.startsAt >= now;
}

function BookingList({
  bookings,
  emptyMessage,
}: {
  bookings: BookingWithSession[];
  emptyMessage: string;
}) {
  if (bookings.length === 0) {
    return <p className="mt-4 text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-plum/10 overflow-hidden rounded-sm border border-plum/10 bg-surface">
      {bookings.map((booking) => {
        const isCourse = isCourseSeriesSession(booking.session);
        return (
          <li
            key={booking.id}
            className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div className="min-w-0">
              <p className="font-medium text-plum">{booking.session.class.title}</p>
              <p className="mt-1 text-sm text-muted">
                {formatSessionDateTime(booking.session.startsAt)}
                {isCourse && booking.session.courseWeek
                  ? ` · Week ${booking.session.courseWeek} of 4`
                  : ""}
              </p>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${bookingStatusClassName(booking.status)}`}
            >
              {bookingStatusLabel(booking.status)}
            </span>
            <div className="sm:text-right">
              <CancelBookingButton
                bookingId={booking.id}
                sessionStartsAt={booking.session.startsAt.toISOString()}
                status={booking.status}
                isCourse={isCourse}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AccountBookingsPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  // Repair any older course booking that predates automatic enrolment.
  await enrolMemberInRemainingCourseWeeks(member.id);

  const now = new Date();

  const [bookings, waitlist] = await Promise.all([
    db.booking.findMany({
      where: { userId: member.id },
      include: {
        session: { include: { class: true } },
      },
    }),
    db.waitlistEntry.findMany({
      where: {
        userId: member.id,
        status: { in: [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        session: { include: { class: true } },
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="font-display text-3xl text-plum">My bookings</h2>
      <p className="mt-2 text-sm text-muted">
        Bookings linked to your account appear here.{" "}
        <Link href="/book" className="font-semibold text-brand hover:underline">
          Book another class
        </Link>
      </p>
      <p className="mt-3 text-sm text-muted">
        Cancellations at least 24 hours before class receive class credits matching
        the credit cost of that class (not the cash amount paid). Cancelling a
        4-week course cancels all four weeks. If the course has already
        started, there is no refund. Cash refunds are available but must be requested by
        emailing{" "}
        <a href={`mailto:${contact.email}`} className="font-semibold text-brand hover:underline">
          {contact.email}
        </a>
        .
      </p>

      <section className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">
          Upcoming bookings
        </h3>
        <BookingList
          bookings={upcomingBookings}
          emptyMessage="No upcoming bookings. Book a class to see it here."
        />
      </section>

      <section className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">Waitlist</h3>
        {waitlist.length === 0 ? (
          <p className="mt-4 text-sm text-muted">You&apos;re not on any waitlists.</p>
        ) : (
          <ul className="mt-4 divide-y divide-plum/10 overflow-hidden rounded-sm border border-plum/10 bg-surface">
            {waitlist.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-medium text-plum">{entry.session.class.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatSessionDateTime(entry.session.startsAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${bookingStatusClassName(entry.status)}`}
                >
                  {bookingStatusLabel(entry.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pastBookings.length > 0 ? (
        <MemberCollapsibleSection
          title={`Past bookings (${pastBookings.length})`}
          className="mt-10 rounded-sm border border-plum/10 bg-surface p-6"
          headingClassName="font-display text-2xl text-plum"
          collapsedHint={`${pastBookings.length} past bookings hidden — including attended and cancelled classes. Show to view your full history.`}
        >
          <BookingList bookings={pastBookings} emptyMessage="No past bookings yet." />
        </MemberCollapsibleSection>
      ) : (
        <section className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">
            Past bookings
          </h3>
          <p className="mt-4 text-sm text-muted">No past bookings yet.</p>
        </section>
      )}
    </div>
  );
}
