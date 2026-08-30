import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { contact, siteConfig } from "@/lib/site-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Data Privacy",
  description:
    "How Wild Hearts Collective collects, uses, and protects your personal data.",
  path: "/privacy",
  image: heroImages.terms,
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Data Privacy"
        subtitle="How we collect, use, store, and protect your personal information."
        image="terms"
      />

      <ContentSection>
        <SectionHeading title="Who we are" />
        <ProseBlock>
          <p>
            {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) is an inclusive aerial and pole studio and
            community hub. We are the data controller responsible for your
            personal information when you use our website, book classes, or
            contact us.
          </p>
          <p>
            Contact:{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
          <p>
            We are registered with the Information Commissioner&apos;s Office
            (ICO). Our registration reference is{" "}
            <strong>ICO number: C1988786</strong>.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Information we collect" />
        <ProseBlock>
          <p>We may collect and process the following types of personal data:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Identity & contact details</strong> — name, email address,
              phone number, date of birth, and emergency contact information.
            </li>
            <li>
              <strong>Child membership & parental consent</strong> — where a
              member is under 18, we record that they are a child member, the
              parent or guardian&apos;s consent, their relationship to the child,
              and a copy of the parent or guardian&apos;s identification document
              so we can confirm consent is genuine.
            </li>
            <li>
              <strong>Booking information</strong> — classes booked, attendance
              history, class payments, and payment-related records (processed via our
              booking platform).
            </li>
            <li>
              <strong>Health & safety information</strong> — relevant medical
              conditions, injuries, or access needs you choose to share so we
              can teach safely and inclusively.
            </li>
            <li>
              <strong>Communications</strong> — messages you send via our contact
              form, email, or social media.
            </li>
            <li>
              <strong>Website usage</strong> — technical data such as IP address,
              browser type, and pages visited (see our{" "}
              <Link href="/cookie-policy">Cookie Policy</Link>).
            </li>
          </ul>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="How we use your data" />
        <ProseBlock>
          <p>We use your personal data to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Process class bookings and manage your account</li>
            <li>Communicate about classes, schedule changes, and studio updates</li>
            <li>Ensure health, safety, and safeguarding in our sessions</li>
            <li>
              Verify parental consent for child members and review identification
              documents for safeguarding
            </li>
            <li>Respond to enquiries and provide customer support</li>
            <li>Improve our website, services, and community offerings</li>
            <li>Meet legal, insurance, and regulatory obligations</li>
          </ul>
          <p>
            We process data on lawful bases including contract performance,
            legitimate interests (such as running a safe studio), legal
            obligation, and — where required — your consent (for example, marketing
            communications).
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Sharing & retention" />
        <ProseBlock>
          <p>
            We do not sell your personal data. We may share information with
            trusted third parties where necessary — for example, booking
            platforms, payment processors, email services, or professional
            advisers — always under appropriate data protection safeguards.
          </p>
          <p>
            We retain personal data only for as long as needed for the purposes
            described above, including legal, accounting, and insurance
            requirements. Health and safety records may be kept for a defined
            period in line with industry practice. Parent or guardian
            identification documents are stored privately, accessible only to
            authorised studio staff, and are deleted when the related child
            membership ends plus any period we must keep them for safeguarding,
            insurance, or legal reasons.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Your rights" />
        <ProseBlock>
          <p>
            Under UK data protection law (including the UK GDPR), you may have
            the right to:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request erasure in certain circumstances</li>
            <li>Object to or restrict processing in certain circumstances</li>
            <li>Request data portability where applicable</li>
            <li>Withdraw consent where processing is consent-based</li>
          </ul>
          <p>
            To exercise your rights, contact us at{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>. You also
            have the right to lodge a complaint with the Information
            Commissioner&apos;s Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            . Our ICO registration number is <strong>C1988786</strong>.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Security & updates" />
        <ProseBlock>
          <p>
            We take appropriate technical and organisational measures to protect
            your personal data against unauthorised access, loss, or misuse.
            However, no method of transmission over the internet is completely
            secure.
          </p>
          <p>
            We may update this Data Privacy notice from time to time. Material
            changes will be reflected on this page. Please check back periodically
            or contact us if you have questions.
          </p>
          <p className="text-sm text-muted">
            Last updated: August 2026
          </p>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
