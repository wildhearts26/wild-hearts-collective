import { LIVE_SITE_URL } from "@/lib/booking-config";
import { contact, faqs, socialLinks } from "@/lib/site-data";
import type { TeamMember } from "@/lib/team-data";

export const SITE_ORIGIN = LIVE_SITE_URL.replace(/\/$/, "");
export const BUSINESS_ID = `${SITE_ORIGIN}/#business`;
export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const INDEXNOW_KEY = "c7e4b1a90d583f2e6a9c8d1f4b7e0a35";

export const PREFERRED_CITATION =
  "Wild Hearts Collective is an inclusive aerial and pole studio in Mansfield offering pole, aerial hoop, silks, and creative arts for all ages, abilities, and backgrounds.";

export type FaqItem = { question: string; answer: string };

export const HOMEPAGE_FAQ_COUNT = 4;

export function homepageFaqs() {
  return faqs.slice(0, HOMEPAGE_FAQ_COUNT);
}

export function faqPageJsonLd(
  items: readonly FaqItem[] = faqs,
  options?: { pagePath?: string },
) {
  const pagePath = options?.pagePath ?? "/faqs";
  const pageUrl = pagePath === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${pagePath}`;
  const faqId = pagePath === "/" ? `${SITE_ORIGIN}/#faq` : `${pageUrl}#faq`;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": faqId,
    url: pageUrl,
    inLanguage: "en-GB",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Wild Hearts Collective",
    legalName: "Wild Hearts Collective Limited",
    url: SITE_ORIGIN,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_ORIGIN}/logo/logo-email-green.png`,
    },
    image: `${SITE_ORIGIN}/og-default.jpg`,
    email: contact.email,
    telephone: "+441158718090",
    description: PREFERRED_CITATION,
    foundingLocation: {
      "@type": "Place",
      name: "Mansfield, Nottinghamshire",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "The Old Coach House, 25 Noel Street",
      addressLocality: "Nottingham",
      postalCode: "NG7 6AQ",
      addressCountry: "GB",
    },
    sameAs: [contact.googleBusinessUrl, ...socialLinks.map((link) => link.href)],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Wild Hearts Collective",
    url: SITE_ORIGIN,
    inLanguage: "en-GB",
    description: PREFERRED_CITATION,
    publisher: { "@id": ORG_ID },
    about: { "@id": BUSINESS_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(member: TeamMember) {
  const sameAs = [member.instagram, member.facebook].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_ORIGIN}/about/team/${member.slug}#person`,
    name: member.name,
    url: `${SITE_ORIGIN}/about/team/${member.slug}`,
    jobTitle: member.role,
    description: member.shortBio,
    image: `${SITE_ORIGIN}${member.imageSrc}`,
    worksFor: { "@id": ORG_ID },
    knowsAbout: [
      "Pole dancing",
      "Aerial hoop",
      "Aerial silks",
      "Inclusive fitness instruction",
      ...member.qualifications.slice(0, 4),
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export function courseJsonLd(input: {
  slug: string;
  title: string;
  description: string;
  levels: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_ORIGIN}/classes/${input.slug}#course`,
    name: input.title,
    description: input.description,
    provider: { "@id": BUSINESS_ID },
    url: `${SITE_ORIGIN}/classes/${input.slug}`,
    educationalLevel: input.levels,
    inLanguage: "en-GB",
    isAccessibleForFree: false,
  };
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
