import { NextResponse } from "next/server";
import {
  BOOKING_STATUS,
  formatMoneyFromPence,
  isStripeConfigured,
} from "@/lib/booking-config";
import {
  countHeldBookings,
  confirmBooking,
  assertCanBookSession,
  DuplicateSessionBookingError,
} from "@/lib/booking-service";
import { deductCreditForBooking, getUserCreditBalance } from "@/lib/credit-service";
import { formatCreditLabel, hasEnoughCredits } from "@/lib/credit-units";
import { db } from "@/lib/db";
import {
  sendBookingReceivedEmails,
  sendWaitlistJoinedEmails,
} from "@/lib/email";
import { sessionPublicTitle } from "@/lib/session-display";
import {
  applyGiftCodeToCharge,
  GIFT_REDEMPTION_REASON,
  looksLikeGiftCardCode,
  restoreGiftCardBalance,
} from "@/lib/gift-card-service";
import { getMemberSession } from "@/lib/member-auth";
import { assertParQCompleteForSession, ParQRequiredError } from "@/lib/parq-service";
import { assertChildCanBook, ChildConsentRequiredError } from "@/lib/household-service";
import { createBookingCheckoutSession } from "@/lib/stripe";
import {
  resolveBookingPaymentAmountPence,
  resolveSessionCreditCost,
} from "@/lib/studio-pricing-service";
import { isCourseClassSlug } from "@/lib/gift-redeem-scope";
import {
  courseSeriesHasStarted,
  listCourseSeriesSessions,
} from "@/lib/course-series";
import { redeemVoucherForBooking } from "@/lib/voucher-service";

type BookingBody = {
  sessionId?: string;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  joinWaitlist?: boolean;
  useCredit?: boolean;
  voucherCode?: string;
  acceptedTerms?: boolean;
};

