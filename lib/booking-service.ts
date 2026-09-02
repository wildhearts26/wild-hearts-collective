import {
  BOOKING_STATUS,
  WAITLIST_STATUS,
  formatMoneyFromPence,
  getAppBaseUrl,
  isStripeConfigured,
} from "@/lib/booking-config";
import {
  CANCELLATION_TYPE,
  PAYMENT_HOLD_MS,
} from "@/lib/booking-advanced-config";
import { resolveCreditsChargedOnConfirm } from "@/lib/booking-refund-credits";
import { formatCreditLabel } from "@/lib/credit-units";
import { db } from "@/lib/db";
import {
  sendBookingCancelledEmails,
  sendBookingConfirmedEmails,
  sendUnpaidBookingExpiredAdminEmail,
  sendWaitlistSpotAvailableEmail,
} from "@/lib/email";
import { restoreGiftCardBalance } from "@/lib/gift-card-service";
import { sessionPublicTitle } from "@/lib/session-display";
import { releaseVoucherFromBooking } from "@/lib/voucher-service";

export function paymentHoldCutoff(now = new Date()) {
  return new Date(now.getTime() - PAYMENT_HOLD_MS);
}

async function expireStripeCheckoutSession(stripeSessionId: string) {
  if (!isStripeConfigured()) return;

  try {
    const { getStripeClient } = await import("@/lib/stripe");
    await getStripeClient().checkout.sessions.expire(stripeSessionId);
  } catch {
    // Session may already be expired, completed, or unavailable.
  }
}

/**
 * Cancel a pending booking after unpaid checkout timed out.
 * Emails the studio only (not the member — they abandoned payment).
 */
export async function cancelBookingForPaymentExpiry(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!booking || booking.status !== BOOKING_STATUS.pending) {
    return null;
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.cancelled,
      cancellationType: CANCELLATION_TYPE.paymentExpired,
    },
    include: {
      session: { include: { class: true } },
    },
  });

  if (booking.giftCardId && booking.giftAmountApplied && booking.giftAmountApplied > 0) {
    try {
      await restoreGiftCardBalance(booking.giftCardId, booking.giftAmountApplied, {
        bookingId: booking.id,
        userId: booking.userId,
      });
    } catch (error) {
      console.error("[gift-card:restore-on-expiry]", bookingId, error);
    }
  }

  if (booking.voucherId) {
    try {
      await releaseVoucherFromBooking(booking.id);
    } catch (error) {
      console.error("[voucher:release-on-expiry]", bookingId, error);
    }
  }

  try {
    await sendUnpaidBookingExpiredAdminEmail(
      { name: updated.name, email: updated.email },
      {
        classTitle: sessionPublicTitle(updated.session),
        startsAt: updated.session.startsAt,
      },
    );
  } catch (error) {
    console.error("[email:unpaid-booking-expired]", bookingId, error);
  }

  return updated;
}

/**
 * Cancel unpaid pending bookings older than the payment hold window and release
 * their spots. Notifies the studio; does not email the customer (abandoned checkout).
 * If Stripe shows the checkout was already paid, confirm instead of cancelling.
 */
export async function expireStalePendingBookings(options?: {
  sessionId?: string;
}) {
  const cutoff = paymentHoldCutoff();
  const stale = await db.booking.findMany({
    where: {
      status: BOOKING_STATUS.pending,
      createdAt: { lt: cutoff },
      ...(options?.sessionId ? { sessionId: options.sessionId } : {}),
    },
    select: {
      id: true,
      sessionId: true,
      stripeSessionId: true,
    },
  });

  if (stale.length === 0) {
    return { expired: 0, confirmed: 0, sessionIds: [] as string[] };
  }

  let expired = 0;
  let confirmed = 0;
  const releasedSessionIds = new Set<string>();

  for (const booking of stale) {
    if (booking.stripeSessionId && isStripeConfigured()) {
      try {
        const { getStripeClient } = await import("@/lib/stripe");
        const checkout = await getStripeClient().checkout.sessions.retrieve(
          booking.stripeSessionId,
        );

        if (checkout.payment_status === "paid") {
          const paymentIntent =
            typeof checkout.payment_intent === "string"
              ? checkout.payment_intent
              : checkout.payment_intent?.id;

          await confirmBooking(booking.id, {
            stripePaymentId: paymentIntent,
            amountPaid: checkout.amount_total ?? undefined,
          });
          confirmed += 1;
          continue;
        }
      } catch {
        // Fall through to cancel if Stripe lookup fails.
      }
    }

    const cancelled = await cancelBookingForPaymentExpiry(booking.id);

    if (booking.stripeSessionId) {
      await expireStripeCheckoutSession(booking.stripeSessionId);
    }

    if (cancelled) {
      expired += 1;
      releasedSessionIds.add(booking.sessionId);
    }
  }

  for (const sessionId of releasedSessionIds) {
    await notifyNextWaitlistEntry(sessionId);
  }

  return {
    expired,
    confirmed,
    sessionIds: [...releasedSessionIds],
  };
}

