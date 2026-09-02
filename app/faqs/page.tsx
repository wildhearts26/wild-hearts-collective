import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { faqPageJsonLd, jsonLdScript } from "@/lib/geo";
import { pageSeo } from "@/lib/page-seo";
import { faqs } from "@/lib/site-data";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "FAQs",
  description:
    "Frequently asked questions about classes, booking, and what to expect at Wild Hearts Collective.",
  path: "/faqs",
  image: heroImages.faqs,
});

export default function FaqsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(faqPageJsonLd(faqs, { pagePath: "/faqs" })),
        }}
      />
      <PageHero
        title="FAQs"
        subtitle="Answers to common questions about our classes and studio."
        image="faqs"
      />

      <ContentSection>
        <SectionHeading title="Common questions" />
        <p className="geo-citation mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Wild Hearts Collective is an inclusive aerial and pole studio in Mansfield.
          These FAQs cover booking, kit, beginners, instructor qualifications, location,
          and children’s classes.
        </p>
        <ul className="mt-12 space-y-4">
          {faqs.map((item) => (
            <li
              key={item.question}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <h3 className="font-display text-2xl text-plum">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted">
          Still have questions?{" "}
          <Link href="/contact" className="font-medium text-plum hover:text-pink hover:underline">
            Contact us
          </Link>
          .
        </p>
      </ContentSection>
    </>
  );
}
