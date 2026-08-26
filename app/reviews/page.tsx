import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { IntroSection } from "@/app/components/intro-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import {
  listPublicSiteReviews,
  type PublicSiteReview,
} from "@/lib/reviews-data";
import { googleReviewLink, socialLinks } from "@/lib/site-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Reviews",
  description:
    "Read what our community says about Wild Hearts Collective — then leave a Google review or find us on Facebook and Instagram.",
  path: "/reviews",
  image: heroImages.reviews,
});

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <p
      className="flex items-center gap-0.5 text-brand"
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < clamped ? "text-brand" : "text-plum/20"}
        >
          ★
        </span>
      ))}
    </p>
  );
}

function ReviewQuote({ review }: { review: PublicSiteReview }) {
  return (
    <blockquote className="flex h-full flex-col border-l-2 border-pink bg-surface px-6 py-6 shadow-sm ring-1 ring-plum/8">
      <StarRating rating={review.rating} />
      <p className="mt-4 flex-1 text-base leading-relaxed text-foreground">
        “{review.comments}”
      </p>
      <footer className="mt-6 border-t border-plum/8 pt-4">
        <cite className="not-italic font-semibold text-plum">
          {review.displayName}
        </cite>
        {(review.classTitle || review.submittedAtLabel) && (
          <p className="mt-1 text-xs uppercase tracking-wider text-muted">
            {[review.classTitle, review.submittedAtLabel].filter(Boolean).join(" · ")}
          </p>
        )}
      </footer>
    </blockquote>
  );
}

function ExternalLinkButton({
  href,
  label,
  description,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  tone: "google" | "instagram" | "facebook";
}) {
  const toneClass =
    tone === "google"
      ? "bg-sage text-white hover:bg-sage-hover"
      : tone === "instagram"
        ? "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:brightness-110"
        : "bg-[#1877F2] text-white hover:brightness-110";

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`group flex flex-col justify-between rounded-sm px-6 py-6 shadow-sm transition ${toneClass}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
          {tone === "google" ? "Google" : tone === "instagram" ? "Instagram" : "Facebook"}
        </p>
        <p className="mt-2 font-display text-2xl leading-snug text-white sm:text-3xl">
          {label}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/90">{description}</p>
      </div>
      <span className="mt-6 inline-flex text-xs font-bold uppercase tracking-wider text-white/95 group-hover:underline">
        Open link →
      </span>
    </a>
  );
}

export default async function ReviewsPage() {
  const reviews = await listPublicSiteReviews();
  const showingFeatured = reviews.every((review) => review.source === "featured");
  const instagram = socialLinks.find((link) => link.label === "Instagram");
  const facebook = socialLinks.find((link) => link.label === "Facebook");

  return (
    <>
      <PageHero
        title="Reviews"
        subtitle="Honest words from our community — and an easy way to share your own experience."
        image="reviews"
        priority
      />

      <IntroSection
        title="Stories from the studio"
        subtitle="Strength, confidence, and belonging — in our students’ own words."
        imageKey="reviews"
        imageAlt="Students connecting after class at Wild Hearts Collective"
        imageOverlay="Your voice helps the next person take their first class"
      >
        <p>
          At Wild Hearts Collective we teach with care, celebrate every body, and
          build a space where people feel welcome from their first visit. Reading
          real experiences is one of the best ways to get a feel for the studio
          before you book.
        </p>
        <p>
          Below you will find reviews shared by our community. When you are ready,
          you can leave a Google review or follow along on Facebook and Instagram
          — we love hearing how your journey is going.
        </p>
      </IntroSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading
          title="Share your experience"
          subtitle="Your review helps others feel confident taking that first step into the studio."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <ExternalLinkButton
            href={googleReviewLink.href}
            label={googleReviewLink.label}
            description={googleReviewLink.description}
            tone="google"
          />
          {instagram && (
            <ExternalLinkButton
              href={instagram.href}
              label={instagram.cta}
              description="See class moments, community updates, and behind-the-scenes life at the studio."
              tone="instagram"
            />
          )}
          {facebook && (
            <ExternalLinkButton
              href={facebook.href}
              label={facebook.cta}
              description="Join conversations, event updates, and local community news from Wild Hearts."
              tone="facebook"
            />
          )}
        </div>
        <p className="mt-6 text-sm text-muted">
          Prefer to write to us directly?{" "}
          <Link href="/contact" className="font-semibold text-plum hover:text-brand">
            Get in touch
          </Link>
          .
        </p>
      </ContentSection>

      <ContentSection>
        <SectionHeading
          title="What people say"
          subtitle={
            showingFeatured
              ? "A selection of voices from our community. Member reviews appear here when students choose to share feedback on the website."
              : "Reviews shared by students who chose to publish their feedback on our website."
          }
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewQuote review={review} />
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection className="bg-cream/60">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <SectionHeading
              title="Ready to write the next chapter?"
              subtitle="Beginner-friendly classes, qualified and experienced instructors, and a community that roots for you."
            />
            <ProseBlock>
              <p>
                Whether you are curious about pole, aerial hoop, silks, workshops,
                or parties, we would love to welcome you. Book online in a few
                minutes — or message us if you are unsure which class is right for
                you.
              </p>
            </ProseBlock>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-sm bg-sage px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              Book a class
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-sm border border-plum/20 bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
            >
              Explore classes
            </Link>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
