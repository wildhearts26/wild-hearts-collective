import type { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import {
  BIRTHDAY_VOUCHER_VALID_DAYS,
  REENGAGEMENT_VOUCHER_VALID_DAYS,
  VOUCHER_TYPE,
  milestoneVoucherType,
  parseMilestonesAwarded,
  type VoucherType,
} from "@/lib/booking-advanced-config";
import { getAppBaseUrl, UK_TIMEZONE } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { sendVoucherEmail } from "@/lib/email";
import { getRewardCampaignSettings } from "@/lib/reward-campaign-settings";

function generateVoucherCode(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function voucherExpiry(days: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export async function createVoucherForUser(
  userId: string,
  type: VoucherType,
  options?: {
    discountPercent?: number;
    validDays?: number;
    metadata?: Record<string, unknown>;
    sendEmail?: boolean;
  },
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const prefix = type.split("_")[0]?.slice(0, 4).toUpperCase() ?? "WHCC";
  const code = generateVoucherCode(prefix);
  const discountPercent = options?.discountPercent ?? 100;
  const validDays = options?.validDays ?? BIRTHDAY_VOUCHER_VALID_DAYS;

  const voucher = await db.voucher.create({
    data: {
      code,
      userId: user.id,
      type,
      discountPercent,
      expiresAt: voucherExpiry(validDays),
      metadata: (options?.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  if (options?.sendEmail !== false) {
    await sendVoucherEmail(
      { name: user.name, email: user.email },
      {
        code: voucher.code,
        type: voucher.type,
        discountPercent: voucher.discountPercent,
        expiresAt: voucher.expiresAt,
        bookUrl: `${getAppBaseUrl()}/book`,
      },
    );
  }

  return voucher;
}

function ukCalendarYear(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_TIMEZONE,
      year: "numeric",
    }).format(date),
  );
}

function ukMonthAndDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  return {
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

export async function issueBirthdayVouchersForToday(today = new Date()) {
  const { birthdayEnabled, birthdayDiscountPercent, birthdayValidDays } =
    await getRewardCampaignSettings();
  if (!birthdayEnabled) {
    return { issued: 0, checked: 0, skipped: true as const };
  }

  const todayUk = ukMonthAndDay(today);
  const year = ukCalendarYear(today);
  const yearStart = new Date(Date.UTC(year, 0, 1));

  const users = await db.user.findMany({
    where: {
      dateOfBirth: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      dateOfBirth: true,
    },
  });

  const birthdayUsers = users.filter((user) => {
    if (!user.dateOfBirth) return false;
    const born = ukMonthAndDay(user.dateOfBirth);
    return born.month === todayUk.month && born.day === todayUk.day;
  });

  let issued = 0;

  for (const user of birthdayUsers) {
    const existing = await db.voucher.findFirst({
      where: {
        userId: user.id,
        type: VOUCHER_TYPE.birthday,
        createdAt: { gte: yearStart },
      },
    });

    if (existing) continue;

    await createVoucherForUser(user.id, VOUCHER_TYPE.birthday, {
      discountPercent: birthdayDiscountPercent,
      validDays: birthdayValidDays,
      metadata: { year },
    });
    issued += 1;
  }

  return { issued, checked: birthdayUsers.length };
}

export async function recordAttendanceAndAwardMilestones(
  userId: string,
  bookingId: string,
) {
  const { milestoneEnabled, milestoneSteps } = await getRewardCampaignSettings();

  return db.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, userId: true, attendance: true },
    });

    if (!existing) {
      throw new Error("Booking not found.");
    }

    // Already marked attended — do not double-count classes or re-issue milestones.
    if (existing.attendance === "attended") {
      return { milestonesAwarded: [] as number[] };
    }

    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { attendance: "attended" },
      select: { id: true, userId: true },
    });

    if (!booking.userId) {
      return { milestonesAwarded: [] as number[] };
    }

    const user = await tx.user.update({
      where: { id: booking.userId },
      data: {
        totalClassesAttended: { increment: 1 },
        lastClassAttendedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalClassesAttended: true,
        milestonesAwarded: true,
      },
    });

    const alreadyAwarded = parseMilestonesAwarded(user.milestonesAwarded);
    const newlyAwarded: number[] = [];

    for (const step of milestoneSteps) {
      const threshold = step.classes;
      if (!milestoneEnabled) break;
      if (user.totalClassesAttended < threshold) continue;
      if (alreadyAwarded.includes(threshold)) continue;

      const type = milestoneVoucherType(threshold);
      const code = generateVoucherCode(`M${threshold}`);
      await tx.voucher.create({
        data: {
          code,
          userId: user.id,
          type,
          discountPercent: step.discountPercent,
          expiresAt: voucherExpiry(step.validDays),
          metadata: { milestone: threshold },
        },
      });

      newlyAwarded.push(threshold);
    }

    if (newlyAwarded.length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          milestonesAwarded: [...alreadyAwarded, ...newlyAwarded],
        },
      });

      for (const milestone of newlyAwarded) {
        const voucher = await tx.voucher.findFirst({
          where: {
            userId: user.id,
            type: milestoneVoucherType(milestone),
          },
          orderBy: { createdAt: "desc" },
        });

        if (voucher) {
          await sendVoucherEmail(
            { name: user.name, email: user.email },
            {
              code: voucher.code,
              type: voucher.type,
              discountPercent: voucher.discountPercent,
              expiresAt: voucher.expiresAt,
              bookUrl: `${getAppBaseUrl()}/book`,
              milestone,
            },
          );
        }
      }
    }

    return { milestonesAwarded: newlyAwarded, totalAttended: user.totalClassesAttended };
  });
}

