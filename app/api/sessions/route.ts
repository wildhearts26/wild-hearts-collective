import { ensureSeededDatabase } from "@/lib/seed-database";
import { NextResponse } from "next/server";
import { BOOKING_STATUS, formatMoneyFromPence } from "@/lib/booking-config";
import { formatCredits, formatCreditLabel } from "@/lib/credit-units";
import { expireStalePendingBookings, paymentHoldCutoff } from "@/lib/booking-service";
import { courseSeriesHasStarted } from "@/lib/course-series";
import { db } from "@/lib/db";
import { isCourseClassSlug } from "@/lib/gift-redeem-scope";
import { sessionPublicTitle } from "@/lib/session-display";
import { getMemberSession } from "@/lib/member-auth";
import {
  resolveBookingPaymentAmountPence,
  resolveSessionCreditCost,
} from "@/lib/studio-pricing-service";

/** Always read live Schedule rows — never serve a stale bookable list. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classSlug = searchParams.get("class");

  try {
    await ensureSeededDatabase();
    await expireStalePendingBookings();
    return NextResponse.json(await loadSessions(classSlug), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return NextResponse.json(
      { error: "Unable to load sessions. Check the database connection." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}

function durationMinutes(startsAt: Date, endsAt: Date | null, fallback: number) {
  if (!endsAt) return fallback;
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  return minutes > 0 ? minutes : fallback;
}

function formatDurationLabel(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes === 90) return "1.5 hours";
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes} minutes`;
}

async function loadSessions(classSlug: string | null) {
  const cutoff = paymentHoldCutoff();
  const memberSession = await getMemberSession();
  const now = new Date();

  const sessions = await db.session.findMany({
    where: {
      startsAt: { gte: now },
      status: { not: "cancelled" },
      ...(classSlug ? { class: { slug: classSlug } } : {}),
    },
    include: {
      class: true,
      tutor: { select: { id: true, name: true } },
      bookings: {
        where: {
          OR: [
            { status: BOOKING_STATUS.confirmed },
            {
              status: BOOKING_STATUS.pending,
              createdAt: { gte: cutoff },
            },
          ],
        },
        select: { id: true, email: true, userId: true },
      },
      waitlist: {
        where: { status: { in: ["waiting", "notified"] } },
        select: { id: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // Load all course sessions so the schedule can show every date in a block.
  const seriesIds = [
    ...new Set(
      sessions
        .map((session) => session.courseSeriesId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const seriesSessions =
    seriesIds.length > 0
      ? await db.session.findMany({
          where: {
            courseSeriesId: { in: seriesIds },
            status: { not: "cancelled" },
          },
          select: {
            id: true,
            courseSeriesId: true,
            courseWeek: true,
            startsAt: true,
          },
          orderBy: { startsAt: "asc" },
        })
      : [];

  const seriesById = new Map<string, typeof seriesSessions>();
  for (const row of seriesSessions) {
    if (!row.courseSeriesId) continue;
    const list = seriesById.get(row.courseSeriesId) ?? [];
    list.push(row);
    seriesById.set(row.courseSeriesId, list);
  }

  const priced = await Promise.all(
    sessions.map(async (session) => {
      const pricePence = await resolveBookingPaymentAmountPence({
        classSlug: session.class.slug,
        sessionPricePence: session.pricePence,
        classPricePence: session.class.pricePence,
      });
      return { session, pricePence };
    }),
  );

  return priced.map(({ session, pricePence }) => {
    const heldCount = session.bookings.length;
    const spotsLeft = session.capacity - heldCount;
    const alreadyBooked = Boolean(
      memberSession?.userId &&
        session.bookings.some((booking) => booking.userId === memberSession.userId),
    );
    const minutes = durationMinutes(
      session.startsAt,
      session.endsAt,
      session.class.duration,
    );
    const creditCost = resolveSessionCreditCost({
      sessionCreditCost: session.creditCost,
      classCreditCost: session.class.creditCost,
    });
    const description =
      session.publicDescription?.trim() ||
      session.class.description?.trim() ||
      null;

    const series = session.courseSeriesId
      ? seriesById.get(session.courseSeriesId) ?? []
      : [];
    const courseDates = series.map((row) => row.startsAt.toISOString());
    const isFourWeekCourse = isCourseClassSlug(session.class.slug);
    const courseHasStarted = isFourWeekCourse && courseSeriesHasStarted(series, now);
    const courseWeek = session.courseWeek ?? 1;
    const bookingDisabledReason = courseHasStarted
      ? "This 4-week course has already started. Please look out for a future course."
      : isFourWeekCourse && courseWeek !== 1
        ? "This session is included when you book the 4-week course from its first date."
        : null;

    return {
      id: session.id,
      classId: session.classId,
      classSlug: session.class.slug,
      classTitle: sessionPublicTitle(session),
      classTypeTitle: session.class.title,
      displayTitle: session.displayTitle?.trim() || null,
      tutor: session.tutor
        ? { id: session.tutor.id, name: session.tutor.name }
        : null,
      description,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt?.toISOString() ?? null,
      durationMinutes: minutes,
      durationLabel: formatDurationLabel(minutes),
      capacity: session.capacity,
      spotsLeft,
      isFull: spotsLeft <= 0,
      waitlistCount: session.waitlist.length,
      alreadyBooked,
      pricePence,
      priceLabel:
        isFourWeekCourse && courseWeek !== 1
          ? "Included in the 4-week course"
          : formatMoneyFromPence(pricePence),
      creditCost,
      creditCostLabel: formatCreditLabel(creditCost),
      creditCostDisplay: formatCredits(creditCost),
      courseSeriesId: session.courseSeriesId,
      courseWeek,
      courseDates: courseDates.length > 1 ? courseDates : undefined,
      isFourWeekCourse,
      bookingDisabledReason,
    };
  });
}
