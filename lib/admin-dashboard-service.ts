import { MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { expireStalePendingBookings } from "@/lib/booking-service";
import { db } from "@/lib/db";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function getAdminDashboardStats() {
  await expireStalePendingBookings();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
  const monthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const [
    members,
    newToday,
    newWeek,
    newMonth,
    membersWithCredits,
    pendingBookings,
    todaysSessions,
    safetyAlerts,
    recentAudit,
  ] = await Promise.all([
    db.user.groupBy({
      by: ["membershipStatus"],
      _count: { _all: true },
    }),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: monthAgo } } }),
    db.user.findMany({
      where: { creditsRemaining: { gt: 0 } },
      orderBy: { creditsRemaining: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        creditsRemaining: true,
      },
    }),
    db.booking.count({ where: { status: "pending" } }),
    db.session.findMany({
      where: { startsAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startsAt: "asc" },
      include: {
        class: true,
        tutor: { select: { id: true, name: true } },
        bookings: {
          where: { status: "confirmed" },
          select: { id: true },
        },
      },
    }),
    db.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        session: { startsAt: { gte: todayStart, lte: todayEnd } },
        user: {
          OR: [
            { medicalNotes: { not: null } },
            { injuriesLimitations: { not: null } },
            { allergiesSafetyAlerts: { not: null } },
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            medicalNotes: true,
            injuriesLimitations: true,
            allergiesSafetyAlerts: true,
          },
        },
        session: { include: { class: true } },
      },
    }),
    db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        targetUser: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const statusCounts = {
    active: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
    inactive: 0,
    total: 0,
  };

  for (const row of members) {
    const count = row._count._all;
    statusCounts.total += count;
    if (row.membershipStatus === MEMBERSHIP_STATUS.active) statusCounts.active = count;
    else if (row.membershipStatus === MEMBERSHIP_STATUS.paused) statusCounts.paused = count;
    else if (row.membershipStatus === MEMBERSHIP_STATUS.cancelled) statusCounts.cancelled = count;
    else if (row.membershipStatus === MEMBERSHIP_STATUS.expired) statusCounts.expired = count;
    else statusCounts.inactive += count;
  }

  return {
    statusCounts,
    signUps: { today: newToday, week: newWeek, month: newMonth },
    membersWithCredits,
    pendingBookings,
    todaysSessions,
    safetyAlerts,
    recentAudit,
  };
}
