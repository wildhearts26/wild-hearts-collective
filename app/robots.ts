import type { MetadataRoute } from "next";
import { LIVE_SITE_URL } from "@/lib/booking-config";

const siteUrl = LIVE_SITE_URL.replace(/\/$/, "");

const sharedDisallow = [
  "/admin/",
  "/account/",
  "/api/",
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/feedback/",
  "/bundles",
  "/shop/success",
  "/book/success",
  "/hero/_originals/",
  "/Final changes/",
];

const aiUserAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
  "cohere-ai",
  "YouBot",
  "DuckAssistBot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: sharedDisallow,
      },
      ...aiUserAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: sharedDisallow,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
