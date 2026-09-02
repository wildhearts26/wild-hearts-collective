import { isStripeSecretConfigured } from "@/lib/stripe-env";

export const BOOKING_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const WAITLIST_STATUS = {
  waiting: "waiting",
  notified: "notified",
  booked: "booked",
  cancelled: "cancelled",
} as const;

export type WaitlistStatus = (typeof WAITLIST_STATUS)[keyof typeof WAITLIST_STATUS];

/** Full class price charged in advance (pence) — env fallback only. Prefer resolveClassPaymentAmountPence(). */
export function getEnvClassPaymentAmountPence() {
  const raw =
    process.env.STRIPE_CLASS_AMOUNT ?? process.env.STRIPE_DEPOSIT_AMOUNT;
  const parsed = raw ? Number.parseInt(raw, 10) : 1000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

/** @deprecated Prefer resolveClassPaymentAmountPence from studio-pricing-service. */
export function getClassPaymentAmountPence() {
  return getEnvClassPaymentAmountPence();
}

/** @deprecated Use getClassPaymentAmountPence — classes are paid in full in advance. */
export function getDepositAmountPence() {
  return getEnvClassPaymentAmountPence();
}

export function formatMoneyFromPence(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

/** Canonical public site — Stripe redirects, emails, and OAuth callbacks. */
export const LIVE_SITE_URL = "https://www.wildheartscollective.org";

function hostnameOf(url: string) {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname;
  } catch {
    return "";
  }
}

function normalizeAppBaseUrl(url: string) {
  const clean = url.replace(/\/$/, "");
  const host = hostnameOf(clean);
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")) {
    return LIVE_SITE_URL;
  }
  return clean;
}

export function getAppBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();

  if (configured) {
    return normalizeAppBaseUrl(configured);
  }

  if (process.env.VERCEL_ENV === "production") {
    return LIVE_SITE_URL;
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return normalizeAppBaseUrl(`https://${vercelProduction.replace(/\/$/, "")}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export const UK_TIMEZONE = "Europe/London";

export function getStudioEmail() {
  return process.env.STUDIO_EMAIL?.trim() || "hello@wildheartscollective.org";
}

/** Optional extra copy of studio notifications (comma-separated in env). */
const DEFAULT_STUDIO_EMAIL_CC = "wildhearts790@gmail.com";

/** Extra recipients for admin/studio notification emails (comma-separated). */
export function getStudioEmailCopies() {
  const raw = process.env.STUDIO_EMAIL_CC;
  const value = (raw === undefined ? DEFAULT_STUDIO_EMAIL_CC : raw).trim();
  if (!value) return [];

  const primary = getStudioEmail().toLowerCase();
  return [
    ...new Set(
      value
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email && email.toLowerCase() !== primary),
    ),
  ];
}

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function ukLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: UK_TIMEZONE,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      })
        .formatToParts(new Date(utcMs))
        .map((part) => [part.type, part.value]),
    ) as Record<string, string>;

    const shown = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMs += desired - shown;
  }

  return new Date(utcMs);
}

export function isStripeConfigured() {
  return isStripeSecretConfigured();
}

export function formatSessionDateTime(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateTimeShort(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateShort(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatUkDateLong(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: UK_TIMEZONE,
  }).format(toDate(value));
}

export function formatSessionDateParts(startsAt: string | Date) {
  const date = toDate(startsAt);

  return {
    weekday: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      timeZone: UK_TIMEZONE,
    }).format(date),
    shortDate: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: UK_TIMEZONE,
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: UK_TIMEZONE,
    }).format(date),
  };
}
