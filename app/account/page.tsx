import type { Metadata } from "next";
import Link from "next/link";
import { MemberLogoutButton } from "@/app/components/member-logout-button";
import { MemberCollapsibleSection } from "@/app/components/member-collapsible-section";
import { BOOKING_URL } from "@/lib/constants";
import { formatSessionDateTime } from "@/lib/booking-config";
import { bookingStatusClassName, bookingStatusLabel } from "@/lib/booking-status-display";
import { expireStalePendingBookings } from "@/lib/booking-service";
import { getCurrentMember } from "@/lib/member-auth";
import {
  calculateProfileCompletion,
  profileSelectFields,
} from "@/lib/member-profile-service";
import { db } from "@/lib/db";
import { enrolMemberInRemainingCourseWeeks } from "@/lib/course-series";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  await expireStalePendingBookings();
  await enrolMemberInRemainingCourseWeeks(member.id);

  const [upcomingBookings, recentBookings, profileRecord] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: member.id,
        session: { startsAt: { gte: new Date() } },
        status: { in: ["pending", "confirmed"] },
      },
      orderBy: { session: { startsAt: "asc" } },
      take: 5,
      include: {
        session: { include: { class: true } },
      },
    }),
    db.booking.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        session: { include: { class: true } },
      },
    }),
    db.user.findUnique({
      where: { id: member.id },
      select: profileSelectFields,
    }),
  ]);

  const profileCompletion = profileRecord
    ? calculateProfileCompletion(profileRecord)
    : { percent: 0, missingSteps: [] as string[] };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {profileCompletion.percent < 100 && (
        <div className="mb-8 rounded-sm border border-pink/30 bg-pink-soft/40 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-plum">Complete your profile</p>
              <p className="mt-1 text-sm text-muted">
                {profileCompletion.percent}% complete — help us keep you safe and tailor your
                studio experience.
              </p>
            </div>
            <Link
              href="/account/profile"
              className="rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              Continue profile
            </Link>
          </div>
          {profileCompletion.missingSteps.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profileCompletion.missingSteps.slice(0, 3).map((step) => (
                <li
                  key={step}
                  className="rounded-full border border-plum/10 bg-white px-3 py-1 text-xs text-muted"
                >
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-sm border border-plum/10 bg-surface p-6">
          <h2 className="font-display text-3xl text-plum">Upcoming classes</h2>
          {upcomingBookings.length === 0 ? (
            <div className="mt-6">
              <p className="text-sm text-muted">You don&apos;t have any upcoming bookings yet.</p>
              <Link
                href={BOOKING_URL}
                className="mt-4 inline-block rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
              >
                Book a class
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {upcomingBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-sm border border-plum/10 bg-white px-4 py-4"
                >
                  <p className="font-semibold text-plum">{booking.session.class.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatSessionDateTime(booking.session.startsAt)}
                  </p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${bookingStatusClassName(booking.status)}`}
                    >
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-sm border border-plum/10 bg-surface p-6">
            <h2 className="font-display text-2xl text-plum">Class credits</h2>
            <p className="mt-2 text-sm text-muted">
              Pay with credits when booking instead of paying the class fee each time.
            </p>
            <p className="mt-4 font-display text-4xl text-plum">{member.creditsRemaining}</p>
            <p className="mt-1 text-sm text-muted">
              {member.creditsRemaining === 1 ? "credit available" : "credits available"}
            </p>
            <Link
              href="/account/credits"
              className="mt-4 inline-block rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              Manage credits
            </Link>
          </section>

          <section className="rounded-sm border border-plum/10 bg-surface p-6">
            <h2 className="font-display text-2xl text-plum">Family members</h2>
            <p className="mt-2 text-sm text-muted">
              Add child members who share this email. They keep their own bookings, credits, and
              payments.
            </p>
            {member.household.length > 1 ? (
              <ul className="mt-4 space-y-2 text-sm text-plum">
                {member.household.map((person) => (
                  <li key={person.id}>
                    {person.name}
                    {person.isActive ? " (active)" : ""}
                    {person.memberType === "child" ? " — child" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">No child members added yet.</p>
            )}
            <Link
              href="/account/family"
              className="mt-4 inline-block rounded-sm bg-sage px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              {member.household.length > 1 ? "Manage family" : "Add a child member"}
            </Link>
          </section>

          <section className="rounded-sm border border-plum/10 bg-surface p-6">
            <h2 className="font-display text-2xl text-plum">Quick links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={BOOKING_URL} className="font-semibold text-brand hover:underline">
                  Book a class
                </Link>
              </li>
              <li>
                <Link
                  href="/account/bookings"
                  className="font-semibold text-brand hover:underline"
                >
                  View all bookings
                </Link>
              </li>
              <li>
                <Link
                  href="/account/credits"
                  className="font-semibold text-brand hover:underline"
                >
                  Class credits
                </Link>
              </li>
              <li>
                <Link
                  href="/account/family"
                  className="font-semibold text-brand hover:underline"
                >
                  Family members
                </Link>
              </li>
              <li>
                <Link
                  href="/account/profile"
                  className="font-semibold text-brand hover:underline"
                >
                  Edit profile
                </Link>
              </li>
              <li>
                <MemberLogoutButton />
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {recentBookings.length > 0 && (
        <MemberCollapsibleSection title="Recent activity">
          <ul className="mt-4 divide-y divide-plum/10">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-plum">{booking.session.class.title}</p>
                    <p className="text-sm text-muted">
                      {formatSessionDateTime(booking.session.startsAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${bookingStatusClassName(booking.status)}`}
                  >
                    {bookingStatusLabel(booking.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </MemberCollapsibleSection>
      )}
    </div>
  );
}
