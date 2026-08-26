import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { IntroSection } from "@/app/components/intro-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Hire the Space",
  description:
    "Studio and room hire for private events, workshops, and community use at Wild Hearts Collective.",
  path: "/hire",
  image: heroImages.hire,
});

const options = [
  {
    title: "Studio hire",
    description:
      "Hire our clean, well-equipped aerial and pole studio for private training or group sessions.",
  },
  {
    title: "Private events & workshops",
    description:
      "Host your own workshop or event in a welcoming, accessible space.",
  },
  {
    title: "Flexible community use",
    description:
      "We welcome enquiries from community groups and local organisations. Get in touch to discuss your needs.",
  },
];

export default function HirePage() {
  return (
    <>
      <PageHero
        title="Hire the Space"
        subtitle="Flexible studio hire for events, workshops, and community use."
        image="hire"
      />

      <IntroSection
        title="Hire options"
        imageKey="hire"
        imageAlt="Studio space available for hire at Wild Hearts Collective"
      >
        <p>
          Our studio is available for private hire, workshops, and community
          events. Whether you need the space for a one-off session or a
          regular booking, we&apos;d love to hear from you.
        </p>
      </IntroSection>

      <ContentSection>
        <ul className="grid gap-6 sm:grid-cols-3">
          {options.map((item) => (
            <li
              key={item.title}
              className="rounded-sm border border-plum/10 bg-surface p-6 shadow-sm"
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
        <SectionHeading
          title="Make an enquiry"
          subtitle="Contact us with your dates, group size, and requirements."
        />
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-sm bg-sage px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-sage-hover"
        >
          Contact us
        </Link>
      </ContentSection>
    </>
  );
}
