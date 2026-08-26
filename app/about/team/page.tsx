import type { Metadata } from "next";
import { AboutTabs } from "@/app/components/about-tabs";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { TeamCard } from "@/app/components/team-card";
import { teamMembers } from "@/lib/team-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Our Team",
  description:
    "Meet the qualified and experienced instructors at Wild Hearts Collective — Rosie, Jacqui, Sarah, Jane, and Zane.",
  path: "/about/team",
  image: heroImages.team,
});

export default function AboutTeamPage() {
  return (
    <>
      <PageHero
        title="Our Team"
        subtitle="Qualified and experienced instructors — patient, knowledgeable, and dedicated to your progress."
        image="team"
      />

      <AboutTabs active="team" />

      <ContentSection className="bg-background">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 h-px w-12 bg-pink" />
          <h2 className="font-display text-4xl text-plum sm:text-5xl">
            Meet the instructors
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Our team brings DBS checks, first aid training, and certified
            instruction — with a shared commitment to inclusive, supportive
            teaching. Click a photo to learn more.
          </p>
        </div>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <li key={member.slug}>
              <TeamCard
                name={member.name}
                role={member.role}
                bio={member.shortBio}
                href={`/about/team/${member.slug}`}
                imageSrc={member.imageSrc}
                imagePosition={member.imagePosition}
              />
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-muted">
          Come along and see for yourself what a welcoming, professional team we
          have — we&apos;d love to meet you in the studio.
        </p>
      </ContentSection>
    </>
  );
}
