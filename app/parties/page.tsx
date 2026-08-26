import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { IntroSection } from "@/app/components/intro-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { getSiteVideo } from "@/lib/site-videos";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Parties & Events",
  description:
    "Personalised party packages with aerial disciplines and arts or crafts at Wild Hearts Collective.",
  path: "/parties",
  image: heroImages.parties,
});

const packages = [
  {
    title: "Children's party packages",
    description:
      "Safe, supervised aerial and movement activities tailored for young celebrants and their friends.",
  },
  {
    title: "Creative movement sessions",
    description:
      "Fun, age-appropriate sessions that build confidence through play and guided movement.",
  },
  {
    title: "Private group events",
    description:
      "Customisable options for birthdays, celebrations, and group bookings. Contact us to plan your event.",
  },
];

export default function PartiesPage() {
  const partyVideo = getSiteVideo("parties");

  return (
    <>
      <PageHero
        title="Parties & Kids Activities"
        subtitle="Safe, supervised, and unforgettable celebrations."
        image="parties"
      />

      <IntroSection
        title="Party packages"
        imageKey="parties"
        imageAlt="Children's party at Wild Hearts Collective"
        videoSrc={partyVideo.src}
        videoTitle={partyVideo.title}
      >
        <p>
          Add something unique to your next celebration. Our party packages can
          include any of the aerial disciplines and arts or crafts that we
          offer.
        </p>
        <p>
          Parties can be completely personalised and adapted for all ages and
          group sizes.
        </p>
        <p>
          All sessions are fully supervised by our qualified and experienced,
          DBS-checked team.
        </p>
        <p>
          <Link
            href="/contact"
            className="font-semibold text-plum underline-offset-2 hover:text-pink hover:underline"
          >
            Contact us
          </Link>{" "}
          to discuss your requirements.
        </p>
      </IntroSection>

      <ContentSection className="bg-pink-soft">
        <ul className="grid gap-6 sm:grid-cols-3">
          {packages.map((item) => (
            <li
              key={item.title}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <h3 className="font-display text-2xl text-plum">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection>
        <SectionHeading
          title="Make an enquiry"
          subtitle="Tell us about your event and we'll get back to you with options."
        />
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-sm bg-sage px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-sage-hover"
        >
          Send an enquiry
        </Link>
      </ContentSection>
    </>
  );
}
