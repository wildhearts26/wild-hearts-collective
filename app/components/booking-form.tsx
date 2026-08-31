"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookingEmbeddedCheckout } from "@/app/components/booking-embedded-checkout";
import { MemberSwitcher } from "@/app/components/member-switcher";
import { CLASS_TYPE_OPTIONS } from "@/lib/admin-studio-config";
import { formatSessionDateParts } from "@/lib/booking-config";
import { BOOKING_TERMS_SCROLL_TEXT } from "@/lib/booking-terms";
import {
  formatCreditLabel,
  formatCredits,
  hasEnoughCredits,
} from "@/lib/credit-units";
import { isCourseClassSlug } from "@/lib/gift-redeem-scope";
import { siteConfig } from "@/lib/site-data";

type SessionOption = {
  id: string;
  classSlug: string;
  classTitle: string;
  tutor?: { id: string; name: string } | null;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  durationMinutes?: number;
  durationLabel?: string;
  spotsLeft: number;
  isFull: boolean;
  waitlistCount: number;
  alreadyBooked?: boolean;
  pricePence?: number;
  priceLabel?: string;
  creditCost?: number;
  creditCostLabel?: string;
  creditCostDisplay?: string;
  courseSeriesId?: string | null;
  courseWeek?: number | null;
  courseDates?: string[];
  isFourWeekCourse?: boolean;
  bookingDisabledReason?: string | null;
};

function sessionDisplayTitle(session: Pick<SessionOption, "classTitle" | "tutor">) {
  const tutorName = session.tutor?.name?.trim();
  return tutorName ? `${session.classTitle} with ${tutorName}` : session.classTitle;
}

type BookingConfig = {
  classPriceLabel?: string;
  coursePriceLabel?: string;
  depositLabel?: string;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  emailEnabled: boolean;
};

type BookingResult = {
  type: "booking" | "waitlist";
  id: string;
  name: string;
  email: string;
  classTitle: string;
  startsAt: string;
  status?: string;
  paymentSkipped?: boolean;
  paidWithCredit?: boolean;
  creditsCharged?: number;
  voucherApplied?: boolean;
  voucherAmountAppliedLabel?: string;
  giftCardApplied?: boolean;
  giftAmountAppliedLabel?: string;
  giftBalanceRemainingLabel?: string;
};

type PendingPayment = {
  clientSecret: string;
  booking: {
    id: string;
    name: string;
    email: string;
    classTitle: string;
    startsAt: string;
    classPriceLabel: string;
  };
  giftAmountAppliedLabel?: string;
  giftBalanceRemainingLabel?: string;
  voucherAmountAppliedLabel?: string;
};

type MemberProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  creditsRemaining?: number;
  parQCompleted?: boolean;
  isChild?: boolean;
  memberType?: string;
  parentalConsentComplete?: boolean;
  idDocumentUploaded?: boolean;
  idDocumentStatus?: string | null;
  household?: {
    id: string;
    name: string;
    memberType: string;
    isActive: boolean;
    image: string | null;
  }[];
};

type ContactDetails = {
  name: string;
  email: string;
  phone: string;
};

const classFilters = [
  { value: "all", label: "All classes" },
  ...CLASS_TYPE_OPTIONS.map((option) => ({
    value: option.slug,
    label: option.label,
  })),
] as const;

function availabilityLabel(session: Pick<SessionOption, "isFull" | "alreadyBooked" | "bookingDisabledReason">) {
  if (session.bookingDisabledReason) return "Course unavailable";
  if (session.alreadyBooked) return "Already booked";
  return session.isFull ? "Fully booked" : "Slots available";
}

function availabilityBadgeClass(
  session: Pick<SessionOption, "isFull" | "alreadyBooked" | "bookingDisabledReason">,
) {
  if (session.bookingDisabledReason) return "bg-plum/10 text-plum";
  if (session.alreadyBooked) return "bg-brand/15 text-brand";
  return session.isFull ? "bg-plum/10 text-plum" : "bg-sage/15 text-sage";
}

const bookingSteps = [
  { title: "Choose a session", detail: "Pick your class and time" },
  { title: "Enter your details", detail: "Name, email, telephone and optional notes" },
  { title: "Accept terms", detail: "Read and tick Terms & Conditions" },
  { title: "Pay in full online", detail: "Pay securely on this page" },
];

function formatSessionDate(startsAt: string) {
  return formatSessionDateParts(startsAt);
}

