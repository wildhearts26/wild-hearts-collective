import { formatUkDateShort } from "@/lib/booking-config";
import { db } from "@/lib/db";

export type PublicSiteReview = {
  id: string;
  displayName: string;
  rating: number;
  comments: string;
  classTitle: string | null;
  submittedAtLabel: string | null;
  source: "member" | "featured";
};

/** Curated genuine reviews from past students (shown on /reviews). */
export const featuredSiteReviews: PublicSiteReview[] = [
  {
    id: "featured-1",
    displayName: "Sarah",
    rating: 5,
    comments:
      "Jacqui is an incredible instructor. She knows each of her students abilities and encourages you just enough to make you believe in yourself. She is an amazing lady and a formidable instructor. If you need support, guidance and giggles, Jacqui is the instructor for you.",
    classTitle: null,
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-2",
    displayName: "Maisie",
    rating: 5,
    comments:
      'I will always wish I had started pole dancing sooner. It has helped me in ways I never expected. I began with very little strength and low self-confidence, but since starting, I have felt so much healthier - without the repetitive, chore-like feeling I often associated with going to the gym. The confidence I have gained is incredible. I went from attending classes in a T-shirt and the longest shorts possible to confidently sharing full choreography videos without worrying whether my stomach looks a little "too out". Along the way, I have met so many wonderful, supportive, and empowering people, that i know i can count on for things outside classes. Pole dancing has changed not only how I feel physically, but also how I see and appreciate myself.',
    classTitle: "Pole",
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-3",
    displayName: "Morgan",
    rating: 5,
    comments:
      "Jacqui is an incredibly supportive instructor, makes even the most complicated silks moves easy to understand, always brings the best energy.",
    classTitle: "Aerial Silks",
    submittedAtLabel: null,
    source: "featured",
  },
  {
    id: "featured-4",
    displayName: "Louise",
    rating: 5,
    comments:
      "I started my pole journey a while ago and reached a point where I just seemed to plateau. This was when I went to Rosie’s class and never looked back! This woman believed in me and her other students when we didn’t believe in ourselves. She knew our limits and she pushed us (safely ofc) to excel. Rosie’s classes are Rosie’s personality in a room- which is an absolute vibe! Unwavering support, an ungodly amount of cheering and just literal joy. She made me fall in love with the sport again and I’ve been waiting patiently for her return, that’s how amazing she is as a person and instructor! She’s our pole mama for a reason❤️ Love you Rosie!",
    classTitle: "Pole",
    submittedAtLabel: null,
    source: "featured",
  },
];

function feedbackClient() {
  if (!("classFeedback" in db) || !db.classFeedback) {
    return null;
  }
  return db.classFeedback;
}

/** First name + optional last initial for public display. */
export function formatReviewDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Studio friend";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Curated featured reviews first, then any member feedback submitted
 * with “share on website” opted in.
 */
export async function listPublicSiteReviews(limit = 24): Promise<PublicSiteReview[]> {
  const client = feedbackClient();
  if (!client) return featuredSiteReviews.slice(0, limit);

  try {
    const take = Math.max(0, limit - featuredSiteReviews.length);
    const rows =
      take === 0
        ? []
        : await client.findMany({
            where: {
              shareOnWebsite: true,
              submittedAt: { not: null },
              comments: { not: null },
              rating: { gte: 1 },
            },
            orderBy: { submittedAt: "desc" },
            take,
            select: {
              id: true,
              name: true,
              rating: true,
              comments: true,
              classTitle: true,
              submittedAt: true,
            },
          });

    const memberReviews: PublicSiteReview[] = [];
    for (const row of rows) {
      const comments = row.comments?.trim() ?? "";
      if (!comments || row.rating == null) continue;
      memberReviews.push({
        id: row.id,
        displayName: formatReviewDisplayName(row.name),
        rating: row.rating,
        comments,
        classTitle: row.classTitle,
        submittedAtLabel: row.submittedAt
          ? formatUkDateShort(row.submittedAt)
          : null,
        source: "member",
      });
    }

    return [...featuredSiteReviews, ...memberReviews].slice(0, limit);
  } catch (error) {
    console.error("[reviews] failed to load public feedback:", error);
    return featuredSiteReviews.slice(0, limit);
  }
}
