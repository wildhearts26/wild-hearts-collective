import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/geo";

export const DEFAULT_OG_IMAGE = "/og-default.jpg";

const OG_IMAGE = {
  url: DEFAULT_OG_IMAGE,
  width: 1200,
  height: 630,
  alt: "Wild Hearts Collective aerial and pole studio in Mansfield",
};

export function pageSeo({
  title,
  description,
  path,
  image,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const url = path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
  const ogImage = image
    ? { url: image, width: 1200, height: 630, alt: title }
    : OG_IMAGE;
  const socialTitle = title.includes("Wild Hearts Collective")
    ? title
    : `${title} | Wild Hearts Collective`;

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: "Wild Hearts Collective",
      title: socialTitle,
      description,
      url,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [ogImage.url],
    },
    robots: index
      ? undefined
      : { index: false, follow: true },
  };
}
