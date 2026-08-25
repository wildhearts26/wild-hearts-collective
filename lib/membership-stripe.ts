import type Stripe from "stripe";
import { db } from "@/lib/db";
import { sendMembershipWelcomeEmails } from "@/lib/email";
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
} from "@/lib/membership-config";
import { getStripeClient } from "@/lib/stripe";

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  return item?.current_period_end ?? null;
}

export async function getOrCreateStripeCustomer(user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await db.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createMembershipCheckoutSession(_user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}) {
  throw new Error("Monthly membership is no longer offered.");
}

export async function activateMembershipFromSubscription(
  userId: string,
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd?: number | null;
  },
) {
  const active = subscription.status === "active" || subscription.status === "trialing";
  const renewsAt = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd * 1000)
    : null;

  const prior = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      membershipStartedAt: true,
    },
  });

  if (!prior) {
    return;
  }

  if (!active) {
    await db.user.update({
      where: { id: userId },
      data: {
        membershipPlan: MEMBERSHIP_PLAN.monthly,
        membershipStatus: MEMBERSHIP_STATUS.inactive,
        stripeSubscriptionId: subscription.id,
        membershipRenewsAt: renewsAt,
      },
    });
    return;
  }

  // Atomically claim the inactive → active transition so webhook + client sync
  // cannot both send a welcome email.
  const transitioned = await db.user.updateMany({
    where: {
      id: userId,
      OR: [
        { membershipPlan: { not: MEMBERSHIP_PLAN.monthly } },
        { membershipStatus: { not: MEMBERSHIP_STATUS.active } },
      ],
    },
    data: {
      membershipPlan: MEMBERSHIP_PLAN.monthly,
      membershipStatus: MEMBERSHIP_STATUS.active,
      stripeSubscriptionId: subscription.id,
      membershipRenewsAt: renewsAt,
      membershipStartedAt: prior.membershipStartedAt ?? new Date(),
    },
  });

  if (transitioned.count === 0) {
    await db.user.update({
      where: { id: userId },
      data: {
        membershipPlan: MEMBERSHIP_PLAN.monthly,
        membershipStatus: MEMBERSHIP_STATUS.active,
        stripeSubscriptionId: subscription.id,
        membershipRenewsAt: renewsAt,
      },
    });
    return;
  }

  try {
    await sendMembershipWelcomeEmails(
      { name: prior.name, email: prior.email },
      { renewsAt },
    );
  } catch (error) {
    console.error("[email:membership]", userId, error);
  }
}

export async function cancelMembershipFromSubscription(userId: string) {
  const prior = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, membershipStatus: true },
  });

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.cancelled,
      stripeSubscriptionId: null,
      membershipRenewsAt: null,
    },
  });

  if (
    prior &&
    prior.membershipStatus !== MEMBERSHIP_STATUS.cancelled
  ) {
    try {
      const { notifyAdminOfMembershipCancelled } = await import(
        "@/lib/member-notifications"
      );
      await notifyAdminOfMembershipCancelled({
        name: prior.name,
        email: prior.email,
        cancelledBy: "system",
        immediate: true,
        finalAccessDate: new Date(),
        reason: "Stripe subscription ended",
      });
    } catch (error) {
      console.error("[email:membership-cancel]", userId, error);
    }
  }

  return updated;
}

export async function syncMembershipFromStripeSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await cancelMembershipFromSubscription(userId);
    return;
  }

  await activateMembershipFromSubscription(userId, {
    id: subscription.id,
    status: subscription.status,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  });
}
