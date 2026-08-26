import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutTabs } from "@/app/components/about-tabs";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { TeamSocialLinks } from "@/app/components/team-social-links";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  personJsonLd,
} from "@/lib/geo";
import { getTeamMember, teamMembers } from "@/lib/team-data";
import { pageSeo } from "@/lib/page-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return teamMembers.map((member) => ({ slug: member.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = getTeamMember(slug);

  if (!member) {
    return { title: "Instructor Not Found" };
  }

  return pageSeo({
    title: `${member.name} — Instructor`,
    description: member.shortBio,
    path: `/about/team/${member.slug}`,
    image: member.imageSrc,
  });
}

export default async function InstructorBioPage({ params }: PageProps) {
  const { slug } = await params;
  const member = getTeamMember(slug);

  if (!member) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd(member)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
              { name: "Our Team", path: "/about/team" },
              { name: member.name, path: `/about/team/${member.slug}` },
            ]),
          ),
        }}
      />
      <PageHero
        title={member.name}
        subtitle={`${member.role} · ${member.pronouns}`}
        image="team"
      />

      <AboutTabs active="team" />

      <ContentSection>
        <p className="mb-8">
          <Link
            href="/about/team"
            className="text-sm font-semibold text-plum transition hover:text-sage"
          >
            ← Back to Our Team
          </Link>
        </p>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10">
            <Image
              src={member.imageSrc}
              alt={`${member.name} at Wild Hearts Collective`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className={`object-cover ${member.imagePosition ?? "object-top"}`}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sage">
              {member.role}
            </p>
            <h2 className="mt-3 font-display text-4xl text-plum sm:text-5xl">
              {member.name}
            </h2>
            <p className="geo-citation mt-4 text-sm leading-relaxed text-muted">
              {member.name} is a {member.role.toLowerCase()} at Wild Hearts
              Collective. {member.shortBio}
            </p>
            <p className="mt-2 text-sm text-muted">{member.pronouns}</p>

            <ProseBlock>
              {member.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </ProseBlock>

            <div className="mt-10">
              <h3 className="font-display text-2xl text-plum">Qualifications</h3>
              <ul className="mt-4 space-y-2">
                {member.qualifications.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <h3 className="font-display text-2xl text-plum">Key facts</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {member.keyFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-sm border border-plum/8 bg-cream/50 px-4 py-3"
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-plum/65">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-plum">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <TeamSocialLinks
              name={member.name}
              instagram={member.instagram?.trim() || undefined}
            />
          </div>
        </div>
      </ContentSection>
    </>
  );
}
