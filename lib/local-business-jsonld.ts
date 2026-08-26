import { BUSINESS_ID, ORG_ID, PREFERRED_CITATION, SITE_ORIGIN } from "@/lib/geo";
import { contact, socialLinks } from "@/lib/site-data";

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": BUSINESS_ID,
    name: contact.name,
    url: SITE_ORIGIN,
    telephone: "+441158718090",
    email: contact.email,
    image: `${SITE_ORIGIN}/og-default.jpg`,
    logo: `${SITE_ORIGIN}/logo/logo-email-green.png`,
    description: PREFERRED_CITATION,
    parentOrganization: { "@id": ORG_ID },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Unit 25, Block 7 Hallam Way, Old Mill Lane Industrial Estate",
      addressLocality: "Mansfield",
      postalCode: "NG19 9BG",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.latitude,
      longitude: contact.longitude,
    },
    hasMap: contact.mapsUrl,
    sameAs: [contact.googleBusinessUrl, ...socialLinks.map((link) => link.href)],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "16:00",
        closes: "21:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "17:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "16:00",
      },
    ],
  };
}
