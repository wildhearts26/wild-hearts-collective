import type { Metadata } from "next";
import Link from "next/link";
import { pageSeo } from "@/lib/page-seo";
import { ClassCard } from "./components/class-card";
import {
  ContentSection,
  ProseBlock,
  ReadMoreLink,
} from "./components/content-section";
import { FaqPreview } from "./components/faq-preview";
import { StatsSection } from "./components/stats-section";
import { WhyChooseUs } from "./components/why-choose-us";
import { VideoHero } from "./components/video-hero";
import { SectionHeading } from "./components/section-heading";
import { Timetable } from "./components/timetable";
import {
  getMarketingTimetable,
  getMarketingTimetableVisibility,
} from "@/lib/marketing-timetable-service";
import { classes, siteConfig } from "@/lib/site-data";
import { classSlugToHero, type HeroImageKey } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Wild Hearts Collective | Pole & Aerial Classes in Mansfield",
  description:
    "Inclusive aerial and pole studio in Mansfield offering pole, hoop, silks, and creative arts for all ages, abilities, and backgrounds.",
  path: "/",
});

/** Always read the latest admin-saved timetable from the database. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getClassHeroKey(slug: string): HeroImageKey {
  return classSlugToHero[slug] ?? "community";
}

export default async function Home() {
  const [timetableDays, timetableVisible] = await Promise.all([
    getMarketingTimetable(),
    getMarketingTimetableVisibility(),
  ]);

  return (
    <>
      <VideoHero
        title="Wild Hearts Collective"
        titleLine2="Pole & Aerial Classes in Mansfield"
        subtitle="Spin, climb, stretch, play, create and connect in a safe, inclusive studio for all bodies, ages and abilities."
        videoSrc="/hero/hero-home.mp4"
        posterSrc="/hero/hero-home.jpg"
      />

      <ContentSection>
        <p className="mb-3 font-display text-lg tracking-[0.08em] text-sage sm:mb-4 sm:text-xl">
          Welcome to Wild Hearts Collective
        </p>
        <SectionHeading title="About us" />
        <ProseBlock>
          <p className="geo-citation">
            Wild Hearts Collective is an inclusive aerial and pole studio in
            Mansfield, founded by qualified and experienced instructors Rosie,
            Jacqui, and Sarah. We offer accessible pole, aerial hoop, silks, and
            creative arts workshops in a welcoming, supportive environment.
          </p>
          <p>
            With a community-driven focus on accessibility and wellbeing, we
            empower everyone to explore movement, build confidence, develop new
            skills, and find their people. Learn more about our journey, space,
            and classes on our{" "}
            <Link href="/about">About Us page</Link>.
          </p>
        </ProseBlock>
        <ReadMoreLink href="/about" />
      </ContentSection>

      <StatsSection />

      <WhyChooseUs />

      {timetableVisible ? (
        <ContentSection id="timetable" className="bg-pink-soft scroll-mt-24">
          <Timetable days={timetableDays} />
        </ContentSection>
      ) : null}

      <ContentSection className="bg-white">
        <SectionHeading
          title="Our Classes"
          subtitle={siteConfig.bookingNote}
        />
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {classes.map((item) => (
            <li key={item.slug}>
              <ClassCard
                title={item.title}
                description={item.shortDescription}
                href={item.href}
                gradient={item.gradient}
                imageKey={getClassHeroKey(item.slug)}
              />
            </li>
          ))}
        </ul>
      </ContentSection>

      <FaqPreview />
    </>
  );
}
