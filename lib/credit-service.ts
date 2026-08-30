import type { Prisma } from "@prisma/client";
import {
  CLASS_PACK_STATUS,
  CREDIT_REASON,
} from "@/lib/booking-advanced-config";
import {
  DEFAULT_CREDIT_COST,
  hasEnoughCredits,
  penceToCredits,
} from "@/lib/credit-units";
import { db } from "@/lib/db";
import { sendClassPackPurchaseEmails } from "@/lib/email";

type TransactionClient = Prisma.TransactionClient;

async function expireStalePurchases(tx: TransactionClient, userId: string) {
  const now = new Date();

  await tx.classPackPurchase.updateMany({
    where: {
      userId,
      status: CLASS_PACK_STATUS.active,
      expiresAt: { lt: now },
    },
    data: { status: CLASS_PACK_STATUS.expired },
  });
}

export async function getUserCreditBalance(userId: string) {
  await expireStalePurchases(db, userId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });

  return user?.creditsRemaining ?? 0;
}

export async function grantCreditsFromPackPurchase(
  userId: string,
  packId: string,
  credits: number,
  validDays: number,
  stripePaymentId?: string,
  stripeSessionId?: string,
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  return db.$transaction(async (tx) => {
    const purchase = await tx.classPackPurchase.create({
      data: {
        userId,
        packId,
        creditsGranted: credits,
        creditsRemaining: credits,
        expiresAt,
        stripePaymentId: stripePaymentId ?? null,
        stripeSessionId: stripeSessionId ?? null,
        status: CLASS_PACK_STATUS.active,
      },
    });

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: credits } },
      select: { creditsRemaining: true },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        purchaseId: purchase.id,
        amount: credits,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.packPurchase,
      },
    });

    return { purchase, balance: user.creditsRemaining };
  });
}

export async function createPendingClassPackPurchase(userId: string, packId: string) {
  const pack = await db.classPack.findUnique({ where: { id: packId } });

  if (!pack || !pack.active) {
    throw new Error("Class pack not available.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pack.validDays);

  return db.classPackPurchase.create({
    data: {
      userId,
      packId: pack.id,
      creditsGranted: pack.credits,
      creditsRemaining: 0,
      expiresAt,
      status: "pending",
    },
    include: { pack: true },
  });
}

export async function fulfillPendingClassPackPurchase(
  purchaseId: string,
  stripePaymentId?: string,
  stripeSessionId?: string,
) {
  const result = await db.$transaction(async (tx) => {
    const purchase = await tx.classPackPurchase.findUnique({
      where: { id: purchaseId },
      include: { pack: true },
    });

    if (!purchase || purchase.status !== "pending") {
      return null;
    }

    const user = await tx.user.update({
      where: { id: purchase.userId },
      data: { creditsRemaining: { increment: purchase.creditsGranted } },
      select: { creditsRemaining: true, name: true, email: true },
    });

    const fulfilled = await tx.classPackPurchase.update({
      where: { id: purchaseId },
      data: {
        status: CLASS_PACK_STATUS.active,
        creditsRemaining: purchase.creditsGranted,
        stripePaymentId: stripePaymentId ?? null,
        stripeSessionId: stripeSessionId ?? null,
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        amount: purchase.creditsGranted,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.packPurchase,
      },
    });

    return {
      purchase: fulfilled,
      pack: purchase.pack,
      balance: user.creditsRemaining,
      customer: { name: user.name, email: user.email },
    };
  });

  if (result) {
    try {
      await sendClassPackPurchaseEmails(result.customer, {
        packName: result.pack.name,
        credits: result.purchase.creditsGranted,
        pricePence: result.pack.pricePence,
        expiresAt: result.purchase.expiresAt,
        balanceAfter: result.balance,
      });
    } catch (error) {
      console.error("[email:class-pack]", purchaseId, error);
    }
  }

  return result
    ? { purchase: result.purchase, balance: result.balance }
    : null;
}

export async function deductCreditForBooking(
  userId: string,
  bookingId: string,
  creditCost: number = DEFAULT_CREDIT_COST,
) {
  const cost =
    Number.isFinite(creditCost) && creditCost > 0
      ? Math.round(creditCost * 100) / 100
      : DEFAULT_CREDIT_COST;

  return db.$transaction(async (tx) => {
    await expireStalePurchases(tx, userId);

    const current = await tx.user.findUnique({
      where: { id: userId },
      select: { creditsRemaining: true },
    });

    if (!current || !hasEnoughCredits(current.creditsRemaining, cost)) {
      throw new Error("You do not have enough class credits.");
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { decrement: cost } },
      select: { creditsRemaining: true },
    });

    let remainingToDeduct = cost;
    const purchases = await tx.classPackPurchase.findMany({
      where: {
        userId,
        status: CLASS_PACK_STATUS.active,
        creditsRemaining: { gt: 0 },
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: "asc" },
    });

    let primaryPurchaseId: string | null = null;

    for (const purchase of purchases) {
      if (remainingToDeduct <= 0) break;
      const take = Math.min(purchase.creditsRemaining, remainingToDeduct);
      const nextRemaining =
        Math.round((purchase.creditsRemaining - take) * 100) / 100;
      await tx.classPackPurchase.update({
        where: { id: purchase.id },
        data: {
          creditsRemaining: nextRemaining,
          status:
            nextRemaining <= 1e-9
              ? CLASS_PACK_STATUS.exhausted
              : CLASS_PACK_STATUS.active,
        },
      });
      if (!primaryPurchaseId) primaryPurchaseId = purchase.id;
      remainingToDeduct = Math.round((remainingToDeduct - take) * 100) / 100;
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        bookingId,
        purchaseId: primaryPurchaseId,
        amount: -cost,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.bookingDeduction,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        paidWithCredit: true,
        creditsCharged: cost,
        packPurchaseId: primaryPurchaseId,
      },
    });

    return {
      balance: user.creditsRemaining,
      purchaseId: primaryPurchaseId,
      creditsCharged: cost,
    };
  });
}