/** Discount amount in pence for a percentage reward voucher. */
export function voucherDiscountPence(pricePence: number, discountPercent: number) {
  const clamped = Math.min(100, Math.max(0, Math.trunc(discountPercent)));
  if (pricePence <= 0 || clamped <= 0) return 0;
  return Math.min(pricePence, Math.round((pricePence * clamped) / 100));
}

export function amountDueAfterVoucherPence(
  pricePence: number,
  discountPercent: number,
) {
  return Math.max(0, pricePence - voucherDiscountPence(pricePence, discountPercent));
}

export async function redeemVoucherForBooking(
  userId: string,
  code: string,
  bookingId: string,
) {
  return db.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!voucher || voucher.usedAt) {
      throw new Error("This voucher code is invalid or has already been used.");
    }

    if (voucher.expiresAt < new Date()) {
      throw new Error("This voucher has expired.");
    }

    if (voucher.userId && voucher.userId !== userId) {
      throw new Error("This voucher is linked to another account.");
    }

    await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        usedAt: new Date(),
        bookingId,
        userId: voucher.userId ?? userId,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        voucherId: voucher.id,
      },
    });

    return voucher;
  });
}

/**
 * Undo a reward-voucher hold when checkout fails or unpaid payment expires,
 * so the member can use the code again.
 */
export async function releaseVoucherFromBooking(bookingId: string) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, voucherId: true, status: true },
    });

    if (!booking?.voucherId) {
      return null;
    }

    const voucher = await tx.voucher.findUnique({
      where: { id: booking.voucherId },
    });

    if (!voucher || voucher.bookingId !== bookingId) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { voucherId: null },
      });
      return null;
    }

    await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        usedAt: null,
        bookingId: null,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { voucherId: null },
    });

    return voucher;
  });
}

export async function createReengagementVoucher(
  userId: string,
  options?: { discountPercent?: number },
) {
  return createVoucherForUser(userId, VOUCHER_TYPE.reengagement, {
    discountPercent: options?.discountPercent ?? 20,
    validDays: REENGAGEMENT_VOUCHER_VALID_DAYS,
    metadata: { incentive: "we_missed_you" },
    sendEmail: false,
  });
}
