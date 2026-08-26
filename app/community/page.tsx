import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { IntroSection } from "@/app/components/intro-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Community & Space",
  description:
    "Wild Hearts Collective is a community hub for arts, crafts, wellbeing, and local collaboration.",
  path: "/community",
  image: heroImages.community,
});

const highlights = [
  {
    title: "Arts & crafts workshops",
    description:
      "Creative sessions for expression, relaxation, and connection — open to all ages and abilities.",
  },
  {
    title: "Community hub activities",
    description:
      "A welcoming space to gather, learn, and build belonging beyond aerial and pole classes.",
  },
  {
    title: "Local collaborations",
    description:
      "Partnering with small businesses to create a supportive network around the studio.",
  },
  {
    title: "Wellbeing focus",
    description:
      "Movement and creativity that support confidence, connection, and self-expression.",
  },
];

export default function CommunityPage() {
  return (
    <>
      <PageHero
        title="Community & Space"
        subtitle="More than a studio — a hub for creativity, wellbeing, and connection."
        image="community"
      />

      <IntroSection
        title="Our community hub"
        imageKey="community"
        imageSrc="/hero/hero-community-trailer02.jpg"
        imageAlt="Wild Hearts Collective community gathered together"
        imageOverlay="A welcoming space to make new friends, learn, craft and train with internal and external activities"
      >
        <p>
          Wild Hearts Collective champions arts for all — connecting you with a
          warm, supportive team while you explore movement and creative
          expression.
        </p>
        <p>
          Join us to learn, laugh, and find your people. Our space welcomes arts
          and crafts workshops, community activities, and collaborations with
          local businesses.
        </p>
      </IntroSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="What happens here" />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {highlights.map((item) => (
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
          title="Creative arts workshops"
          subtitle="Explore our workshop programme alongside pole and aerial classes."
        />
        <ProseBlock>
          <p>
            Our creative arts workshops will offer a calm, inclusive space to try
            something new — from seasonal crafts to mindful making sessions.
          </p>
        </ProseBlock>
        <Link
          href="/classes/creative-arts-workshops"
          className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-plum hover:text-pink"
        >
          Explore creative arts workshops →
        </Link>
      </ContentSection>
    </>
  );
}
