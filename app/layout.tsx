import type { Metadata, Viewport } from "next";
import { Raleway, Satisfy } from "next/font/google";
import {
  SITE_ORIGIN,
  faqPageJsonLd,
  homepageFaqs,
  jsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/geo";
import { getLocalBusinessJsonLd } from "@/lib/local-business-jsonld";
import { CookieConsent } from "./components/cookie-consent";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./globals.css";

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebe4da",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Wild Hearts Collective | Pole & Aerial Classes in Mansfield",
    template: "%s | Wild Hearts Collective",
  },
  description:
    "Inclusive aerial and pole studio in Mansfield offering pole, hoop, silks, and creative arts for all ages, abilities, and backgrounds.",
  applicationName: "Wild Hearts Collective",
  authors: [{ name: "Wild Hearts Collective", url: SITE_ORIGIN }],
  creator: "Wild Hearts Collective",
  publisher: "Wild Hearts Collective Limited",
  category: "Fitness",
  manifest: "/manifest.webmanifest",
  alternates: {
    types: {
      "text/plain": [
        { url: `${SITE_ORIGIN}/llms.txt`, title: "LLM instructions" },
        { url: `${SITE_ORIGIN}/llms-full.txt`, title: "LLM full summary" },
      ],
      "application/rss+xml": `${SITE_ORIGIN}/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Wild Hearts Collective",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Wild Hearts Collective aerial and pole studio in Mansfield",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    organizationJsonLd(),
    getLocalBusinessJsonLd(),
    websiteJsonLd(),
    faqPageJsonLd(homepageFaqs(), { pagePath: "/" }),
  ];

  return (
    <html
      lang="en-GB"
      className={`${satisfy.variable} ${raleway.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">
        {structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
          />
        ))}
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
