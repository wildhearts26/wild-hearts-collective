import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetailContent } from "@/app/components/class-detail-content";
import { PageHero } from "@/app/components/page-hero";
import {
  breadcrumbJsonLd,
  courseJsonLd,
  jsonLdScript,
} from "@/lib/geo";
import { classes } from "@/lib/site-data";
import { classSlugToHero, heroImages } from "@/lib/hero-images";
import { pageSeo } from "@/lib/page-seo";
import { getClassVideo } from "@/lib/site-videos";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return classes.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const classItem = classes.find((item) => item.slug === slug);

  if (!classItem) {
    return { title: "Class Not Found" };
  }

  const heroKey = classSlugToHero[classItem.slug] ?? classItem.imageKey;

  return pageSeo({
    title: classItem.title,
    description: classItem.shortDescription,
    path: `/classes/${classItem.slug}`,
    image: heroImages[heroKey],
  });
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const classItem = classes.find((item) => item.slug === slug);

  if (!classItem) {
    notFound();
  }

  const heroImage = classSlugToHero[classItem.slug] ?? classItem.imageKey;
  const video = getClassVideo(classItem.slug);
  const description = Array.isArray(classItem.description)
    ? classItem.description.join(" ")
    : classItem.description;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            courseJsonLd({
              slug: classItem.slug,
              title: classItem.title,
              description: classItem.shortDescription || description,
              levels: classItem.levels,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Classes", path: "/classes" },
              { name: classItem.title, path: `/classes/${classItem.slug}` },
            ]),
          ),
        }}
      />
      <PageHero
        title={classItem.title}
        subtitle={classItem.shortDescription}
        image={heroImage}
      />

      <ClassDetailContent
        classItem={{
          ...classItem,
          imageKey: heroImage,
          videoSrc: video?.src,
          videoTitle: video?.title,
        }}
      />
    </>
  );
}
