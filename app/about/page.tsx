import type { Metadata } from "next";
import Image from "next/image";
import { AboutTabs } from "@/app/components/about-tabs";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { QualificationBadges } from "@/app/components/qualification-badges";
import { SectionHeading } from "@/app/components/section-heading";
import { values } from "@/lib/site-data";
import { heroImages } from "@/lib/hero-images";
import { pageSeo } from "@/lib/page-seo";

export const metadata: Metadata = pageSeo({
  title: "About Us",
  description:
    "Learn about Wild Hearts Collective — our mission, values, and qualified and experienced teaching team in Mansfield.",
  path: "/about",
  image: heroImages.about,
});

const qualifications = [
  {
    label: "Qualified & experienced instructors",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden="true">
        <path strokeLinecap="round" d="M12 3L4 7v6c0 4.5 3.4 8.7 8 10 4.6-1.3 8-5.5 8-10V7l-8-4z" />
        <path strokeLinecap="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "DBS checked",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden="true">
        <path strokeLinecap="round" d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z" />
        <path strokeLinecap="round" d="M8.5 12.5L11 15l4.5-5" />
      </svg>
    ),
  },
  {
    label: "First aid trained",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden="true">
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    label: "Insured & certified",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="9" r="5" />
        <path strokeLinecap="round" d="M8.5 14.5L7 22l5-2.5L17 22l-1.5-7.5" />
        <path strokeLinecap="round" d="M10 9h4M12 7v4" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Wild Hearts Collective"
        subtitle="Qualified and experienced instructors with a vision for inclusive movement and community."
        image="about"
      />

      <AboutTabs active="about" />

      <ContentSection>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading title="About Us" />
            <ProseBlock>
              <p className="geo-citation">
                Wild Hearts Collective is an inclusive aerial and pole studio in
                Mansfield, founded by Rosie, Jacqui, and Sarah to offer
                accessible pole and aerial arts alongside creative workshops for
                people of all ages, abilities, and backgrounds.
              </p>
              <p>
                We are committed to creating a welcoming, supportive environment
                where everyone can explore movement, build confidence, develop new
                skills, make connections, and express themselves creatively.
              </p>
              <p>
                More than a place to train, we are a community hub — a studio where
                beginners feel as welcome as seasoned aerialists, where creative
                workshops sit alongside pole and hoop classes, and where local
                collaborations help us grow together.
              </p>
              <p>
                Our instructors train regularly to keep skills, safety, and spotting
                techniques up to date. Every session is built around proper
                warm-ups, clear progressions, and the belief that movement should
                feel empowering — never intimidating — in a welcoming supportive
                environment where everyone celebrates each other&apos;s achievements.
              </p>
            </ProseBlock>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10 sm:aspect-[3/2]">
            <Image
              src={heroImages.about}
              alt="Wild Hearts Collective instructors in the studio"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-plum/40 via-transparent to-transparent"
            />
          </div>
        </div>

        <ProseBlock>
          <p className="mt-12 border-l-2 border-pink pl-6 text-lg text-plum">
            Through high-quality instruction and a community-driven focus on
            accessibility and wellbeing, we empower individuals to discover
            their strength, creativity, and sense of belonging.
          </p>
        </ProseBlock>
      </ContentSection>

      <section className="border-y border-pink/25 bg-pink-soft">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 lg:px-8">
          {qualifications.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-pink/30">
                {item.icon}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-plum sm:text-sm">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <QualificationBadges />

      <ContentSection className="bg-pink-soft">
        <SectionHeading
          title="Our Values"
          subtitle="Everything we do is guided by these principles."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <li
              key={value}
              className="rounded-lg border border-plum/8 bg-surface px-6 py-8 text-center shadow-sm"
            >
              <span className="font-display text-4xl text-pink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-2xl text-plum">{value}</h3>
            </li>
          ))}
        </ul>
      </ContentSection>
    </>
  );
}
