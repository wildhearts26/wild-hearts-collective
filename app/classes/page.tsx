import type { Metadata } from "next";
import Link from "next/link";
import { ClassCard } from "@/app/components/class-card";
import { ContentSection } from "@/app/components/content-section";
import { FeatureVideo } from "@/app/components/feature-video";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { BookButton } from "@/app/components/book-button";
import { classes, siteConfig } from "@/lib/site-data";
import { classSlugToHero, heroImages, type HeroImageKey } from "@/lib/hero-images";
import { pageSeo } from "@/lib/page-seo";
import { getSiteVideo } from "@/lib/site-videos";

function getClassHeroKey(slug: string): HeroImageKey {
  return classSlugToHero[slug] ?? "community";
}

export const metadata: Metadata = pageSeo({
  title: "Our Classes",
  description:
    "Pole, aerial hoop, silks, juniors, workshops, and creative arts at Wild Hearts Collective — for all levels.",
  path: "/classes",
  image: heroImages.classes,
});

export default function ClassesPage() {
  const overviewVideo = getSiteVideo("services");

  return (
    <>
      <PageHero
        title="Our Classes"
        subtitle="Expert-led pole and aerial classes in a safe, inclusive studio."
        image="classes"
      />

      <ContentSection>
        <SectionHeading
          title="Find your class"
          subtitle="We provide several different classes throughout the week. Please read the information below — some classes are ability-specific."
        />
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
          {siteConfig.bookingNote}{" "}
          <Link href="/contact" className="font-medium text-plum hover:text-pink hover:underline">
            Contact us
          </Link>{" "}
          if you need help choosing the right level.
        </p>
        <div className="mt-8">
          <BookButton>Book now</BookButton>
        </div>
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

      <ContentSection className="bg-pink-soft">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title="See what we offer"
              subtitle="A quick look inside the studio"
            />
            <div className="mt-6 max-w-xl space-y-5 text-base leading-relaxed text-foreground">
              <p>
                From first-time pole and aerial sessions to creative arts
                workshops, Wild Hearts Collective is built for every body and
                every pace. Watch a short overview of the classes and creative
                sessions waiting for you in Mansfield.
              </p>
              <p>
                Our qualified and experienced instructors teach with patience, clear
                progressions, and a body-positive approach — so you can build
                strength, confidence, and community without pressure.
              </p>
              <p className="text-sm text-muted">
                Prefer to dive straight in? Explore each class above, or{" "}
                <Link
                  href="/book"
                  className="font-medium text-plum hover:text-pink hover:underline"
                >
                  book a session
                </Link>{" "}
                when you are ready.
              </p>
            </div>
            <div className="mt-8">
              <BookButton>Book a class</BookButton>
            </div>
          </div>

          <FeatureVideo
            src={overviewVideo.src}
            poster={overviewVideo.poster}
            title={overviewVideo.title}
            aspectClassName="aspect-video"
          />
        </div>
      </ContentSection>
    </>
  );
}
