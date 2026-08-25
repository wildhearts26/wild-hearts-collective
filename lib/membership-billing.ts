import { formatMoneyFromPence, isStripeConfigured } from "@/lib/booking-config";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { getSubscriptionPeriodEnd, syncMembershipFromStripeSubscription } from "@/lib/membership-stripe";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import { getStripePublishableKey } from "@/lib/stripe-env";

export type BillingPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type BillingInvoice = {
  id: string;
  number: string | null;
  amount: string;
  status: string;
  created: string;
  pdfUrl: string | null;
};

export type MemberBillingSummary = {
  configured: boolean;
  publishableKey: string;
  paymentMethods: BillingPaymentMethod[];
  invoices: BillingInvoice[];
  canSubscribe: boolean;
  hasActiveMembership: boolean;
  membershipPriceLabel: string;
};

function getPublishableKey() {
  return getStripePublishableKey();
}

export async function getOrCreateMembershipPriceId(): Promise<string> {
  throw new Error("Monthly membership is no longer offered.");
}

export async function getMemberBillingSummary(userId: string): Promise<MemberBillingSummary> {
  const publishableKey = getPublishableKey();
  const configured = isStripeConfigured() && Boolean(publishableKey);
  const membershipPriceLabel = "";

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      membershipPlan: true,
      membershipStatus: true,
    },
  });

  if (!user || !configured || !user.stripeCustomerId) {
    return {
      configured,
      publishableKey,
      paymentMethods: [],
      invoices: [],
      canSubscribe: false,
      hasActiveMembership:
        user?.membershipPlan === MEMBERSHIP_PLAN.monthly &&
        user?.membershipStatus === MEMBERSHIP_STATUS.active,
      membershipPriceLabel,
    };
  }

  const stripe = getStripeClient();
  const [paymentMethods, invoices, customer] = await Promise.all([
    stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" }),
    stripe.invoices.list({ customer: user.stripeCustomerId, limit: 12 }),
    stripe.customers.retrieve(user.stripeCustomerId),
  ]);

  const defaultPaymentMethodId =
    typeof customer !== "string" && !customer.deleted
      ? ((customer.invoice_settings?.default_payment_method as string | null) ??
        (typeof customer.default_source === "string" ? customer.default_source : null))
      : null;

  return {
    configured,
    publishableKey,
    paymentMethods: paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand ?? "card",
      last4: method.card?.last4 ?? "••••",
      expMonth: method.card?.exp_month ?? 0,
      expYear: method.card?.exp_year ?? 0,
      isDefault: method.id === defaultPaymentMethodId,
    })),
    invoices: invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: formatMoneyFromPence(invoice.amount_paid || invoice.amount_due || 0),
      status: invoice.status ?? "draft",
      created: new Date(invoice.created * 1000).toISOString(),
      pdfUrl: invoice.invoice_pdf ?? null,
    })),
    canSubscribe: false,
    hasActiveMembership:
      user.membershipPlan === MEMBERSHIP_PLAN.monthly &&
      user.membershipStatus === MEMBERSHIP_STATUS.active,
    membershipPriceLabel,
  };
}

export async function createMemberSetupIntent(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) throw new Error("Account not found.");

  const customerId = await getOrCreateStripeCustomer(user);
  const stripe = getStripeClient();

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    usage: "off_session",
  });

  if (!setupIntent.client_secret) {
    throw new Error("Unable to start payment method setup.");
  }

  return { clientSecret: setupIntent.client_secret };
}

export async function createMemberSubscriptionIntent(_userId: string) {
  throw new Error("Monthly membership is no longer offered.");
}

export async function syncMemberSubscription(userId: string, subscriptionId: string) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
  });

  if (subscription.metadata.userId && subscription.metadata.userId !== userId) {
    throw new Error("Subscription does not belong to this account.");
  }

  await syncMembershipFromStripeSubscription(userId, subscription);

  return {
    status: subscription.status,
    renewsAt: getSubscriptionPeriodEnd(subscription),
  };
}

export async function removeMemberPaymentMethod(userId: string, paymentMethodId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No billing profile found.");
  }

  const stripe = getStripeClient();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (paymentMethod.customer !== user.stripeCustomerId) {
    throw new Error("Payment method not found.");
  }

  await stripe.paymentMethods.detach(paymentMethodId);
}

export async function setMemberDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No billing profile found.");
  }

  const stripe = getStripeClient();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (paymentMethod.customer !== user.stripeCustomerId) {
    throw new Error("Payment method not found.");
  }

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}
