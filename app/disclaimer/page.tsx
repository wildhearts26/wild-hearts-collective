import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { companyDisclaimer, contact } from "@/lib/site-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Disclaimer",
  description:
    "Important disclaimers regarding classes, health and safety, and website content at Wild Hearts Collective.",
  path: "/disclaimer",
  image: heroImages.terms,
});

export default function DisclaimerPage() {
  return (
    <>
      <PageHero
        title="Disclaimer"
        subtitle="Important information about our classes, content, and your responsibilities."
        image="terms"
      />

      <ContentSection>
        <SectionHeading title="General information" />
        <ProseBlock>
          <p>
            The information on this website is provided for general guidance
            about Wild Hearts Collective, our classes, workshops, parties, and
            studio hire. While we aim to keep content accurate and up to date,
            we make no warranties — express or implied — about the completeness,
            reliability, or suitability of information on this site.
          </p>
          <p>
            Any reliance you place on website content is at your own risk. Class
            schedules, pricing, and availability may change without notice.
            Please confirm details when booking.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Physical activity & health" />
        <ProseBlock>
          <p>
            Pole dancing, aerial hoop, aerial silks, and related activities
            involve physical exertion and inherent risks. Participation is
            voluntary and at your own risk.
          </p>
          <p>
            You must inform your instructor of any injuries, medical conditions,
            pregnancy, or concerns before taking part. We may advise you to seek
            medical clearance or modify activities where appropriate.
          </p>
          <p>
            Wild Hearts Collective instructors are qualified and experienced, and
            trained in safe
            teaching practices, but we cannot guarantee that injury will never
            occur. By attending classes or events, you accept responsibility for
            your own wellbeing and agree to follow studio safety guidelines.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Website & external links" />
        <ProseBlock>
          <p>
            This website may contain links to third-party websites — including
            booking platforms and social media. We are not responsible for the
            content, privacy practices, or availability of external sites.
          </p>
          <p>
            Images and videos on this site are for illustrative purposes. They
            may not represent every class, participant, or studio setup at all
            times.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Professional advice" />
        <ProseBlock>
          <p>
            Nothing on this website constitutes medical, legal, or financial
            advice. If you need professional guidance — particularly regarding
            fitness, injury, or health — please consult an appropriate qualified
            professional.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Limitation of liability" />
        <ProseBlock>
          <p>
            To the fullest extent permitted by law, Wild Hearts Collective, its
            founders, instructors, and staff shall not be liable for any loss or
            damage — including indirect or consequential loss — arising from use
            of this website or participation in our activities, except where
            liability cannot be excluded under applicable law.
          </p>
          <p>
            Nothing in this disclaimer excludes or limits liability for death or
            personal injury caused by negligence, fraud, or any other liability
            that cannot be excluded under UK law.
          </p>
          <p>
            Questions about this disclaimer? Contact us at{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a> or visit our{" "}
            <Link href="/contact">Contact page</Link>. See also our{" "}
            <Link href="/terms">Terms & Conditions</Link>.
          </p>
          <p>{companyDisclaimer}</p>
          <p className="text-sm text-muted">
            Last updated: July 2026
          </p>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
