import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminMemberDetail } from "@/app/components/admin-member-detail";
import { AdminNav } from "@/app/components/admin-nav";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { profileSelectFields, toMemberProfile } from "@/lib/member-profile-service";
import { getParQStatus } from "@/lib/parq-service";
import { getLatestIdDocumentMeta } from "@/lib/household-service";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Member details",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMemberDetailPage({ params }: PageProps) {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.members);

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...profileSelectFields,
      internalNotes: true,
      oauthAccounts: { select: { provider: true, profileImageUrl: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) notFound();

  const profileImage =
    user.image ??
    user.oauthAccounts.find((account) => account.profileImageUrl)?.profileImageUrl ??
    null;

  const [timeline, recentBookings, auditLogs, parQStatus, guardian, householdChildren, idDocument] =
    await Promise.all([
    db.membershipEvent.findMany({
      where: { userId: id },
      orderBy: { effectiveAt: "desc" },
      take: 20,
    }),
    db.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { session: { include: { class: true } } },
    }),
    db.adminAuditLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getParQStatus(id),
    user.guardianUserId
      ? db.user.findUnique({
          where: { id: user.guardianUserId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    db.user.findMany({
      where: { guardianUserId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getLatestIdDocumentMeta(id),
  ]);

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <Link href="/admin/members" className="text-sm font-semibold text-brand hover:underline">
            ← Back to members
          </Link>
          <h1 className="mt-3 font-display text-4xl text-plum sm:text-5xl">{user.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Full member profile, safety information, and membership lifecycle controls.
          </p>
          <AdminNav active="members" permissions={session.permissions} />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10">
        <AdminMemberDetail
          memberId={id}
          initialMember={{
            ...toMemberProfile(user),
            image: profileImage,
            internalNotes: user.internalNotes,
            signupMethod: user.oauthAccounts.some((account) => account.provider === "google")
              ? "Google"
              : "Email",
            bookingCount: user._count.bookings,
          }}
          timeline={timeline.map((event) => ({
            id: event.id,
            type: event.type,
            note: event.note,
            effectiveAt: event.effectiveAt.toISOString(),
            endsAt: event.endsAt?.toISOString() ?? null,
            createdBy: event.createdBy,
          }))}
          recentBookings={recentBookings.map((booking) => ({
            id: booking.id,
            status: booking.status,
            attendance: booking.attendance,
            classTitle: booking.session.class.title,
            startsAt: booking.session.startsAt.toISOString(),
          }))}
          auditLogs={auditLogs.map((entry) => ({
            id: entry.id,
            action: entry.action,
            adminLabel: entry.adminLabel,
            details: entry.details,
            createdAt: entry.createdAt.toISOString(),
          }))}
          parQStatus={{
            completed: parQStatus?.completed ?? false,
            completedAt: parQStatus?.completedAt ?? null,
            data: (parQStatus?.data as Record<string, unknown> | null) ?? null,
          }}
          guardian={guardian}
          householdChildren={householdChildren}
          idDocument={
            idDocument
              ? {
                  id: idDocument.id,
                  fileName: idDocument.fileName,
                  mimeType: idDocument.mimeType,
                  uploadedAt: idDocument.uploadedAt.toISOString(),
                  status: idDocument.status,
                  reviewedAt: idDocument.reviewedAt?.toISOString() ?? null,
                  reviewNote: idDocument.reviewNote,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