export async function countConfirmedBookings(sessionId: string) {
  return db.booking.count({
    where: {
      sessionId,
      status: BOOKING_STATUS.confirmed,
    },
  });
}

/** Confirmed bookings plus unpaid checkouts still inside the hold window. */
export async function countHeldBookings(sessionId: string) {
  await expireStalePendingBookings({ sessionId });

  const cutoff = paymentHoldCutoff();

  return db.booking.count({
    where: {
      sessionId,
      OR: [
        { status: BOOKING_STATUS.confirmed },
        {
          status: BOOKING_STATUS.pending,
          createdAt: { gte: cutoff },
        },
      ],
    },
  });
}

export async function sessionHasCapacity(sessionId: string, capacity: number) {
  const held = await countHeldBookings(sessionId);
  return held < capacity;
}

/**
 * Active place on a session: confirmed, or pending within the payment hold window.
 * Matches by email and/or member userId so guests and signed-in members cannot double-book.
 */
export async function findActiveSessionBooking(input: {
  sessionId: string;
  email: string;
  userId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const cutoff = paymentHoldCutoff();
  const identityFilter = input.userId
    ? { userId: input.userId }
    : { email };

  return db.booking.findFirst({
    where: {
      sessionId: input.sessionId,
      AND: [
        identityFilter,
        {
          OR: [
            { status: BOOKING_STATUS.confirmed },
            {
              status: BOOKING_STATUS.pending,
              createdAt: { gte: cutoff },
            },
          ],
        },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export class DuplicateSessionBookingError extends Error {
  readonly existingStatus: string;

  constructor(existingStatus: string) {
    super(
      existingStatus === BOOKING_STATUS.pending
        ? "You already have a booking in progress for this session. Complete payment or wait for the hold to expire before trying again."
        : "You have already booked this session.",
    );
    this.name = "DuplicateSessionBookingError";
    this.existingStatus = existingStatus;
  }
}

export async function assertCanBookSession(input: {
  sessionId: string;
  email: string;
  userId?: string | null;
}) {
  const existing = await findActiveSessionBooking(input);
  if (existing) {
    throw new DuplicateSessionBookingError(existing.status);
  }
}

export async function confirmBooking(
  bookingId: string,
  options?: {
    stripePaymentId?: string;
    amountPaid?: number;
    /** Human-readable payment line for confirmation emails (gift card, credit, etc.). */
    paymentSummary?: string;
  },
) {
  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: { include: { class: true } },
      giftCard: { select: { code: true } },
      voucher: { select: { code: true, discountPercent: true } },
    },
  });

  if (!existing) {
    throw new Error("Booking not found.");
  }

  const amountPaid =
    options?.amountPaid !== undefined ? options.amountPaid : existing.amountPaid;
  const creditsCharged = resolveCreditsChargedOnConfirm({
    paidWithCredit: existing.paidWithCredit,
    creditsCharged: existing.creditsCharged,
    amountPaid,
    giftAmountApplied: existing.giftAmountApplied,
    session: existing.session,
  });

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BOOKING_STATUS.confirmed,
      stripePaymentId: options?.stripePaymentId,
      amountPaid,
      creditsCharged,
    },
    include: {
      session: { include: { class: true } },
      giftCard: { select: { code: true } },
      voucher: { select: { code: true, discountPercent: true } },
    },
  });

  let paymentSummary = options?.paymentSummary;
  if (!paymentSummary) {
    if (booking.paidWithCredit) {
      const creditCost =
        booking.creditsCharged != null && booking.creditsCharged > 0
          ? booking.creditsCharged
          : 1;
      paymentSummary = `Paid with ${formatCreditLabel(creditCost)}`;
    } else if (booking.giftAmountApplied && booking.giftAmountApplied > 0) {
      const giftLabel = formatMoneyFromPence(booking.giftAmountApplied);
      const cardPaid =
        options?.amountPaid && options.amountPaid > 0
          ? ` + ${formatMoneyFromPence(options.amountPaid)} card`
          : "";
      paymentSummary = `Gift card ${giftLabel}${cardPaid}${
        booking.giftCard?.code ? ` (${booking.giftCard.code})` : ""
      }`;
    } else if (booking.voucherId) {
      const percent = booking.voucher?.discountPercent ?? 100;
      if (percent >= 100 || !options?.amountPaid) {
        paymentSummary = "Complimentary (reward voucher)";
      } else {
        paymentSummary = `${percent}% reward voucher + ${formatMoneyFromPence(options.amountPaid)} card`;
      }
    }
  }

  // 4-week courses: enrol the same person on remaining weekly sessions before
  // sending email, so an email/pricing failure cannot leave a paid course only
  // partly enrolled.
  try {
    const { enrolRemainingCourseWeeks } = await import("@/lib/course-series");
    await enrolRemainingCourseWeeks(booking.id);
  } catch (error) {
    console.error("[booking] failed to enrol remaining course weeks:", booking.id, error);
  }

  await sendBookingConfirmedEmails(
    { name: booking.name, email: booking.email },
    {
      classTitle: sessionPublicTitle(booking.session),
      startsAt: booking.session.startsAt,
      endsAt: booking.session.endsAt,
      durationMinutes: booking.session.class.duration,
    },
    options?.amountPaid ?? booking.amountPaid,
    paymentSummary,
  );

  await markWaitlistConverted({
    sessionId: booking.sessionId,
    email: booking.email,
    userId: booking.userId,
  });

  return booking;
}

