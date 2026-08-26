import { SITE_ORIGIN } from "@/lib/geo";
import { classes, siteConfig } from "@/lib/site-data";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const lastBuildDate = new Date().toUTCString();
  const items = [
    {
      title: siteConfig.name,
      link: SITE_ORIGIN,
      description:
        "Inclusive aerial and pole studio in Mansfield offering pole, hoop, silks, and creative arts.",
    },
    ...classes.map((item) => ({
      title: item.title,
      link: `${SITE_ORIGIN}${item.href}`,
      description: item.shortDescription,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Wild Hearts Collective — Classes</title>
    <link>${SITE_ORIGIN}</link>
    <description>Class catalogue and studio updates from Wild Hearts Collective in Mansfield.</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
    </item>`,
      )
      .join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