export async function refundCreditForCancellation(
  userId: string,
  bookingId: string,
) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        paidWithCredit: true,
        packPurchaseId: true,
        creditsCharged: true,
      },
    });

    if (!booking?.paidWithCredit) {
      return { refunded: false as const };
    }

    const cost =
      booking.creditsCharged != null && booking.creditsCharged > 0
        ? booking.creditsCharged
        : DEFAULT_CREDIT_COST;

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: cost } },
      select: { creditsRemaining: true },
    });

    if (booking.packPurchaseId) {
      const purchase = await tx.classPackPurchase.findUnique({
        where: { id: booking.packPurchaseId },
      });

      if (purchase) {
        const nextRemaining =
          Math.round((purchase.creditsRemaining + cost) * 100) / 100;
        await tx.classPackPurchase.update({
          where: { id: purchase.id },
          data: {
            creditsRemaining: nextRemaining,
            status: CLASS_PACK_STATUS.active,
          },
        });
      }
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        bookingId,
        purchaseId: booking.packPurchaseId,
        amount: cost,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.cancellationRefund,
      },
    });

    return { refunded: true as const, balance: user.creditsRemaining, creditsRefunded: cost };
  });
}

async function resolveRefundUserId(
  tx: TransactionClient,
  booking: { userId: string | null; email: string },
) {
  if (booking.userId) return booking.userId;

  const user = await tx.user.findFirst({
    where: {
      email: { equals: booking.email, mode: "insensitive" },
      guardianUserId: null,
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Refund a cancelled booking as class credits.
 * Credit-paid bookings return the credits charged; card/gift payments convert
 * at £10 = 1 credit (£5 = 0.5).
 */
export async function refundBookingAsCredits(bookingId: string) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        email: true,
        paidWithCredit: true,
        packPurchaseId: true,
        creditsCharged: true,
        amountPaid: true,
        giftAmountApplied: true,
      },
    });

    if (!booking) {
      return { refunded: false as const, creditsRefunded: 0 };
    }

    const existing = await tx.creditTransaction.findFirst({
      where: { bookingId, reason: CREDIT_REASON.cancellationRefund },
    });
    if (existing) {
      return {
        refunded: true as const,
        creditsRefunded: existing.amount,
        already: true as const,
      };
    }

    const userId = await resolveRefundUserId(tx, booking);
    if (!userId) {
      return { refunded: false as const, creditsRefunded: 0, noAccount: true as const };
    }

    let cost = 0;
    if (booking.paidWithCredit) {
      cost =
        booking.creditsCharged != null && booking.creditsCharged > 0
          ? booking.creditsCharged
          : DEFAULT_CREDIT_COST;
    } else {
      const pence = (booking.amountPaid ?? 0) + (booking.giftAmountApplied ?? 0);
      cost = penceToCredits(pence);
    }

    if (cost <= 0) {
      return { refunded: false as const, creditsRefunded: 0 };
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: cost } },
      select: { creditsRemaining: true },
    });

    if (booking.paidWithCredit && booking.packPurchaseId) {
      const purchase = await tx.classPackPurchase.findUnique({
        where: { id: booking.packPurchaseId },
      });

      if (purchase) {
        const nextRemaining =
          Math.round((purchase.creditsRemaining + cost) * 100) / 100;
        await tx.classPackPurchase.update({
          where: { id: purchase.id },
          data: {
            creditsRemaining: nextRemaining,
            status: CLASS_PACK_STATUS.active,
          },
        });
      }
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        bookingId,
        purchaseId: booking.paidWithCredit ? booking.packPurchaseId : null,
        amount: cost,
        balanceAfter: user.creditsRemaining,
        reason: CREDIT_REASON.cancellationRefund,
      },
    });

    return {
      refunded: true as const,
      balance: user.creditsRemaining,
      creditsRefunded: cost,
    };
  });
}
