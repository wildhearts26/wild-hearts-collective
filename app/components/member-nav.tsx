"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MemberLogoutButton } from "@/app/components/member-logout-button";
import { MemberSwitcher } from "@/app/components/member-switcher";
import type { PublicMember } from "@/lib/member-auth";
import { memberTypeLabel } from "@/lib/household-config";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/profile", label: "Profile", exact: false },
  { href: "/account/family", label: "Family", exact: false },
  { href: "/account/bookings", label: "Bookings", exact: false },
  { href: "/account/parq", label: "PAR-Q", exact: false },
  { href: "/account/credits", label: "Credits", exact: false },
];

export function MemberNav({ member }: { member: PublicMember }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-plum/10 bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {member.isChild ? "Child member" : "Member account"}
          </p>
          <h1 className="font-display text-3xl text-plum">Hi, {member.name.split(" ")[0]}</h1>
          {member.household.length > 1 ? (
            <p className="mt-1 text-sm text-muted">
              Booking and paying as {member.name} ({memberTypeLabel(member.memberType)})
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {member.household.length > 1 ? (
            <div className="w-full min-w-[16rem] sm:w-64">
              <MemberSwitcher members={member.household} compact />
            </div>
          ) : null}
          <nav aria-label="Account navigation" className="flex flex-wrap gap-2">
            {links.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-sm px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-sage text-white"
                      : "border border-plum/15 bg-white text-plum hover:border-pink hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <MemberLogoutButton />
        </div>
      </div>
    </div>
  );
}