export async function POST(request: Request) {
  let body: BookingBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    sessionId,
    name,
    email,
    phone,
    notes,
    joinWaitlist,
    useCredit,
    voucherCode,
    acceptedTerms,
  } = body;

  if (!sessionId || !name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Session, name, and email are required." },
      { status: 400 },
    );
  }

  if (acceptedTerms !== true) {
    return NextResponse.json(
      { error: "Please accept the Terms & Conditions to continue." },
      { status: 400 },
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session || session.startsAt < new Date()) {
    return NextResponse.json({ error: "This session is no longer available." }, { status: 404 });
  }

  // 4-week courses: public booking closes once week 1 has started.
  if (session.courseSeriesId && isCourseClassSlug(session.class.slug)) {
    const series = await listCourseSeriesSessions(session.courseSeriesId);
    if (courseSeriesHasStarted(series)) {
      return NextResponse.json(
        {
          error:
            "This 4-week course has already started and is no longer open for public booking. Please contact the studio if you need to join late.",
        },
        { status: 400 },
      );
    }
    if ((session.courseWeek ?? 1) !== 1) {
      return NextResponse.json(
        {
          error:
            "Please book the 4-week course from its first session. That enrols you for all four weeks.",
        },
        { status: 400 },
      );
    }
  }

  const heldCount = await countHeldBookings(sessionId);
  const spotsLeft = session.capacity - heldCount;
  const memberSession = await getMemberSession();

  let userId = memberSession?.userId ?? null;
  let normalizedName = name.trim();
  let normalizedEmail = email.trim().toLowerCase();
  let normalizedPhone = phone?.trim() || null;
  let profilePhone: string | null = null;

  if (memberSession) {
    const member = await db.user.findUnique({
      where: { id: memberSession.userId },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (member) {
      userId = member.id;
      normalizedName = member.name;
      normalizedEmail = member.email.toLowerCase();
      profilePhone = member.phone?.trim() || null;
      normalizedPhone = phone?.trim() || profilePhone;
    }
  }

  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Telephone number is required." },
      { status: 400 },
    );
  }

  // Persist phone on the member profile so they are not asked again next booking.
  if (userId && (!profilePhone || profilePhone !== normalizedPhone)) {
    await db.user.update({
      where: { id: userId },
      data: { phone: normalizedPhone },
    });
  }

  try {
    await assertParQCompleteForSession(userId, sessionId);
  } catch (error) {
    if (error instanceof ParQRequiredError) {
      return NextResponse.json(
        { error: error.message, parQRequired: true },
        { status: 403 },
      );
    }
    throw error;
  }

  if (userId) {
    try {
      await assertChildCanBook(userId);
    } catch (error) {
      if (error instanceof ChildConsentRequiredError) {
        return NextResponse.json(
          { error: error.message, parentalConsentRequired: true },
          { status: 403 },
        );
      }
      throw error;
    }
  }

  try {
    await assertCanBookSession({
      sessionId,
      email: normalizedEmail,
      userId,
    });
  } catch (error) {
    if (error instanceof DuplicateSessionBookingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  if (spotsLeft <= 0) {
    if (!joinWaitlist) {
      return NextResponse.json(
        {
          error: "This session is fully booked.",
          waitlistAvailable: true,
        },
        { status: 409 },
      );
    }

    const existingWaitlist = await db.waitlistEntry.findFirst({
      where: {
        sessionId,
        status: { in: ["waiting", "notified"] },
        ...(userId ? { userId } : { email: normalizedEmail }),
      },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this session." },
        { status: 409 },
      );
    }

    const waitlistEntry = await db.waitlistEntry.create({
      data: {
        sessionId,
        userId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        notes: notes?.trim() || null,
      },
      include: {
        session: { include: { class: true } },
      },
    });

    await sendWaitlistJoinedEmails(
      { name: waitlistEntry.name, email: waitlistEntry.email },
      {
        classTitle: sessionPublicTitle(waitlistEntry.session),
        startsAt: waitlistEntry.session.startsAt,
      },
    );

    return NextResponse.json({
      type: "waitlist",
      id: waitlistEntry.id,
      name: waitlistEntry.name,
      email: waitlistEntry.email,
      classTitle: sessionPublicTitle(waitlistEntry.session),
      startsAt: waitlistEntry.session.startsAt.toISOString(),
    });
  }

  let booking;
  try {
    booking = await db.booking.create({
      data: {
        sessionId,
        userId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        notes: notes?.trim() || null,
        status: BOOKING_STATUS.pending,
      },
      include: {
        session: { include: { class: true } },
      },
    });
  } catch (error) {
    // Unique active-booking index (session + email) — race-safe duplicate guard.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already booked this session." },
        { status: 409 },
      );
    }
    throw error;
  }

  if (useCredit) {
    if (isCourseClassSlug(session.class.slug)) {
      await db.booking.delete({ where: { id: booking.id } }).catch(() => null);
      return NextResponse.json(
        {
          error:
            "Class credits cannot be used for 4-week courses. Please pay the course fee or redeem a 4-week course voucher.",
        },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to pay with class credits." },
        { status: 401 },
      );
    }

    const creditCost = resolveSessionCreditCost({
      sessionCreditCost: session.creditCost,
      classCreditCost: session.class.creditCost,
    });
    const balance = await getUserCreditBalance(userId);
    if (!hasEnoughCredits(balance, creditCost)) {
      await db.booking.delete({ where: { id: booking.id } }).catch(() => null);
      return NextResponse.json(
        {
          error: `You need ${formatCreditLabel(creditCost)} for this class. You have ${balance}.`,
        },
        { status: 402 },
      );
    }

    try {
      await deductCreditForBooking(userId, booking.id, creditCost);
    } catch (error) {
      await db.booking.delete({ where: { id: booking.id } }).catch(() => null);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "You do not have enough class credits.",
        },
        { status: 402 },
      );
    }
    const confirmed = await confirmBooking(booking.id, { amountPaid: 0 });

    return NextResponse.json({
      type: "booking",
      id: confirmed.id,
      name: confirmed.name,
      email: confirmed.email,
      status: confirmed.status,
      classTitle: sessionPublicTitle(confirmed.session),
      startsAt: confirmed.session.startsAt.toISOString(),
      paidWithCredit: true,
      creditsCharged: creditCost,
    });
  }

  const trimmedCode = voucherCode?.trim();
  const classPricePence = await resolveBookingPaymentAmountPence({
    classSlug: session.class.slug,
    sessionPricePence: session.pricePence,
    classPricePence: session.class.pricePence,
  });
  let amountDuePence = classPricePence;
  let giftApplied: {
    giftCardId: string;
    appliedPence: number;
    balanceAfter: number;
    balanceAfterLabel: string;
    appliedLabel: string;
  } | null = null;

  if (trimmedCode) {
    const treatAsGift =
      looksLikeGiftCardCode(trimmedCode) ||
      Boolean(await db.giftCard.findUnique({ where: { code: trimmedCode.toUpperCase() } }));

    if (treatAsGift) {
      try {
        const applied = await applyGiftCodeToCharge(trimmedCode, classPricePence, {
          reason: GIFT_REDEMPTION_REASON.booking,
          bookingId: booking.id,
          userId,
          classSlug: session.class.slug,
        });

        giftApplied = {
          giftCardId: applied.giftCardId,
          appliedPence: applied.appliedPence,
          balanceAfter: applied.balanceAfter,
          balanceAfterLabel: applied.balanceAfterLabel,
          appliedLabel: applied.appliedLabel,
        };
        amountDuePence = applied.amountDuePence;

        await db.booking.update({
          where: { id: booking.id },
          data: {
            giftCardId: applied.giftCardId,
            giftAmountApplied: applied.appliedPence,
          },
        });

        if (applied.fullyCovered) {
          const confirmed = await confirmBooking(booking.id, { amountPaid: 0 });

          return NextResponse.json({
            type: "booking",
            id: confirmed.id,
            name: confirmed.name,
            email: confirmed.email,
            status: confirmed.status,
            classTitle: sessionPublicTitle(confirmed.session),
            startsAt: confirmed.session.startsAt.toISOString(),
            giftCardApplied: true,
            giftAmountAppliedLabel: applied.appliedLabel,
            giftBalanceRemainingLabel: applied.balanceAfterLabel,
          });
        }
      } catch (error) {
        await db.booking.delete({ where: { id: booking.id } });
        const message = error instanceof Error ? error.message : "Invalid gift card code.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else if (userId) {
      try {
        const voucher = await redeemVoucherForBooking(userId, trimmedCode, booking.id);

        if (voucher.discountPercent >= 100) {
          const confirmed = await confirmBooking(booking.id, { amountPaid: 0 });

          return NextResponse.json({
            type: "booking",
            id: confirmed.id,
            name: confirmed.name,
            email: confirmed.email,
            status: confirmed.status,
            classTitle: sessionPublicTitle(confirmed.session),
            startsAt: confirmed.session.startsAt.toISOString(),
            voucherApplied: true,
          });
        }
      } catch (error) {
        await db.booking.delete({ where: { id: booking.id } });
        const message = error instanceof Error ? error.message : "Invalid voucher code.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else {
      await db.booking.delete({ where: { id: booking.id } });
      return NextResponse.json(
        {
          error:
            "Sign in to use reward voucher codes, or enter a gift card code (starts with GIFT-).",
        },
        { status: 401 },
      );
    }
  }

  if (!isStripeConfigured()) {
    const confirmed = await confirmBooking(booking.id, {
      amountPaid: giftApplied ? amountDuePence : undefined,
    });

    return NextResponse.json({
      type: "booking",
      id: confirmed.id,
      name: confirmed.name,
      email: confirmed.email,
      status: confirmed.status,
      classTitle: sessionPublicTitle(confirmed.session),
      startsAt: confirmed.session.startsAt.toISOString(),
      paymentSkipped: true,
      giftCardApplied: Boolean(giftApplied),
      giftBalanceRemainingLabel: giftApplied?.balanceAfterLabel,
    });
  }

  try {
    const checkout = await createBookingCheckoutSession(
      {
        id: booking.id,
        email: booking.email,
        name: booking.name,
        classTitle: sessionPublicTitle(booking.session),
        startsAt: booking.session.startsAt,
      },
      {
        amountPence: amountDuePence,
        ...(giftApplied
          ? {
              giftCardId: giftApplied.giftCardId,
              giftAmountApplied: giftApplied.appliedPence,
            }
          : {}),
      },
    );

    if (!checkout.client_secret) {
      if (giftApplied) {
        await restoreGiftCardBalance(giftApplied.giftCardId, giftApplied.appliedPence, {
          bookingId: booking.id,
          userId,
        });
      }
      return NextResponse.json(
        { error: "Unable to start embedded checkout. Please try again." },
        { status: 503 },
      );
    }

    await db.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: checkout.id },
    });

    await sendBookingReceivedEmails(
      { name: booking.name, email: booking.email },
      {
        classTitle: sessionPublicTitle(booking.session),
        startsAt: booking.session.startsAt,
      },
      amountDuePence,
    );

    return NextResponse.json({
      type: "booking",
      id: booking.id,
      name: booking.name,
      email: booking.email,
      status: booking.status,
      classTitle: sessionPublicTitle(booking.session),
      startsAt: booking.session.startsAt.toISOString(),
      clientSecret: checkout.client_secret,
      classPriceLabel: formatMoneyFromPence(amountDuePence),
      depositLabel: formatMoneyFromPence(amountDuePence),
      giftCardApplied: Boolean(giftApplied),
      giftAmountAppliedLabel: giftApplied?.appliedLabel,
      giftBalanceRemainingLabel: giftApplied?.balanceAfterLabel,
    });
  } catch (error) {
    if (giftApplied) {
      await restoreGiftCardBalance(giftApplied.giftCardId, giftApplied.appliedPence, {
        bookingId: booking.id,
        userId,
      });
    }
    await db.booking.delete({ where: { id: booking.id } });
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
