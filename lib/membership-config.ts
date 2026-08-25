import { formatMoneyFromPence } from "@/lib/booking-config";

export const MEMBERSHIP_PLAN = {
  account: "account",
  monthly: "monthly",
} as const;

export const MEMBERSHIP_STATUS = {
  active: "active",
  paused: "paused",
  inactive: "inactive",
  cancelled: "cancelled",
  expired: "expired",
} as const;

export function getEnvMonthlyMembershipPricePence() {
  const raw = process.env.STRIPE_MEMBERSHIP_PRICE ?? "4500";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4500;
}

/** @deprecated Prefer resolveMonthlyMembershipPricePence from studio-pricing-service. */
export function getMonthlyMembershipPricePence() {
  return getEnvMonthlyMembershipPricePence();
}

export function monthlyMembershipLabel(pricePence = getEnvMonthlyMembershipPricePence()) {
  return formatMoneyFromPence(pricePence);
}

export function buildMembershipPlans() {
  return [
    {
      id: MEMBERSHIP_PLAN.account,
      name: "Studio Member",
      price: "Free",
      priceNote: "Create your account",
      description:
        "Your personal Wild Hearts account — book classes, track bookings, and manage your details in one place.",
      features: [
        "Book classes online with secure full payment in advance",
        "View upcoming and past bookings",
        "Join waitlists when sessions are full",
        "Update your profile anytime",
      ],
      cta: "Create free account",
      href: "/register",
      highlighted: false,
    },
  ] as const;
}

export const membershipPlans = buildMembershipPlans();

export function membershipPlanLabel(plan: string) {
  if (plan === MEMBERSHIP_PLAN.monthly) return "Monthly Membership";
  return "Studio Member";
}

export function membershipStatusLabel(status: string) {
  switch (status) {
    case MEMBERSHIP_STATUS.active:
      return "Active";
    case MEMBERSHIP_STATUS.paused:
      return "Paused";
    case MEMBERSHIP_STATUS.cancelled:
      return "Cancelled";
    case MEMBERSHIP_STATUS.expired:
      return "Expired";
    default:
      return "Inactive";
  }
}

export function membershipStatusTone(status: string) {
  switch (status) {
    case MEMBERSHIP_STATUS.active:
      return "bg-sage-light text-plum";
    case MEMBERSHIP_STATUS.paused:
      return "bg-pink-soft text-brand";
    case MEMBERSHIP_STATUS.cancelled:
    case MEMBERSHIP_STATUS.expired:
      return "bg-sage/10 text-plum";
    default:
      return "bg-pink-soft text-brand";
  }
}
