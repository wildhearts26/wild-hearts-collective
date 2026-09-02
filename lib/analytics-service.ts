import { ATTENDANCE_STATUS } from "@/lib/booking-advanced-config";
import { BOOKING_STATUS, formatUkDateTimeShort } from "@/lib/booking-config";
import { formatCredits } from "@/lib/credit-units";
import { db } from "@/lib/db";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getAdminAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    sessions,
    bookings,
    users,
    classPackPurchases,
    engagementSent,
  ] = await Promise.all([
    db.session.findMany({
      where: { startsAt: { gte: thirtyDaysAgo } },
      include: {
        class: { select: { slug: true, title: true } },
        bookings: {
          where: { status: BOOKING_STATUS.confirmed },
          select: { id: true, attendance: true },
        },
      },
    }),
    db.booking.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        userId: true,
        session: {
          select: {
            startsAt: true,
            class: { select: { slug: true, title: true } },
          },
        },
      },
    }),
    db.user.findMany({
      select: {
        id: true,
        createdAt: true,
        lastClassAttendedAt: true,
        totalClassesAttended: true,
      },
    }),
    db.classPackPurchase.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "pending" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        creditsGranted: true,
        creditsRemaining: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
        pack: { select: { name: true } },
      },
    }),
    db.engagementLog.count({
      where: { status: "sent", createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  let totalCapacity = 0;
  let totalConfirmed = 0;
  const classPopularity: Record<string, { title: string; bookings: number; capacity: number }> = {};
  const hourBuckets: Record<string, number> = {};

  for (const session of sessions) {
    totalCapacity += session.capacity;
    const confirmed = session.bookings.length;
    totalConfirmed += confirmed;

    const slug = session.class.slug;
    if (!classPopularity[slug]) {
      classPopularity[slug] = {
        title: session.class.title,
        bookings: 0,
        capacity: 0,
      };
    }
    classPopularity[slug].bookings += confirmed;
    classPopularity[slug].capacity += session.capacity;

    const hour = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
    }).format(session.startsAt);
    hourBuckets[hour] = (hourBuckets[hour] ?? 0) + confirmed;
  }

  const occupancyPercent =
    totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 1000) / 10 : 0;

  const popularClasses = Object.entries(classPopularity)
    .map(([slug, data]) => ({
      slug,
      title: data.title,
      bookings: data.bookings,
      capacity: data.capacity,
      occupancyPercent:
        data.capacity > 0 ? Math.round((data.bookings / data.capacity) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings);

  const peakHours = Object.entries(hourBuckets)
    .map(([hour, count]) => ({ hour, bookings: count }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);

  const monthlyGrowth: Record<string, number> = {};
  for (const booking of bookings) {
    if (booking.status !== BOOKING_STATUS.confirmed) continue;
    const key = monthKey(booking.createdAt);
    monthlyGrowth[key] = (monthlyGrowth[key] ?? 0) + 1;
  }

  const monthlyBookingTrend = Object.entries(monthlyGrowth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, bookings: count }));

  const activeStudents = users.filter(
    (user) => user.lastClassAttendedAt && user.lastClassAttendedAt >= thirtyDaysAgo,
  ).length;

  const returningStudents = users.filter((user) => user.totalClassesAttended >= 2).length;
  const retentionRate =
    users.length > 0 ? Math.round((returningStudents / users.length) * 1000) / 10 : 0;

  const noShows = await db.booking.count({
    where: {
      attendance: ATTENDANCE_STATUS.noShow,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  return {
    summary: {
      occupancyPercent,
      totalSessions: sessions.length,
      totalBookings: bookings.filter((b) => b.status === BOOKING_STATUS.confirmed).length,
      activeStudents,
      retentionRate,
      classPacksSold: classPackPurchases.length,
      engagementEmailsSent: engagementSent,
      noShowsTracked: noShows,
    },
    popularClasses,
    peakHours,
    monthlyBookingTrend,
    attendanceBreakdown: {
      attended: await db.booking.count({
        where: {
          attendance: ATTENDANCE_STATUS.attended,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      noShow: noShows,
    },
    classPackPurchases: classPackPurchases.map((purchase) => ({
      id: purchase.id,
      buyerName: purchase.user.name,
      buyerEmail: purchase.user.email,
      buyerId: purchase.user.id,
      packName: purchase.pack.name,
      purchasedAt: purchase.createdAt.toISOString(),
      purchasedLabel: formatUkDateTimeShort(purchase.createdAt),
      creditsGranted: purchase.creditsGranted,
      creditsRemaining: purchase.creditsRemaining,
      creditsRemainingLabel: `${formatCredits(purchase.creditsRemaining)} of ${formatCredits(purchase.creditsGranted)} left`,
      status: purchase.status,
    })),
    periodDays: 30,
  };
}

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>;