function fieldClassName() {
  return "mt-2 w-full rounded-lg border border-plum/12 bg-white px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25";
}

export function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmationRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [classFilter, setClassFilter] = useState(
    searchParams.get("class") ?? "all",
  );
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [contact, setContact] = useState<ContactDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [notes, setNotes] = useState("");
  const [useCredit, setUseCredit] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Keep filter in sync when arriving from the marketing timetable (?class=pole etc.).
  useEffect(() => {
    const fromUrl = searchParams.get("class") ?? "all";
    setClassFilter(fromUrl);
  }, [searchParams]);

  const cancelled = searchParams.get("cancelled") === "1";
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const isCourseBooking = isCourseClassSlug(selectedSession?.classSlug);
  const sessionCreditCost = selectedSession?.creditCost ?? 0;
  const sessionCreditLabel =
    selectedSession?.creditCostLabel ?? formatCreditLabel(sessionCreditCost);
  const memberCredits = member?.creditsRemaining ?? 0;
  const canPayWithCredit =
    Boolean(member) &&
    Boolean(selectedSession) &&
    sessionCreditCost > 0 &&
    hasEnoughCredits(memberCredits, sessionCreditCost) &&
    !selectedSession?.isFull &&
    !joinWaitlist &&
    !isCourseBooking;
  // Show £0.00 until a session is chosen — prices vary by class/session.
  const priceNote = selectedSession
    ? selectedSession.priceLabel ??
      (isCourseBooking
        ? config?.coursePriceLabel
        : config?.classPriceLabel ?? config?.depositLabel) ??
      "£0.00"
    : "£0.00";
  const hasSelectableSession = sessions.some(
    (session) =>
      !session.alreadyBooked && !session.bookingDisabledReason && (!session.isFull || joinWaitlist),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMember() {
      try {
        const response = await fetch("/api/members/me");
        if (!response.ok) {
          if (!cancelled) setMemberLoaded(true);
          return;
        }

        const data = (await response.json()) as { user: MemberProfile | null };
        if (cancelled) return;

        if (!data.user) {
          setMember(null);
          setMemberLoaded(true);
          return;
        }

        setMember(data.user);
        setContact({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone ?? "",
        });
        setMemberLoaded(true);
      } catch {
        // Keep any existing signed-in state if a refresh fails.
        if (!cancelled) setMemberLoaded(true);
      }
    }

    loadMember();

    function refreshOnFocus() {
      if (document.visibilityState === "hidden") return;
      loadMember();
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  useEffect(() => {
    async function loadConfig() {
      const response = await fetch("/api/bookings/config");
      if (response.ok) {
        setConfig((await response.json()) as BookingConfig);
      }
    }

    loadConfig();
  }, []);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError("");
      try {
        const query = classFilter === "all" ? "" : `?class=${classFilter}`;
        const response = await fetch(`/api/sessions${query}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Could not load sessions.");
        }
        const data = (await response.json()) as SessionOption[];
        setSessions(data);
        const sessionFromUrl = searchParams.get("session");
        setSelectedSessionId((current) => {
          if (
            sessionFromUrl &&
            data.some(
              (session) =>
                session.id === sessionFromUrl &&
                !session.alreadyBooked &&
                !session.bookingDisabledReason,
            )
          ) {
            return sessionFromUrl;
          }
          if (
            current &&
            data.some(
              (session) =>
                session.id === current &&
                !session.alreadyBooked &&
                !session.bookingDisabledReason,
            )
          ) {
            return current;
          }
          // Keep amount due at £0.00 until the guest explicitly selects a session.
          return "";
        });
      } catch {
        setError("Unable to load available sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [classFilter, searchParams]);

  useEffect(() => {
    setJoinWaitlist(Boolean(selectedSession?.isFull));
  }, [selectedSession?.id, selectedSession?.isFull]);

  useEffect(() => {
    if (isCourseBooking && useCredit) {
      setUseCredit(false);
    }
  }, [isCourseBooking, useCredit]);

  useEffect(() => {
    if (useCredit && !canPayWithCredit) {
      setUseCredit(false);
    }
  }, [useCredit, canPayWithCredit]);

  // After booking success (or payment step), confirmation sits at the top but
  // mobile browsers often keep the previous scroll position near the submit button.
  useEffect(() => {
    if (!result && !pendingPayment) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    confirmationRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [result, pendingPayment]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/members/logout", { method: "POST" });
      setMember(null);
      setContact({ name: "", email: "", phone: "" });
      setUseCredit(false);
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const trimmedName = contact.name.trim();
    const trimmedEmail = contact.email.trim();
    const trimmedPhone = contact.phone.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Name and email are required.");
      setSubmitting(false);
      return;
    }

    if (!trimmedPhone) {
      setError("Telephone number is required.");
      setSubmitting(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Please read and accept the Terms & Conditions to continue.");
      setSubmitting(false);
      return;
    }

    if (selectedSession?.alreadyBooked) {
      setError("You have already booked this session.");
      setSubmitting(false);
      return;
    }

    if (selectedSession?.bookingDisabledReason) {
      setError(selectedSession.bookingDisabledReason);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          notes: trimmedNotes || undefined,
          joinWaitlist: selectedSession?.isFull || joinWaitlist,
          useCredit: useCredit && Boolean(member) && !isCourseBooking,
          voucherCode: voucherCode.trim() || undefined,
          acceptedTerms: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.parQRequired) {
          throw new Error(
            `${data.error} Complete your PAR-Q form at /account/parq before booking.`,
          );
        }
        if (data.parentalConsentRequired) {
          throw new Error(
            `${data.error} Open Family members in your account to complete consent and ID.`,
          );
        }
        throw new Error(data.error || "Booking failed.");
      }

      if (data.type === "booking" && data.clientSecret) {
        setPendingPayment({
          clientSecret: data.clientSecret,
          booking: {
            id: data.id,
            name: data.name,
            email: data.email,
            classTitle: data.classTitle,
            startsAt: data.startsAt,
            classPriceLabel: data.classPriceLabel ?? data.depositLabel ?? priceNote,
          },
          giftAmountAppliedLabel: data.giftAmountAppliedLabel,
          giftBalanceRemainingLabel: data.giftBalanceRemainingLabel,
          voucherAmountAppliedLabel: data.voucherAmountAppliedLabel,
        });
        return;
      }

      setResult(data as BookingResult);
      setNotes("");
      setVoucherCode("");
      setUseCredit(false);
      setAcceptedTerms(false);
      if (member) {
        const savedPhone = trimmedPhone;
        setMember((current) =>
          current ? { ...current, phone: savedPhone } : current,
        );
        setContact((current) => ({ ...current, phone: savedPhone }));
      } else {
        setContact({ name: "", email: "", phone: "" });
      }
      setSelectedSessionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingPayment) {
    const date = formatSessionDate(pendingPayment.booking.startsAt);

    return (
      <div
        ref={confirmationRef}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"
      >
        <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5">
          <div className="border-b border-plum/8 bg-gradient-to-r from-pink-soft/50 to-surface px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Step 3 of 3
            </p>
            <h2 className="mt-2 font-display text-3xl text-plum sm:text-4xl">
              Pay for your class
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {pendingPayment.giftAmountAppliedLabel
                ? `Your gift card covered ${pendingPayment.giftAmountAppliedLabel}. Complete the remaining payment below within 10 minutes to secure your place.`
                : pendingPayment.voucherAmountAppliedLabel
                  ? `Your reward voucher applied ${pendingPayment.voucherAmountAppliedLabel}. Complete the remaining payment below within 10 minutes to secure your place.`
                  : "Complete payment below within 10 minutes to secure your place. The lesson will be cancelled without notice if payment is not completed in time."}
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className="rounded-xl border border-plum/10 bg-pink-soft/40 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Your booking
              </p>
              <p className="mt-2 font-semibold text-plum">{pendingPayment.booking.classTitle}</p>
              <p className="mt-1 text-sm text-muted">
                {date.weekday}, {date.shortDate} · {date.time}
              </p>
              {pendingPayment.giftAmountAppliedLabel && (
                <p className="mt-2 text-sm text-muted">
                  Gift card applied:{" "}
                  <strong className="text-foreground">
                    {pendingPayment.giftAmountAppliedLabel}
                  </strong>
                  {pendingPayment.giftBalanceRemainingLabel
                    ? ` · ${pendingPayment.giftBalanceRemainingLabel} left on code`
                    : null}
                </p>
              )}
              {pendingPayment.voucherAmountAppliedLabel && (
                <p className="mt-2 text-sm text-muted">
                  Reward voucher applied:{" "}
                  <strong className="text-foreground">
                    {pendingPayment.voucherAmountAppliedLabel}
                  </strong>
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                Amount due now:{" "}
                <strong className="text-foreground">{pendingPayment.booking.classPriceLabel}</strong>
              </p>
            </div>

            <BookingEmbeddedCheckout
              clientSecret={pendingPayment.clientSecret}
              publishableKey={config?.stripePublishableKey ?? ""}
            />

            {error && (
              <p
                className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setPendingPayment(null);
                setError("");
              }}
              className="rounded-lg border border-plum/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:bg-pink-soft"
            >
              Back to booking details
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm ring-1 ring-plum/5">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
              Secure payment
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Cards, Apple Pay, Google Pay, and other methods appear automatically. We never
              store your full card details.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  if (result) {
    const date = formatSessionDate(result.startsAt);
    const isWaitlist = result.type === "waitlist";
    const isPaidWithoutCard =
      Boolean(result.paidWithCredit) ||
      Boolean(result.voucherApplied) ||
      Boolean(result.giftCardApplied) ||
      Boolean(result.paymentSkipped) ||
      result.status === "confirmed";

    let statusMessage = `Complete payment within 10 minutes. The lesson will be cancelled without notice if unpaid. We will email ${result.email} once payment is complete.`;

    if (isWaitlist) {
      statusMessage = `We have recorded ${result.email} on the waitlist.`;
    } else if (result.paidWithCredit) {
      const charged =
        result.creditsCharged != null
          ? formatCreditLabel(result.creditsCharged)
          : "class credits";
      statusMessage = `Your booking is confirmed — paid with ${charged}. A confirmation email has been sent to ${result.email}.`;
    } else if (result.giftCardApplied) {
      const applied = result.giftAmountAppliedLabel
        ? ` (${result.giftAmountAppliedLabel} applied)`
        : "";
      const remaining = result.giftBalanceRemainingLabel
        ? ` Remaining gift card balance: ${result.giftBalanceRemainingLabel}.`
        : "";
      statusMessage = `Your booking is confirmed — paid with your gift card${applied}.${remaining} A confirmation email has been sent to ${result.email}.`;
    } else if (result.voucherApplied) {
      statusMessage = result.voucherAmountAppliedLabel
        ? `Your booking is confirmed — your reward voucher covered this class (${result.voucherAmountAppliedLabel}). A confirmation email has been sent to ${result.email}.`
        : `Your booking is confirmed — your reward voucher covered this class. A confirmation email has been sent to ${result.email}.`;
    } else if (result.paymentSkipped || result.status === "confirmed") {
      statusMessage = `Your booking is confirmed. A confirmation email has been sent to ${result.email}.`;
    }

    return (
      <div
        ref={confirmationRef}
        className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5"
      >
        <div className="bg-gradient-to-r from-sage to-sage/80 px-8 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-light">
            {isWaitlist ? "Waitlist" : "Success"}
          </p>
          <h2 className="mt-2 font-display text-4xl">
            {isWaitlist
              ? "You are on the waitlist"
              : isPaidWithoutCard
                ? "Booking confirmed"
                : "Thank you for booking"}
          </h2>
        </div>
        <div className="space-y-4 px-8 py-8">
          <p className="text-base leading-relaxed text-muted">
            {isWaitlist ? (
              <>
                Hi {result.name}, we have added you to the waitlist for{" "}
                <strong className="text-foreground">{result.classTitle}</strong> on{" "}
                {date.weekday} {date.shortDate} at {date.time}. We will email you if
                a place opens up.
              </>
            ) : (
              <>
                Hi {result.name}, your booking for{" "}
                <strong className="text-foreground">{result.classTitle}</strong> on{" "}
                {date.weekday} {date.shortDate} at {date.time}{" "}
                {isPaidWithoutCard ? "is confirmed." : "has been received."}
              </>
            )}
          </p>
          <p className="rounded-lg bg-pink-soft/80 px-4 py-3 text-sm leading-relaxed text-plum">
            {statusMessage}
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-lg bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              {isWaitlist ? "Join another waitlist" : "Book another class"}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-plum/15 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-plum transition hover:bg-pink-soft"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedDate = selectedSession
    ? formatSessionDate(selectedSession.startsAt)
    : null;
  const isSignedIn = Boolean(member);
  const visibleSteps = isSignedIn
    ? [
        bookingSteps[0],
        { title: "Confirm your details", detail: "Using your member profile" },
        bookingSteps[2],
        bookingSteps[3],
      ]
    : bookingSteps;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5"
      >
        <div className="border-b border-plum/8 bg-gradient-to-r from-pink-soft/50 to-surface px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Book online
          </p>
          <h2 className="mt-2 font-display text-3xl text-plum sm:text-4xl">
            Reserve your class
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {siteConfig.bookingNote} {siteConfig.durationNote} Typical weekly
            drop-ins start from{" "}
            {config?.classPriceLabel ?? config?.depositLabel ?? "£12.50"}; 4-week
            courses from {config?.coursePriceLabel ?? "£30.00"} — the exact amount
            due updates when you select a session. Pay online to secure your place
            — quick, secure, and confirmed by email.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-8">
          {cancelled && (
            <p
              className="rounded-lg border border-pink/30 bg-pink-light px-4 py-3 text-sm text-plum"
              role="status"
            >
              Payment was cancelled. Your spot is held for 10 minutes — choose your
              session again and complete payment below. The lesson will be cancelled
              without notice if payment is not completed in time.
            </p>
          )}

          <section aria-labelledby="booking-step-1">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-white">
                1
              </span>
              <div>
                <h3 id="booking-step-1" className="text-lg font-semibold text-plum">
                  Choose your class
                </h3>
                <p className="text-sm text-muted">Filter by type, then select a session.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {classFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setClassFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    classFilter === filter.value
                      ? "bg-sage text-white shadow-sm"
                      : "bg-pink-soft text-plum hover:bg-pink-light"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1 sm:max-h-[36rem]">
              {loading && (
                <p className="rounded-lg border border-dashed border-plum/15 px-4 py-8 text-center text-sm text-muted">
                  Loading sessions…
                </p>
              )}
              {!loading && sessions.length === 0 && (
                <p className="rounded-lg border border-dashed border-plum/15 px-4 py-8 text-center text-sm text-muted">
                  No bookable sessions are scheduled right now. The homepage
                  timetable is a weekly guide — live dates for online booking are
                  set under Admin → Schedule. Please check back soon or{" "}
                  <Link href="/contact" className="font-medium text-plum underline-offset-2 hover:underline">
                    contact us
                  </Link>
                  .
                </p>
              )}
              {!loading &&
                sessions.map((session) => {
                  const date = formatSessionDate(session.startsAt);
                  const isSelected = selectedSessionId === session.id;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        if (session.alreadyBooked || session.bookingDisabledReason) return;
                        setSelectedSessionId(session.id);
                      }}
                      disabled={session.alreadyBooked || Boolean(session.bookingDisabledReason)}
                      className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-4 text-left transition ${
                        session.alreadyBooked || session.bookingDisabledReason
                          ? "cursor-not-allowed border-plum/10 bg-cream/60 opacity-80"
                          : isSelected
                            ? "border-plum bg-pink-soft/60 ring-2 ring-pink/40"
                            : "border-plum/10 bg-white hover:border-pink/40 hover:bg-pink-soft/30"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-plum">
                          {sessionDisplayTitle(session)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {date.weekday}, {date.shortDate}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {date.time}
                          {session.durationLabel ? ` · ${session.durationLabel}` : ""}
                        </p>
                        {session.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted">
                            {session.description}
                          </p>
                        ) : null}
                        {session.bookingDisabledReason ? (
                          <p className="mt-2 text-sm font-medium text-plum">
                            {session.bookingDisabledReason}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted">
                          {session.priceLabel ?? "Price on request"}
                          {session.creditCost != null && session.creditCost !== 1
                            ? ` · ${session.creditCostDisplay ?? formatCredits(session.creditCost)} credits`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${availabilityBadgeClass(session)}`}
                      >
                        {availabilityLabel(session)}
                      </span>
                    </button>
                  );
                })}
            </div>

            <input type="hidden" name="sessionId" value={selectedSessionId} required />

            {selectedSession?.isFull && !selectedSession.alreadyBooked && (
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-plum/10 bg-pink-soft/50 px-4 py-4 text-sm text-plum">
                <input
                  type="checkbox"
                  checked={joinWaitlist}
                  onChange={(event) => setJoinWaitlist(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  <strong className="font-semibold">Waiting list</strong> — this
                  session is fully booked. Join the waiting list and we will email
                  you if a place becomes available.
                </span>
              </label>
            )}

            {isCourseBooking && !selectedSession?.isFull && (
              <p className="mt-4 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-plum">
                This is a fixed 4-week course. Payment covers the full block from the
                start date; you are enrolled for all four weekly sessions. Missed weeks
                cannot be transferred. Use a 4-week course voucher here, or pay{" "}
                {priceNote} online.
                {selectedSession.courseDates && selectedSession.courseDates.length > 1 ? (
                  <>
                    <br />
                    <span className="mt-2 block text-muted">
                      Dates:{" "}
                      {selectedSession.courseDates
                        .map((iso) => formatSessionDate(iso).shortDate)
                        .join(" · ")}
                    </span>
                  </>
                ) : null}
              </p>
            )}
          </section>

          <section aria-labelledby="booking-step-2">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-white">
                2
              </span>
              <div>
                <h3 id="booking-step-2" className="text-lg font-semibold text-plum">
                  {isSignedIn ? "Your member details" : "Your details"}
                </h3>
                <p className="text-sm text-muted">
                  {isSignedIn
                    ? "We will use the details from your signed-in account."
                    : "We will use these to confirm your booking by email."}
                </p>
              </div>
            </div>

            {member ? (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-plum/10 bg-gradient-to-br from-pink-soft/50 to-white px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                        {member.isChild ? "Booking as child member" : "Signed in as"}
                      </p>
                      <p className="mt-2 font-semibold text-plum">{member.name}</p>
                      <p className="mt-1 text-sm text-muted">{member.email}</p>
                      {member.phone && (
                        <p className="mt-1 text-sm text-muted">{member.phone}</p>
                      )}
                      {member.household && member.household.length > 1 ? (
                        <div className="mt-4 max-w-sm">
                          <MemberSwitcher members={member.household} compact />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Link
                        href="/account/profile"
                        className="text-sm font-semibold text-brand hover:underline"
                      >
                        Edit profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="text-sm font-semibold text-brand hover:underline disabled:opacity-60"
                      >
                        {loggingOut ? "Signing out…" : "Logout"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-plum/10 bg-surface px-5 py-5 shadow-sm">
                  <label htmlFor="member-phone" className="text-sm font-medium text-foreground">
                    Telephone <span className="text-brand">*</span>
                  </label>
                  <input
                    id="member-phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, phone: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                  {!member.phone ? (
                    <p className="mt-2 text-xs text-muted">
                      Add your telephone number to complete your booking. It will be saved to your
                      profile for next time.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Saved on your profile. Update it here if it has changed.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-plum/10 bg-surface px-5 py-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                        PAR-Q health form
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        Required for pole, hoop, and silks bookings.
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        member.parQCompleted
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-brand/10 text-brand"
                      }`}
                    >
                      {member.parQCompleted ? "Complete" : "Required"}
                    </span>
                  </div>
                  {!member.parQCompleted ? (
                    <Link
                      href="/account/parq"
                      className="mt-4 inline-flex rounded-lg bg-sage px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
                    >
                      Complete PAR-Q now
                    </Link>
                  ) : (
                    <Link
                      href="/account/parq"
                      className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-plum hover:text-brand"
                    >
                      Update PAR-Q →
                    </Link>
                  )}
                </div>

                <div className="rounded-xl border border-plum/10 bg-surface px-5 py-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                        Class credits
                      </p>
                      <p className="mt-2 font-display text-4xl text-plum">
                        {formatCredits(member.creditsRemaining ?? 0)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {(member.creditsRemaining ?? 0) === 1 ? "credit" : "credits"} available
                      </p>
                    </div>
                    <Link
                      href="/account/credits"
                      className="rounded-lg border border-plum/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
                    >
                      Buy class packs
                    </Link>
                  </div>

                  {canPayWithCredit ? (
                    <label className="mt-5 flex items-start gap-3 rounded-lg border border-plum/10 bg-pink-soft/30 px-4 py-4 text-sm text-plum">
                      <input
                        type="checkbox"
                        checked={useCredit}
                        onChange={(event) => setUseCredit(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <strong className="block">
                          Pay instantly using your class credits
                        </strong>
                        Use {sessionCreditLabel} from your pack balance and skip the class fee.
                      </span>
                    </label>
                  ) : (
                    <p className="mt-4 rounded-lg bg-pink-soft/40 px-4 py-3 text-sm text-muted">
                      {isCourseBooking
                        ? "Class credits cannot be used for 4-week courses — pay the course fee or redeem a 4-week course voucher."
                        : memberCredits === 0
                          ? "No credits yet — purchase a class pack to book without paying the class fee each time."
                          : selectedSession &&
                              !hasEnoughCredits(memberCredits, sessionCreditCost)
                            ? `This class uses ${sessionCreditLabel}. You have ${formatCredits(memberCredits)}.`
                          : selectedSession?.isFull || joinWaitlist
                            ? "Credits cannot be used for waitlist entries."
                            : "Select an available session to use a credit."}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-plum/10 bg-surface px-5 py-5 shadow-sm">
                  <label htmlFor="voucherCode" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                    Gift card or reward code
                  </label>
                  <p className="mt-2 text-sm text-muted">
                    {isCourseBooking
                      ? "Enter a 4-week course voucher (GIFT-…) to cover this course. Standard studio gift cards also work toward the course fee."
                      : "Use a shop gift card (GIFT-…), or a birthday / milestone reward. Course vouchers only work on 4-week course bookings. Gift cards keep any leftover balance for next time."}
                  </p>
                  <input
                    id="voucherCode"
                    name="voucherCode"
                    type="text"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                    placeholder="e.g. GIFT-XXXXXXXX"
                    className={`${fieldClassName()} mt-3 uppercase tracking-wider`}
                    disabled={useCredit}
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notes <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="First time, injuries, access needs, etc."
                    className={fieldClassName()}
                  />
                </div>
              </div>
            ) : memberLoaded && !member ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 rounded-xl border border-plum/10 bg-pink-soft/30 px-4 py-4 text-sm text-muted">
                  <Link href="/login?next=/book" className="font-semibold text-brand hover:underline">
                    Sign in
                  </Link>{" "}
                  to use class credits, reward vouchers, and save your details for next time. Gift
                  card codes can be used without signing in.
                </div>
                <div className="sm:col-span-2 rounded-xl border border-plum/10 bg-surface px-5 py-5 shadow-sm">
                  <label
                    htmlFor="voucherCodeGuest"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-brand"
                  >
                    Gift card code
                  </label>
                  <p className="mt-2 text-sm text-muted">
                    Enter your GIFT-… code here. Any unused balance stays on the card after booking.
                  </p>
                  <input
                    id="voucherCodeGuest"
                    name="voucherCode"
                    type="text"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                    placeholder="e.g. GIFT-XXXXXXXX"
                    className={`${fieldClassName()} mt-3 uppercase tracking-wider`}
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-md">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full name <span className="text-brand">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={contact.name}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, name: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email <span className="text-brand">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={contact.email}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, email: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Telephone <span className="text-brand">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, phone: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notes <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="First time, injuries, access needs, etc."
                    className={fieldClassName()}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Loading your details…</p>
            )}
          </section>

          {selectedSession && selectedDate && (
            <div className="rounded-xl border border-plum/10 bg-pink-soft/40 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Your selection
              </p>
              <p className="mt-2 font-semibold text-plum">
                {sessionDisplayTitle(selectedSession)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {selectedDate.weekday}, {selectedDate.shortDate} · {selectedDate.time}
                {selectedSession.durationLabel
                  ? ` · ${selectedSession.durationLabel}`
                  : ""}
              </p>
              {selectedSession.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {selectedSession.description}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">{siteConfig.durationNote}</p>
              )}
              {!selectedSession.isFull && (
                <p className="mt-2 text-sm text-muted">
                  {useCredit && isSignedIn ? (
                    <>
                      Payment:{" "}
                      <strong className="text-foreground">{sessionCreditLabel}</strong>{" "}
                      (no card payment)
                    </>
                  ) : voucherCode.trim() ? (
                    <>
                      Payment:{" "}
                      <strong className="text-foreground">gift card / voucher</strong>
                      {" "}— leftover gift balance stays on the code
                    </>
                  ) : (
                    <>
                      Amount due today:{" "}
                      <strong className="text-foreground">{priceNote}</strong>
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          <section aria-labelledby="booking-terms">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-white">
                3
              </span>
              <div>
                <h3 id="booking-terms" className="text-lg font-semibold text-plum">
                  Terms &amp; Conditions
                </h3>
                <p className="text-sm text-muted">
                  Please read and accept before every booking.
                </p>
              </div>
            </div>

            <div
              tabIndex={0}
              className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-plum/15 bg-white px-4 py-3 text-sm leading-relaxed text-muted shadow-inner whitespace-pre-line"
              aria-label="Terms and conditions"
            >
              {BOOKING_TERMS_SCROLL_TEXT}
            </div>
            <p className="mt-2 text-xs text-muted">
              Full details also on our{" "}
              <Link href="/terms" className="font-semibold text-brand hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              page.
            </p>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-plum/10 bg-surface px-4 py-4 text-sm text-plum">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1"
                required
              />
              <span>
                I have read and agree to the Terms &amp; Conditions for this booking.
              </span>
            </label>
          </section>

          {error && (
            <p
              className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              !memberLoaded ||
              !hasSelectableSession ||
              !selectedSessionId ||
              !acceptedTerms ||
              Boolean(selectedSession?.alreadyBooked) ||
              Boolean(
                member?.isChild &&
                  (!member.parentalConsentComplete ||
                    !member.idDocumentUploaded ||
                    member.idDocumentStatus === "rejected"),
              )
            }
            className="w-full rounded-lg bg-sage px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-md shadow-sage/15 transition hover:bg-sage-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Processing…"
              : selectedSession?.isFull && joinWaitlist
                ? "Join waitlist"
                : useCredit && isSignedIn
                  ? "Confirm with class credit"
                  : voucherCode.trim()
                    ? "Apply code & confirm"
                    : config?.stripeEnabled
                      ? selectedSession
                        ? `Continue to pay ${priceNote}`
                        : "Select a class to continue"
                      : "Confirm booking"}
          </button>
          <p className="text-center text-xs leading-relaxed text-muted">
            Secure online payment. {siteConfig.durationNote} {siteConfig.arrivalNote}
          </p>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-28">
        {isSignedIn && member && (
          <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm ring-1 ring-plum/5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {member.isChild ? "Child member" : "Your account"}
            </p>
            <p className="mt-2 font-semibold text-plum">{member.name}</p>
            {member.isChild &&
            (!member.parentalConsentComplete ||
              !member.idDocumentUploaded ||
              member.idDocumentStatus === "rejected") ? (
              <p className="mt-3 text-sm text-brand">
                {member.idDocumentStatus === "rejected"
                  ? "The identification document for this child was not accepted. Upload a new one before booking."
                  : "Parental consent and ID are required before this child can book."}{" "}
                <Link href="/account/family" className="font-semibold underline">
                  Open family members
                </Link>
              </p>
            ) : null}
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Class credits</dt>
                <dd className="font-semibold text-plum">
                  {formatCredits(member.creditsRemaining ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">PAR-Q</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      member.parQCompleted
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-brand/10 text-brand"
                    }`}
                  >
                    {member.parQCompleted ? "Complete" : "Required"}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              {!member.parQCompleted ? (
                <Link
                  href="/account/parq"
                  className="rounded-lg bg-sage px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
                >
                  Complete PAR-Q
                </Link>
              ) : (
                <Link
                  href="/account/parq"
                  className="rounded-lg border border-plum/15 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink hover:text-brand"
                >
                  Update PAR-Q
                </Link>
              )}
              <Link
                href="/account/credits"
                className="rounded-lg border border-plum/15 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink hover:text-brand"
              >
                Buy class packs
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm ring-1 ring-plum/5">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
            How booking works
          </h3>
          <ol className="mt-5 space-y-4">
            {visibleSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-soft text-xs font-bold text-plum">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-plum/10 bg-gradient-to-br from-sage/90 to-sage p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-light">
            {isSignedIn && useCredit
              ? "Payment"
              : voucherCode.trim()
                ? "Gift / voucher"
                : "Amount due"}
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {isSignedIn && useCredit && selectedSession
              ? formatCredits(sessionCreditCost)
              : voucherCode.trim() && selectedSession
                ? "Code entered"
                : priceNote}
            {isSignedIn && useCredit && selectedSession ? (
              <span className="ml-2 text-base font-medium text-white/85">
                {sessionCreditCost === 1 ? "credit" : "credits"}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            {isSignedIn && useCredit && selectedSession
              ? `Your booking confirms instantly when you use ${sessionCreditLabel} — no card payment needed.`
              : voucherCode.trim() && selectedSession
                ? "If your gift card or voucher covers the class fee, your booking confirms immediately. Any leftover gift balance stays on the code."
                : selectedSession
                  ? "Pay online when you book, or enter a gift card / reward code. You will receive a confirmation email once payment is complete."
                  : "Select a class above to see the amount due. Prices can vary by session."}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted">
          {siteConfig.levelNote}{" "}
          <Link href="/contact" className="font-medium text-plum underline-offset-2 hover:underline">
            Contact us
          </Link>{" "}
          if you need help choosing a class.
        </p>
      </aside>
    </div>
  );
}
