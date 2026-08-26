import type { Metadata } from "next";
import BookingFormSection from "@/app/components/booking-form-section";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { siteConfig } from "@/lib/site-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Book a Class",
  description:
    "Book pole, hoop, silks, juniors, workshops, creative arts, and beginner courses at Wild Hearts Collective.",
  path: "/book",
  image: heroImages.classes,
});

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Book a Class"
        subtitle="Choose your session, pay in full or use class credits, and receive confirmation by email."
        image="classes"
      />

      <ContentSection className="bg-background">
        <SectionHeading
          title="Book your class"
          subtitle="Filter by class type, pick a time, and confirm your booking in a few steps. Members can pay with credits or a voucher code."
        />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          {siteConfig.durationNote} {siteConfig.bookingNote}
        </p>
        <div className="mt-10">
          <BookingFormSection />
        </div>
      </ContentSection>
    </>
  );
}
