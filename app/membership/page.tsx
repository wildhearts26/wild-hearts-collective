import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { BundlePurchaseGrid } from "@/app/components/bundle-purchase-grid";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { BOOKING_URL } from "@/lib/constants";
import { getCurrentMember } from "@/lib/member-auth";
import { buildMembershipPlans, MEMBERSHIP_PLAN } from "@/lib/membership-config";
import { listActiveClassPacks } from "@/lib/studio-pricing-service";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = pageSeo({
  title: "Membership",
  description:
    "Join Wild Hearts Collective — create your member account, book classes online, and manage your bookings in one place.",
  path: "/membership",
  image: heroImages.community,
});

const guestSteps = [
  {
    title: "Create your account",
    description: "Sign up with your email to access your personal member dashboard.",
  },
  {
    title: "Book a class",
    description: "Choose a session from our timetable and pay the full class fee securely online.",
  },
  {
    title: "Track everything",
    description: "View upcoming bookings, waitlist entries, and update your profile anytime.",
  },
] as const;

const memberSteps = [
  {
    title: "You\u2019re signed in",
    description: "Your member dashboard is ready — bookings, credits, and profile in one place.",
  },
  {
    title: "Book a class",
    description: "Choose a session from our timetable and pay the full class fee securely online.",
  },
  {
    title: "Track everything",
    description: "View upcoming bookings, waitlist entries, and update your profile anytime.",
  },
] as const;

function classPackSubtitle(packCount: number) {
  if (packCount === 0) return undefined;
  if (packCount === 1) {
    return "Prefer pay-as-you-go? Purchase a class pack and use credits whenever you book.";
  }
  return "Prefer pay-as-you-go? Choose a class pack and use credits whenever you book.";
}

export default async function MembershipPage() {
  await connection();

  const [classPacks, member] = await Promise.all([
    listActiveClassPacks(),
    getCurrentMember(),
  ]);

  const packs = classPacks.map((pack) => ({
    id: pack.id,
    slug: pack.slug,
    name: pack.name,
    description: pack.description,
    credits: pack.credits,
    priceLabel: pack.priceLabel,
    validDays: pack.validDays,
  }));

  const membershipPlans = buildMembershipPlans();
  const isSignedIn = Boolean(member);
  const steps = isSignedIn ? memberSteps : guestSteps;

  return (
    <>
      <PageHero
        title={isSignedIn ? "Your membership" : "Become a member"}
        subtitle={
          isSignedIn
            ? "Manage your account, book classes, and grow your studio journey."
            : "Your Wild Hearts account — book classes, pay online, and manage your studio journey."
        }
        image="community"
      />

      <ContentSection>
        <SectionHeading title="How it works" />
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-soft text-sm font-bold text-brand">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-2xl text-plum">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        {packs.length > 0 && (
          <div className="pb-4">
            <SectionHeading
              title="Class passes"
              subtitle={classPackSubtitle(packs.length)}
            />
            <div className="mx-auto mt-12 max-w-5xl">
              <BundlePurchaseGrid packs={packs} featured emphasize />
            </div>
          </div>
        )}

        <div className={packs.length > 0 ? "mt-16 border-t border-plum/10 pt-16" : ""}>
          <SectionHeading title="Membership" centered />
          <div className="mx-auto mt-12 max-w-xl">
            {membershipPlans.map((plan) => {
              const isAccountPlan = plan.id === MEMBERSHIP_PLAN.account;
              const planHref =
                isAccountPlan && isSignedIn ? "/account" : plan.href;
              const planCta =
                isAccountPlan && isSignedIn ? "Go to my account" : plan.cta;
              const planPriceNote =
                isAccountPlan && isSignedIn
                  ? "You\u2019re already a member"
                  : plan.priceNote;

              return (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-sm border border-plum/10 bg-surface p-8"
                >
                  <h3 className="font-display text-3xl text-plum">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="font-display text-4xl text-brand">{plan.price}</span>
                    {planPriceNote && (
                      <span className="ml-2 text-sm text-muted">{planPriceNote}</span>
                    )}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{plan.description}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm text-plum">
                        <span className="text-brand" aria-hidden="true">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href={planHref}
                      className="block w-full rounded-sm bg-sage py-3 text-center text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
                    >
                      {planCta}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </ContentSection>

      <ContentSection>
        <ProseBlock>
          <h2 className="font-display text-3xl text-plum">Ready to fly?</h2>
          <p>
            {isSignedIn
              ? "All classes must be booked in advance. Switch to a child member before booking for them — their classes and credits stay on their own membership."
              : "All classes must be booked in advance. Once you\u2019re signed in, your bookings are linked to your account. Parents can add child members who share the same email; switch to the child before booking so they pay and attend separately."}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href={BOOKING_URL}
                  className="rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
                >
                  Book a class
                </Link>
                <Link
                  href="/account"
                  className="rounded-sm border border-plum/20 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:border-brand hover:text-brand"
                >
                  Go to my account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
                >
                  Create free account
                </Link>
                <Link
                  href={BOOKING_URL}
                  className="rounded-sm border border-plum/20 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:border-brand hover:text-brand"
                >
                  Book a class
                </Link>
              </>
            )}
          </div>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
