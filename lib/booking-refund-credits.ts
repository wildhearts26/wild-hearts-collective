import { COURSE_SERIES_WEEKS } from "@/lib/course-series";
import { isCourseClassSlug } from "@/lib/gift-redeem-scope";
import { resolveSessionCreditCost } from "@/lib/studio-pricing-service";

type SessionCreditSource = {
  sessionCreditCost?: number | null;
  classCreditCost?: number | null;
};

export function bookingHadPayment(input: {
  paidWithCredit?: boolean | null;
  amountPaid?: number | null;
  giftAmountApplied?: number | null;
}) {
  return (
    Boolean(input.paidWithCredit) ||
    (input.amountPaid != null && input.amountPaid > 0) ||
    (input.giftAmountApplied != null && input.giftAmountApplied > 0)
  );
}

export function resolveSessionBookingCreditCost(source: SessionCreditSource) {
  return resolveSessionCreditCost({
    sessionCreditCost: source.sessionCreditCost,
    classCreditCost: source.classCreditCost,
  });
}

/** Credit refund for a paid 4-week course block (not per sibling week). */
export function resolveCourseBlockRefundCredits(source: SessionCreditSource) {
  const perWeek = resolveSessionBookingCreditCost(source);
  return Math.round(perWeek * COURSE_SERIES_WEEKS * 100) / 100;
}

type BookingRefundInput = {
  paidWithCredit?: boolean | null;
  creditsCharged?: number | null;
  amountPaid?: number | null;
  giftAmountApplied?: number | null;
  session: {
    creditCost?: number | null;
    courseSeriesId?: string | null;
    class: {
      slug: string;
      creditCost?: number | null;
    };
  };
};

/**
 * Credits returned when a booking is cancelled on time.
 * Refunds match the class credit cost — not the cash amount paid.
 */
export function resolveBookingRefundCredits(input: BookingRefundInput) {
  if (!bookingHadPayment(input)) {
    return 0;
  }

  if (input.creditsCharged != null) {
    return input.creditsCharged > 0 ? input.creditsCharged : 0;
  }

  const { session } = input;
  const creditSource = {
    sessionCreditCost: session.creditCost,
    classCreditCost: session.class.creditCost,
  };

  const isCourse =
    Boolean(session.courseSeriesId) && isCourseClassSlug(session.class.slug);

  if (isCourse) {
    return resolveCourseBlockRefundCredits(creditSource);
  }

  return resolveSessionBookingCreditCost(creditSource);
}

/** Snapshot the credit cost at confirmation for later refunds. */
export function resolveCreditsChargedOnConfirm(input: BookingRefundInput) {
  if (input.paidWithCredit && input.creditsCharged != null && input.creditsCharged > 0) {
    return input.creditsCharged;
  }

  if (!bookingHadPayment({
    paidWithCredit: input.paidWithCredit,
    amountPaid: input.amountPaid,
    giftAmountApplied: input.giftAmountApplied,
  })) {
    return 0;
  }

  return resolveBookingRefundCredits({
    ...input,
    creditsCharged: null,
  });
}
