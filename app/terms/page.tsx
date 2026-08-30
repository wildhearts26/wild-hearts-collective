import type { Metadata } from "next";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Terms & Conditions",
  description: "Terms and conditions for Wild Hearts Collective classes and bookings.",
  path: "/terms",
  image: heroImages.terms,
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms & Conditions"
        subtitle="Booking policies, health and safety, and studio guidelines."
        image="terms"
      />

      <ContentSection>
        <SectionHeading title="Booking & cancellation" />
        <ProseBlock>
          <p>
            All classes must be booked in advance through this website. The full
            class fee is paid online when you book (unless you pay with class
            credits or an eligible gift voucher).
          </p>
          <p>
            Cancel at least 24 hours before the class start time to receive a
            refund as class credits — £10 equals 1 credit, £5 equals 0.5 credit,
            and so on. Late cancellations within 24 hours of the class are not
            refunded.
          </p>
          <p>
            4-week courses are booked as a full block. Cancelling a course
            cancels all four weeks. If you cancel before the course starts, and
            at least 24 hours before week 1, you receive a refund as class
            credits. If the course has already started, all four weeks are still
            cancelled but there is no refund.
          </p>
          <p>
            Cash refunds are available but must be requested by emailing{" "}
            <a href="mailto:hello@wildheartscollective.org">
              hello@wildheartscollective.org
            </a>{" "}
            and are processed manually by the studio.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Child members" />
        <ProseBlock>
          <p>
            Members under 18 must be registered as child members by a parent or
            legal guardian. The parent or guardian signs in with their own
            email, gives consent, and uploads proof of identification. Child
            members complete the same membership information, but they book and
            pay separately — switch to the child&apos;s profile before booking so
            classes, credits, and payments stay on their membership.
          </p>
          <p>
            The studio may refuse or pause a child membership if consent or
            identification cannot be verified, or if participation would not be
            safe.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Health & safety" />
        <ProseBlock>
          <p>
            Participants must complete any required health forms before
            attending. Please inform your instructor of any injuries or medical
            conditions. Wild Hearts Collective reserves the right to refuse
            participation if safety cannot be assured.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Studio rules" />
        <ProseBlock>
          <p>
            Please arrive 5–10 minutes before class. Appropriate clothing is
            required. The studio must be kept clean and equipment treated with
            care. Full terms will be provided to members upon joining.
          </p>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
