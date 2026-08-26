import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { contact } from "@/lib/site-data";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Cookie Policy",
  description:
    "How Wild Hearts Collective uses cookies and similar technologies on this website.",
  path: "/cookie-policy",
  image: heroImages.terms,
});

export default function CookiePolicyPage() {
  return (
    <>
      <PageHero
        title="Cookie Policy"
        subtitle="How we use cookies and similar technologies on our website."
        image="terms"
      />

      <ContentSection>
        <SectionHeading title="What are cookies?" />
        <ProseBlock>
          <p>
            Cookies are small text files stored on your device when you visit a
            website. They help the site remember preferences, understand how
            pages are used, and improve your experience.
          </p>
          <p>
            This policy explains how Wild Hearts Collective (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) uses cookies on{" "}
            <strong>wildheartscollective.org</strong> and related pages.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Cookies we use" />
        <ProseBlock>
          <p>
            <strong>Strictly necessary cookies</strong> — required for the site
            to function, such as remembering booking form progress or security
            settings. These cannot be switched off in our systems.
          </p>
          <p>
            <strong>Functional cookies</strong> — help us remember choices you
            make (for example, dismissed notices) so the site works more smoothly
            on return visits.
          </p>
          <p>
            <strong>Analytics cookies</strong> — if enabled, these help us
            understand how visitors use our site (such as which pages are most
            popular) so we can improve content and navigation. We use aggregated,
            anonymised data where possible.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Third-party cookies" />
        <ProseBlock>
          <p>
            Some features may set cookies from third parties — for example,
            embedded booking tools, video players, or social media links. We do
            not control these cookies. Please review the relevant third-party
            privacy and cookie policies for more information.
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Managing cookies" />
        <ProseBlock>
          <p>
            You can control or delete cookies through your browser settings.
            Most browsers allow you to block all cookies, block third-party
            cookies only, or clear cookies when you close the browser.
          </p>
          <p>
            Please note that disabling certain cookies may affect how parts of
            our website work, including online booking.
          </p>
          <p>
            For guidance on managing cookies in popular browsers, visit your
            browser&apos;s help pages or{" "}
            <a
              href="https://www.aboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutcookies.org
            </a>
            .
          </p>
        </ProseBlock>
      </ContentSection>

      <ContentSection>
        <SectionHeading title="Updates & contact" />
        <ProseBlock>
          <p>
            We may update this Cookie Policy from time to time. The latest
            version will always be published on this page.
          </p>
          <p>
            If you have questions about our use of cookies, please contact us at{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a> or via our{" "}
            <Link href="/contact">Contact page</Link>.
          </p>
          <p className="text-sm text-muted">
            Last updated: July 2026
          </p>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
