import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/app/components/contact-form";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";
import { contact, socialLinks } from "@/lib/site-data";

export const metadata: Metadata = pageSeo({
  title: "Contact Us",
  description:
    "Get in touch with Wild Hearts Collective about classes, parties, studio hire, and more.",
  path: "/contact",
  image: heroImages.contact,
});

const phoneHref = `tel:${contact.phone.replace(/\s/g, "")}`;

const mapLinks = [
  { href: contact.mapsUrl, label: "Google Maps" },
  { href: contact.appleMapsUrl, label: "Apple Maps" },
  { href: contact.wazeUrl, label: "Waze" },
  { href: contact.what3wordsUrl, label: "what3words" },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Get in touch about classes, parties, or hire."
        image="contact"
      />

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title="Get in touch" />
            <ProseBlock>
              <p>
                Whether you&apos;re booking your first class, planning a party,
                or enquiring about studio hire, our team is here to help.
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                <br />
                <strong>Phone:</strong>{" "}
                <a href={phoneHref}>{contact.phone}</a>
              </p>
              <p>
                <strong>Address:</strong>
                <br />
                {contact.addressLines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {mapLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </span>
              </p>
              <p>
                <strong>Social:</strong>
                <br />
                {socialLinks.map((link) => (
                  <span key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand hover:underline"
                    >
                      {link.label}
                    </Link>
                    <br />
                  </span>
                ))}
              </p>
            </ProseBlock>
          </div>

          <ContactForm />
        </div>
      </ContentSection>

      <ContentSection className="bg-white">
        <SectionHeading
          title="Find us"
          subtitle="Unit 25, Block 7 Hallam Way — Old Mill Lane Industrial Estate, Mansfield. Open in Google Maps, Apple Maps, or Waze for directions."
        />
        <div className="mt-8 overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
          <iframe
            title="Wild Hearts Collective studio location"
            src={contact.mapsEmbedUrl}
            className="aspect-[16/10] w-full border-0 sm:aspect-[21/9]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {contact.address}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-muted">
          Follow the pin for Unit 25, Block 7 Hallam Way. Apple Maps may still
          list nearby industrial-estate units under “Block 6” in its Details
          panel — that is Apple’s shared estate listing, not our studio address.
        </p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm">
          {mapLinks.map((link) => (
            <Link
              key={`find-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              {link.label === "what3words"
                ? "what3words"
                : `Open in ${link.label}`}
            </Link>
          ))}
        </p>
      </ContentSection>
    </>
  );
}
