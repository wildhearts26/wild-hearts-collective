import {
  BOOKING_STATUS,
} from "@/lib/booking-config";
import {
  CANCELLATION_TYPE,
  isWithinCancellationWindow,
} from "@/lib/booking-advanced-config";
import { cancelBooking } from "@/lib/booking-service";
import { refundBookingAsCredits } from "@/lib/credit-service";
import { formatCreditLabel } from "@/lib/credit-units";
import {
  courseSeriesHasStarted,
  isCourseSeriesSession,
  listCourseSeriesSessions,
} from "@/lib/course-series";
import { db } from "@/lib/db";
import { getMemberSession } from "@/lib/member-auth";
import { contact } from "@/lib/site-data";

export class CancellationPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CancellationPolicyError";
  }
}

const CASH_REFUND_NOTE = `Cash refunds are available but must be requested by emailing ${contact.email} — they are processed manually.`;

function refundMessage(options: {
  onTime: boolean;
  creditRefunded: boolean;
  creditsRefunded?: number;
  noAccount?: boolean;
  course?: boolean;
  courseStarted?: boolean;
}) {
  if (options.course && options.courseStarted) {
    return `Your 4-week course has been cancelled (all four weeks). Because the course has already started, no refund applies. ${CASH_REFUND_NOTE}`;
  }

  if (!options.onTime) {
    return `Your booking was cancelled within 24 hours of the class start time. No credit refund applies under our cancellation policy. ${CASH_REFUND_NOTE}`;
  }

  if (options.creditRefunded && options.creditsRefunded) {
    return `Your booking was cancelled and ${formatCreditLabel(options.creditsRefunded)} ${options.creditsRefunded === 1 ? "has" : "have"} been added to your account. ${CASH_REFUND_NOTE}`;
  }

  if (options.noAccount) {
    return `Your booking was cancelled. Credits could not be added automatically because this booking is not linked to an account. ${CASH_REFUND_NOTE}`;
  }

  if (options.course) {
    return `Your 4-week course has been cancelled (all four weeks). ${CASH_REFUND_NOTE}`;
  }

  return `Your booking was cancelled. ${CASH_REFUND_NOTE}`;
}

async function refundIfEligible(bookingId: string) {
  const result = await refundBookingAsCredits(bookingId);
  return {
    creditRefunded: result.refunded,
    creditsRefunded: result.creditsRefunded ?? 0,
    noAccount: "noAccount" in result && result.noAccount === true,
  };
}

async function listMemberCourseBookings(
  courseSeriesId: string,
  userId: string,
  email: string,
) {
  return db.booking.findMany({
    where: {
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed] },
      session: { courseSeriesId },
      OR: [{ userId }, { email: { equals: email, mode: "insensitive" } }],
    },
    include: {
      session: { include: { class: true } },
    },
    orderBy: { session: { startsAt: "asc" } },
  });
}

async function cancelMemberCourseBooking(
  booking: {
    id: string;
    userId: string;
    email: string;
    session: {
      courseSeriesId: string | null;
      startsAt: Date;
      class: { title: string };
    };
  },
  userId: string,
) {
  const courseSeriesId = booking.session.courseSeriesId;
  if (!courseSeriesId) {
    throw new CancellationPolicyError("Course booking is missing its series.");
  }

  const series = await listCourseSeriesSessions(courseSeriesId);
  const started = courseSeriesHasStarted(series);
  const week1 = series.find((session) => session.courseWeek === 1) ?? series[0];
  const onTime = week1 ? isWithinCancellationWindow(week1.startsAt) : false;
  // Refund only if the course has not started and they are still inside the
  // 24-hour cancellation window before week 1.
  const refundEligible = !started && onTime;

  const related = await listMemberCourseBookings(
    courseSeriesId,
    userId,
    booking.email,
  );

  if (related.length === 0) {
    throw new CancellationPolicyError("This 4-week course is already cancelled.");
  }

  const now = new Date();
  if (related.every((item) => item.session.startsAt.getTime() <= now.getTime())) {
    throw new CancellationPolicyError("This course has already finished and cannot be cancelled online.");
  }

  // Always cancel every week in the block — not only the week they clicked,
  // and not only weeks that have not started yet.
  const toCancel = related;

  const cancellationType = refundEligible
    ? CANCELLATION_TYPE.onTime
    : CANCELLATION_TYPE.lateCancelled;

  for (const item of toCancel) {
    await db.booking.update({
      where: { id: item.id },
      data: { cancellationType },
    });
  }

  let creditRefunded = false;
  let creditsRefunded = 0;
  let noAccount = false;

  if (refundEligible) {
    const paidBooking =
      toCancel.find(
        (item) =>
          item.paidWithCredit ||
          (item.amountPaid != null && item.amountPaid > 0) ||
          (item.giftAmountApplied != null && item.giftAmountApplied > 0),
      ) ?? toCancel[0];
    const refund = await refundIfEligible(paidBooking.id);
    creditRefunded = refund.creditRefunded;
    creditsRefunded = refund.creditsRefunded;
    noAccount = refund.noAccount;
  }

  const emailBookingId = toCancel.some((item) => item.id === booking.id)
    ? booking.id
    : toCancel[0].id;

  for (const item of toCancel) {
    await cancelBooking(item.id, {
      cancelledBy: "member",
      creditRefunded: item.id === emailBookingId ? creditRefunded : false,
      skipEmail: item.id !== emailBookingId,
      skipWaitlist: item.session.startsAt.getTime() <= now.getTime(),
    });
  }

  return {
    bookingId: booking.id,
    cancellationType,
    creditRefunded,
    creditsRefunded,
    message: refundMessage({
      onTime: refundEligible,
      creditRefunded,
      creditsRefunded,
      noAccount,
      course: true,
      courseStarted: started,
    }),
  };
}

export async function cancelMemberBooking(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!booking || booking.userId !== userId) {
    throw new CancellationPolicyError("Booking not found.");
  }

  if (booking.status === BOOKING_STATUS.cancelled) {
    throw new CancellationPolicyError("This booking is already cancelled.");
  }

  if (isCourseSeriesSession(booking.session)) {
    return cancelMemberCourseBooking(
      {
        id: booking.id,
        userId,
        email: booking.email,
        session: booking.session,
      },
      userId,
    );
  }

  if (booking.session.startsAt < new Date()) {
    throw new CancellationPolicyError("Past sessions cannot be cancelled online.");
  }

  const onTime = isWithinCancellationWindow(booking.session.startsAt);
  const cancellationType = onTime
    ? CANCELLATION_TYPE.onTime
    : CANCELLATION_TYPE.lateCancelled;

  await db.booking.update({
    where: { id: bookingId },
    data: { cancellationType },
  });

  let creditRefunded = false;
  let creditsRefunded = 0;
  let noAccount = false;

  if (onTime) {
    const refund = await refundIfEligible(bookingId);
    creditRefunded = refund.creditRefunded;
    creditsRefunded = refund.creditsRefunded;
    noAccount = refund.noAccount;
  }

  await cancelBooking(bookingId, {
    cancelledBy: "member",
    creditRefunded,
  });

  return {
    bookingId,
    cancellationType,
    creditRefunded,
    creditsRefunded,
    message: refundMessage({
      onTime,
      creditRefunded,
      creditsRefunded,
      noAccount,
    }),
  };
}

export async function handleMemberCancelRequest(bookingId: string) {
  const session = await getMemberSession();

  if (!session) {
    throw new CancellationPolicyError("Please sign in to cancel a booking.");
  }

  return cancelMemberBooking(bookingId, session.userId);
}