export async function markWaitlistConverted(input: {
  sessionId: string;
  email: string;
  userId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  await db.waitlistEntry.updateMany({
    where: {
      sessionId: input.sessionId,
      status: { in: [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified] },
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        ...(input.userId ? [{ userId: input.userId }] : []),
      ],
    },
    data: { status: WAITLIST_STATUS.booked },
  });
}

export async function cancelBooking(
  bookingId: string,
  options?: {
    cancelledBy?: "member" | "admin" | "system";
    creditRefunded?: boolean;
    skipEmail?: boolean;
    skipWaitlist?: boolean;
  },
) {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.cancelled },
    include: {
      session: { include: { class: true } },
    },
  });

  if (!options?.skipEmail) {
    await sendBookingCancelledEmails(
      { name: booking.name, email: booking.email },
      {
        classTitle: sessionPublicTitle(booking.session),
        startsAt: booking.session.startsAt,
      },
      {
        cancelledBy: options?.cancelledBy ?? "member",
        cancellationType: booking.cancellationType,
        creditRefunded: options?.creditRefunded,
      },
    );
  }

  if (!options?.skipWaitlist) {
    await notifyNextWaitlistEntry(booking.sessionId);
  }

  return booking;
}

export async function notifyNextWaitlistEntry(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) return null;

  const held = await countHeldBookings(sessionId);
  if (held >= session.capacity) return null;

  const next = await db.waitlistEntry.findFirst({
    where: {
      sessionId,
      status: WAITLIST_STATUS.waiting,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!next) return null;

  const updated = await db.waitlistEntry.update({
    where: { id: next.id },
    data: { status: WAITLIST_STATUS.notified },
  });

  const bookUrl = `${getAppBaseUrl()}/book?class=${session.class.slug}&session=${session.id}`;

  await sendWaitlistSpotAvailableEmail(
    { name: updated.name, email: updated.email },
    {
      classTitle: sessionPublicTitle(session),
      startsAt: session.startsAt,
    },
    bookUrl,
  );

  return updated;
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
) {
  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: { session: { include: { class: true } } },
  });

  if (!existing) {
    return null;
  }

  if (status === BOOKING_STATUS.confirmed) {
    const sessionRecord = await db.session.findUnique({
      where: { id: existing.sessionId },
    });

    if (!sessionRecord) {
      return null;
    }

    if (existing.status !== BOOKING_STATUS.confirmed) {
      const held = await countHeldBookings(existing.sessionId);
      const cutoff = paymentHoldCutoff();
      const alreadyHoldsSpot =
        existing.status === BOOKING_STATUS.pending &&
        existing.createdAt >= cutoff;

      if (!alreadyHoldsSpot && held >= sessionRecord.capacity) {
        throw new Error("This session is fully booked.");
      }

      return confirmBooking(bookingId);
    }

    return db.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.confirmed },
      include: { session: { include: { class: true } } },
    });
  }

  if (status === BOOKING_STATUS.cancelled) {
    if (existing.status === BOOKING_STATUS.cancelled) {
      return existing;
    }
    return cancelBooking(bookingId, { cancelledBy: "admin" });
  }

  return db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.pending },
    include: { session: { include: { class: true } } },
  });
}
