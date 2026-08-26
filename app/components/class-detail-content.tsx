import Image from "next/image";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { FeatureVideo } from "@/app/components/feature-video";
import { SectionHeading } from "@/app/components/section-heading";
import { BookButton } from "@/app/components/book-button";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";

export type ClassDetailData = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string | string[];
  intro: string;
  levels: string;
  href: string;
  whatToExpect: string[];
  highlights: { title: string; description: string }[];
  whatToWear: string;
  whoFor: string;
  imageKey: HeroImageKey;
  photoOverlay?: string;
  videoSrc?: string;
  videoTitle?: string;
};

function overviewParagraphs(classItem: ClassDetailData) {
  const extra = Array.isArray(classItem.description)
    ? classItem.description
    : [classItem.description];
  return [classItem.intro, ...extra].filter((paragraph) => paragraph.trim());
}

export function ClassDetailContent({ classItem }: { classItem: ClassDetailData }) {
  const poster = heroImages[classItem.imageKey];

  return (
    <>
      <ContentSection>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading title="Overview" subtitle={classItem.levels} />
            <p className="geo-citation mt-4 text-sm leading-relaxed text-muted sm:text-base">
              {classItem.title} at Wild Hearts Collective is {classItem.shortDescription}
            </p>
            <ProseBlock>
              {overviewParagraphs(classItem).map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </ProseBlock>
            <div className="mt-8">
              <BookButton>Book this class</BookButton>
            </div>
          </div>

          {classItem.videoSrc ? (
            <div className="relative">
              <FeatureVideo
                src={classItem.videoSrc}
                poster={poster}
                title={classItem.videoTitle ?? classItem.title}
                aspectClassName="aspect-[4/3]"
              />
              {classItem.photoOverlay ? (
                <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-plum/90 via-plum/50 to-transparent px-5 pb-5 pt-16 text-sm font-medium leading-snug text-white sm:text-base">
                  {classItem.photoOverlay}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10">
              <Image
                src={poster}
                alt={classItem.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-plum/50 via-transparent to-transparent"
              />
              {classItem.photoOverlay ? (
                <p className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 text-sm font-medium leading-snug text-white sm:text-base">
                  {classItem.photoOverlay}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="What to expect" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {classItem.whatToExpect.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-lg border border-plum/8 bg-surface px-5 py-4 text-sm leading-relaxed text-foreground"
            >
              <span className="mt-0.5 shrink-0 text-pink" aria-hidden="true">
                ✦
              </span>
              {item}
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Why you'll love it" />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {classItem.highlights.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-plum/8 bg-surface p-6 shadow-sm"
            >
              <h3 className="font-display text-2xl text-plum">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="Who is it for?" />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              {classItem.whoFor}
            </p>
          </div>
          <div>
            <SectionHeading title="What to wear" />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              {classItem.whatToWear}
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <BookButton>Book now</BookButton>
          <Link
            href="/contact"
            className="inline-flex items-center text-sm font-semibold uppercase tracking-wider text-brand transition hover:text-brand-hover"
          >
            Ask us a question →
          </Link>
        </div>
      </ContentSection>
    </>
  );
}
