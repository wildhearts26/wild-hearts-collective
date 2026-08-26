import { classes, contact, siteConfig } from "@/lib/site-data";
import { teamMembers } from "@/lib/team-data";

export type SearchDoc = {
  title: string;
  href: string;
  description: string;
  keywords: string[];
};

const staticDocs: SearchDoc[] = [
  {
    title: "Home",
    href: "/",
    description: siteConfig.tagline,
    keywords: ["wild hearts", "mansfield", "aerial", "pole", "studio"],
  },
  {
    title: "About Us",
    href: "/about",
    description:
      "Mission, values, and the qualified teaching team behind Wild Hearts Collective.",
    keywords: ["about", "mission", "values", "inclusive"],
  },
  {
    title: "Our Team",
    href: "/about/team",
    description: "Meet the co-founders and instructors at Wild Hearts Collective.",
    keywords: ["team", "instructors", "teachers", "co-founders"],
  },
  {
    title: "Classes",
    href: "/classes",
    description: "Browse pole, aerial hoop, silks, juniors, workshops, and courses.",
    keywords: ["classes", "timetable", "book", "levels"],
  },
  {
    title: "Book a Class",
    href: "/book",
    description: "Book aerial and pole classes online in advance.",
    keywords: ["book", "booking", "reserve", "pay"],
  },
  {
    title: "Membership",
    href: "/membership",
    description: "Studio membership options and member benefits.",
    keywords: ["membership", "member", "subscribe"],
  },
  {
    title: "Community Hub",
    href: "/community",
    description: "Community space and events at Wild Hearts Collective.",
    keywords: ["community", "hub", "events"],
  },
  {
    title: "Parties & Events",
    href: "/parties",
    description: "Party packages for birthdays and celebrations.",
    keywords: ["parties", "birthday", "events", "celebration"],
  },
  {
    title: "Studio Hire",
    href: "/hire",
    description: "Hire the studio for training, shoots, or private sessions.",
    keywords: ["hire", "rent", "private", "studio"],
  },
  {
    title: "Shop",
    href: "/shop",
    description: "Studio merchandise and kit.",
    keywords: ["shop", "merch", "kit"],
  },
  {
    title: "Reviews",
    href: "/reviews",
    description: "Student reviews and Google feedback for Wild Hearts Collective.",
    keywords: ["reviews", "testimonials", "google"],
  },
  {
    title: "Contact",
    href: "/contact",
    description: `Find us at ${contact.address}. Call ${contact.phone} or email ${contact.email}.`,
    keywords: ["contact", "address", "phone", "email", "directions", "mansfield"],
  },
  {
    title: "FAQs",
    href: "/faqs",
    description: "Answers about booking, what to wear, beginners, and children.",
    keywords: ["faq", "questions", "beginners", "wear", "children"],
  },
];

export function getSearchIndex(): SearchDoc[] {
  return [
    ...staticDocs,
    ...classes.map((item) => ({
      title: item.title,
      href: item.href,
      description: item.shortDescription,
      keywords: [item.slug, "class", "aerial", "pole", item.levels.toLowerCase()],
    })),
    ...teamMembers.map((member) => ({
      title: `${member.name} — ${member.role}`,
      href: `/about/team/${member.slug}`,
      description: member.shortBio,
      keywords: [member.name.toLowerCase(), "instructor", "team", member.role.toLowerCase()],
    })),
  ];
}

export function searchSite(query: string): SearchDoc[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) return [];

  return getSearchIndex()
    .map((doc) => {
      const haystack = [doc.title, doc.description, ...doc.keywords]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce(
        (sum, term) => sum + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { doc, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map((row) => row.doc);
}
