import type { MetadataRoute } from "next";
import { LIVE_SITE_URL } from "@/lib/booking-config";
import { classes } from "@/lib/site-data";
import { classSlugToHero, heroImages } from "@/lib/hero-images";
import { teamMembers } from "@/lib/team-data";

const siteUrl = LIVE_SITE_URL.replace(/\/$/, "");
const now = new Date("2026-08-26");

function url(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  images?: MetadataRoute.Sitemap[number]["images"],
): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    ...(images?.length ? { images } : {}),
  };
}

function absoluteImage(path: string) {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    url("/", "weekly", 1, [absoluteImage("/og-default.jpg")]),
    url("/about", "monthly", 0.8, [absoluteImage(heroImages.about)]),
    url("/about/team", "monthly", 0.7, [absoluteImage(heroImages.team)]),
    ...teamMembers.map((member) =>
      url(`/about/team/${member.slug}`, "monthly", 0.6, [
        absoluteImage(member.imageSrc),
      ]),
    ),
    url("/classes", "weekly", 0.9, [absoluteImage(heroImages.classes)]),
    ...classes.map((classItem) => {
      const heroKey = classSlugToHero[classItem.slug] ?? classItem.imageKey;
      return url(`/classes/${classItem.slug}`, "monthly", 0.8, [
        absoluteImage(heroImages[heroKey]),
      ]);
    }),
    url("/book", "weekly", 0.9, [absoluteImage(heroImages.classes)]),
    url("/membership", "weekly", 0.8),
    url("/community", "monthly", 0.6, [absoluteImage(heroImages.community)]),
    url("/parties", "monthly", 0.7, [absoluteImage(heroImages.parties)]),
    url("/hire", "monthly", 0.7, [absoluteImage(heroImages.hire)]),
    url("/shop", "weekly", 0.7, [absoluteImage(heroImages.shop)]),
    url("/reviews", "weekly", 0.6, [absoluteImage(heroImages.reviews)]),
    url("/contact", "monthly", 0.7, [absoluteImage(heroImages.contact)]),
    url("/faqs", "monthly", 0.5, [absoluteImage(heroImages.faqs)]),
    url("/search", "monthly", 0.3),
    url("/terms", "yearly", 0.3),
    url("/cookie-policy", "yearly", 0.3),
    url("/disclaimer", "yearly", 0.3),
    url("/privacy", "yearly", 0.3),
  ];
}
