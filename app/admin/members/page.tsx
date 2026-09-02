import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminMemberAvatar } from "@/app/components/admin-member-avatar";
import { AdminMemberFilters } from "@/app/components/admin-member-filters";
import { AdminNav } from "@/app/components/admin-nav";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  membershipStatusLabel,
  membershipStatusTone,
  MEMBERSHIP_STATUS,
} from "@/lib/membership-config";
import {
  adminMemberOrderBy,
  parseAdminMemberSort,
} from "@/lib/admin-members-list";
import { formatUkDateTimeShort } from "@/lib/booking-config";
import { formatCredits } from "@/lib/credit-units";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Members",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
};

export default async function AdminMembersPage({ searchParams }: PageProps) {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.members);

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const sort = parseAdminMemberSort(params.sort);

  const members = await db.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {},
    orderBy: adminMemberOrderBy(sort),
    include: {
      oauthAccounts: { select: { provider: true, profileImageUrl: true } },
      _count: { select: { bookings: true } },
    },
  });

  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const newThisWeek = members.filter((member) => member.createdAt.getTime() >= weekAgo).length;
  const activeCount = members.filter(
    (member) => member.membershipStatus === MEMBERSHIP_STATUS.active,
  ).length;

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Members</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Search members, sort by name, credits, or bookings, and open a profile for safety
            details and membership controls.
          </p>
          <AdminNav active="members" permissions={session.permissions} />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Showing</p>
          <p className="mt-2 font-display text-3xl text-plum">{members.length}</p>
        </div>
        <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Active (filtered)</p>
          <p className="mt-2 font-display text-3xl text-plum">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-plum/10 bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">New this week</p>
          <p className="mt-2 font-display text-3xl text-plum">{newThisWeek}</p>
        </div>
      </div>

      <Suspense fallback={<div className="mt-8 h-16 rounded-lg border border-plum/10 bg-surface" />}>
        <AdminMemberFilters initialQuery={query} initialSort={sort} />
      </Suspense>

      <div className="mt-6 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        {members.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No members match your filters.</p>
        ) : (
          <div className="min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="w-[11%] px-3 py-3 font-semibold">Registered</th>
                  <th className="w-[18%] px-3 py-3 font-semibold">Name</th>
                  <th className="w-[18%] px-3 py-3 font-semibold">Email</th>
                  <th className="w-[12%] px-3 py-3 font-semibold">Status</th>
                  <th className="w-[10%] px-3 py-3 font-semibold">Credits</th>
                  <th className="w-[9%] px-3 py-3 font-semibold">Bookings</th>
                  <th className="w-[18%] px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const signupMethod = member.oauthAccounts.some(
                    (account) => account.provider === "google",
                  )
                    ? "Google"
                    : "Email";
                  const image =
                    member.image ??
                    member.oauthAccounts.find((account) => account.profileImageUrl)
                      ?.profileImageUrl ??
                    null;

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-plum/8 align-top last:border-b-0"
                    >
                      <td className="px-3 py-3 text-muted">
                        {formatUkDateTimeShort(member.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-3">
                          <AdminMemberAvatar name={member.name} image={image} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/members/${member.id}`}
                              className="block truncate font-medium text-plum hover:text-brand hover:underline"
                              title={member.name}
                            >
                              {member.name}
                            </Link>
                            <p className="mt-1 text-xs text-muted">
                              {signupMethod}
                              {member.memberType === "child" ? " · Child" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={`mailto:${member.email}`}
                          className="block truncate text-plum hover:text-pink hover:underline"
                          title={member.email}
                        >
                          {member.email}
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${membershipStatusTone(member.membershipStatus)}`}
                        >
                          {membershipStatusLabel(member.membershipStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-plum">
                        {formatCredits(member.creditsRemaining)}
                      </td>
                      <td className="px-3 py-3 text-muted">{member._count.bookings}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="text-sm font-semibold text-brand hover:underline"
                        >
                          View profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
