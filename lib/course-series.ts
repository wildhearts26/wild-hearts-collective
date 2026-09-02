import { randomUUID } from "crypto";
import { BOOKING_STATUS, ukLocalToUtc, UK_TIMEZONE } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { isCourseClassSlug } from "@/lib/gift-redeem-scope";

export const COURSE_SERIES_WEEKS = 4;

export function newCourseSeriesId() {
  return randomUUID();
}

/** Add whole weeks to a UK-local wall-clock datetime. */
export function addUkWeeks(startsAt: Date, weeks: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
      .formatToParts(startsAt)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day) + weeks * 7;
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);

  return ukLocalToUtc(year, month, day, hour, minute);
}

export function isCourseSeriesSession(session: {
  courseSeriesId?: string | null;
  class?: { slug?: string | null };
  classSlug?: string | null;
}) {
  const slug = session.class?.slug ?? session.classSlug;
  return Boolean(session.courseSeriesId) && isCourseClassSlug(slug);
}

export async function listCourseSeriesSessions(courseSeriesId: string) {
  return db.session.findMany({
    where: {
      courseSeriesId,
      status: { not: "cancelled" },
    },
    include: { class: true },
    orderBy: { startsAt: "asc" },
  });
}

/** Week 1 of the series, or null if missing. */
export async function getCourseSeriesAnchor(courseSeriesId: string) {
  const sessions = await listCourseSeriesSessions(courseSeriesId);
  return (
    sessions.find((session) => session.courseWeek === 1) ?? sessions[0] ?? null
  );
}

export function courseSeriesHasStarted(
  sessions: { courseWeek: number | null; startsAt: Date }[],
  now = new Date(),
) {
  const week1 =
    sessions.find((session) => session.courseWeek === 1) ?? sessions[0];
  if (!week1) return false;
  return week1.startsAt.getTime() <= now.getTime();
}

/**
 * After the primary booking is confirmed, enrol the same person on the
 * remaining weeks of a 4-week course block.
 */
export async function enrolRemainingCourseWeeks(primaryBookingId: string) {
  const primary = await db.booking.findUnique({
    where: { id: primaryBookingId },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!primary?.session.courseSeriesId) return [] as string[];
  if (!isCourseClassSlug(primary.session.class.slug)) return [] as string[];

  const siblings = await db.session.findMany({
    where: {
      courseSeriesId: primary.session.courseSeriesId,
      id: { not: primary.sessionId },
      status: { not: "cancelled" },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });

  const createdIds: string[] = [];

  for (const session of siblings) {
    const existing = await db.booking.findFirst({
      where: {
        sessionId: session.id,
        email: primary.email,
      },
    });
    // Do not recreate a week that was already booked or cancelled for this person.
    if (existing) continue;

    const booking = await db.booking.create({
      data: {
        sessionId: session.id,
        userId: primary.userId,
        name: primary.name,
        email: primary.email,
        phone: primary.phone,
        notes: primary.notes,
        status: BOOKING_STATUS.confirmed,
        // Fee was paid on the course block (primary booking).
        amountPaid: 0,
        paidWithCredit: false,
        creditsCharged: 0,
      },
    });
    createdIds.push(booking.id);
  }

  return createdIds;
}

/**
 * Backfill future sessions for a member's already-confirmed course bookings.
 * Safe to call on account pages: enrolment is idempotent.
 */
export async function enrolMemberInRemainingCourseWeeks(userId: string) {
  const courseBookings = await db.booking.findMany({
    where: {
      userId,
      status: BOOKING_STATUS.confirmed,
      session: { courseSeriesId: { not: null } },
    },
    select: { id: true },
  });

  await Promise.all(
    courseBookings.map(({ id }) => enrolRemainingCourseWeeks(id)),
  );
}
