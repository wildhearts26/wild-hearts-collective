import { NextResponse } from "next/server";
import {
  buildMemberAuditChanges,
  describeMemberChanges,
  logAdminAction,
} from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { CREDIT_REASON } from "@/lib/booking-advanced-config";
import {
  profileSelectFields,
  serializeDisciplineSkills,
  toMemberProfile,
} from "@/lib/member-profile-service";
import type { DisciplineSkills } from "@/lib/profile-config";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

type AdminMemberBody = {
  name?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  medicalNotes?: string | null;
  injuriesLimitations?: string | null;
  allergiesSafetyAlerts?: string | null;
  experienceLevel?: string | null;
  disciplineInterests?: string[];
  disciplineSkills?: DisciplineSkills;
  internalNotes?: string | null;
  membershipPlan?: string;
  membershipStatus?: string;
  creditsRemaining?: number;
  accountStatus?: string;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.members);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...profileSelectFields,
      internalNotes: true,
      updatedAt: true,
      oauthAccounts: { select: { provider: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const [timeline, recentBookings, auditLogs] = await Promise.all([
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
  ]);

  return NextResponse.json({
    member: {
      ...toMemberProfile(user),
      internalNotes: user.internalNotes,
      signupMethod: user.oauthAccounts.some((account) => account.provider === "google")
        ? "Google"
        : "Email",
      bookingCount: user._count.bookings,
      updatedAt: user.updatedAt.toISOString(),
    },
    timeline: timeline.map((event) => ({
      id: event.id,
      type: event.type,
      note: event.note,
      effectiveAt: event.effectiveAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      createdBy: event.createdBy,
    })),
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      attendance: booking.attendance,
      classTitle: booking.session.class.title,
      startsAt: booking.session.startsAt.toISOString(),
    })),
    auditLogs: auditLogs.map((entry) => ({
      id: entry.id,
      action: entry.action,
      adminLabel: entry.adminLabel,
      details: entry.details,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.members);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let body: AdminMemberBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.emergencyContactName !== undefined) {
    data.emergencyContactName = body.emergencyContactName?.trim() || null;
  }
  if (body.emergencyContactRelationship !== undefined) {
    data.emergencyContactRelationship = body.emergencyContactRelationship?.trim() || null;
  }
  if (body.emergencyContactPhone !== undefined) {
    data.emergencyContactPhone = body.emergencyContactPhone?.trim() || null;
  }
  if (body.medicalNotes !== undefined) data.medicalNotes = body.medicalNotes?.trim() || null;
  if (body.injuriesLimitations !== undefined) {
    data.injuriesLimitations = body.injuriesLimitations?.trim() || null;
  }
  if (body.allergiesSafetyAlerts !== undefined) {
    data.allergiesSafetyAlerts = body.allergiesSafetyAlerts?.trim() || null;
  }
  if (body.disciplineSkills !== undefined) {
    data.disciplineInterests = serializeDisciplineSkills(body.disciplineSkills);
    data.experienceLevel = null;
  } else if (body.disciplineInterests !== undefined) {
    const level =
      body.experienceLevel && typeof body.experienceLevel === "string"
        ? body.experienceLevel
        : "beginner";
    const skills: DisciplineSkills = {};
    for (const disciplineId of body.disciplineInterests) {
      skills[disciplineId] = level;
    }
    data.disciplineInterests = serializeDisciplineSkills(skills);
    data.experienceLevel = null;
  } else if (body.experienceLevel !== undefined) {
    data.experienceLevel = body.experienceLevel || null;
  }
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes?.trim() || null;
  if (body.membershipPlan !== undefined && body.membershipPlan !== "account") {
    return NextResponse.json(
      { error: "Only the free studio membership is offered. Monthly membership is not available." },
      { status: 400 },
    );
  }
  if (body.membershipStatus !== undefined) data.membershipStatus = body.membershipStatus;
  if (body.creditsRemaining !== undefined) {
    const credits = Number(body.creditsRemaining);
    if (!Number.isFinite(credits) || credits < 0) {
      return NextResponse.json(
        { error: "Class credits must be zero or greater." },
        { status: 400 },
      );
    }
    data.creditsRemaining = Math.round(credits * 100) / 100;
  }
  if (body.accountStatus !== undefined) data.accountStatus = body.accountStatus;

  // Only persist fields that actually changed — avoids noisy audits on Save.
  const changes = buildMemberAuditChanges(
    existing as unknown as Record<string, unknown>,
    data,
  );

  if (changes.length === 0) {
    return NextResponse.json({ error: "No changes submitted." }, { status: 400 });
  }

  const patchData = Object.fromEntries(changes.map((change) => [change.field, change.to]));
  const creditChange = changes.find((change) => change.field === "creditsRemaining");
  const creditDelta = creditChange
    ? Math.round(
        (Number(creditChange.to ?? 0) - Number(creditChange.from ?? 0)) * 100,
      ) / 100
    : 0;

  const updated = await db.$transaction(async (tx) => {
    const member = await tx.user.update({
      where: { id },
      data: patchData,
      select: profileSelectFields,
    });

    // Ledger row only when an admin actually changes the credit balance going forward.
    if (creditChange && creditDelta !== 0) {
      await tx.creditTransaction.create({
        data: {
          userId: id,
          amount: creditDelta,
          balanceAfter: Number(member.creditsRemaining),
          reason: CREDIT_REASON.adminAdjustment,
        },
      });
    }

    return member;
  });

  await logAdminAction({
    action: creditChange ? "member.credits_adjusted" : "member.updated",
    targetUserId: id,
    adminLabel: admin.session.name,
    details: {
      summary: describeMemberChanges(changes),
      changes: changes.map((change) => ({
        field: change.field,
        from: change.from,
        to: change.to,
      })),
      fields: changes.map((change) => change.field),
    },
  });

  return NextResponse.json({ member: toMemberProfile(updated) });
}
