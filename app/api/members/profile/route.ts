import { NextResponse } from "next/server";
import { ensureGoogleProfileImage } from "@/lib/google-auth-service";
import { getMemberSession } from "@/lib/member-auth";
import {
  profileSelectFields,
  serializeDisciplineSkills,
  serializeNotificationPreferences,
  toMemberProfile,
} from "@/lib/member-profile-service";
import type { DisciplineSkills, NotificationPreferences } from "@/lib/profile-config";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

type ProfileBody = {
  name?: string;
  phone?: string;
  image?: string;
  dateOfBirth?: string | null;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  injuriesLimitations?: string;
  allergiesSafetyAlerts?: string;
  safetyConsent?: boolean;
  experienceLevel?: string | null;
  disciplineInterests?: string[];
  disciplineSkills?: DisciplineSkills;
  notificationPreferences?: NotificationPreferences;
  currentPassword?: string;
  newPassword?: string;
};

export async function GET() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  await ensureGoogleProfileImage(session.userId);

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: profileSelectFields,
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ profile: toMemberProfile(user) });
}

export async function PATCH(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: ProfileBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.image !== undefined) data.image = body.image.trim() || null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.emergencyContactName !== undefined) {
    data.emergencyContactName = body.emergencyContactName.trim() || null;
  }
  if (body.emergencyContactRelationship !== undefined) {
    data.emergencyContactRelationship = body.emergencyContactRelationship.trim() || null;
  }
  if (body.emergencyContactPhone !== undefined) {
    data.emergencyContactPhone = body.emergencyContactPhone.trim() || null;
  }
  if (body.medicalNotes !== undefined) data.medicalNotes = body.medicalNotes.trim() || null;
  if (body.injuriesLimitations !== undefined) {
    data.injuriesLimitations = body.injuriesLimitations.trim() || null;
  }
  if (body.allergiesSafetyAlerts !== undefined) {
    data.allergiesSafetyAlerts = body.allergiesSafetyAlerts.trim() || null;
  }
  if (body.safetyConsent !== undefined) {
    data.safetyConsentAt = body.safetyConsent ? new Date() : null;
  }
  if (body.disciplineSkills !== undefined) {
    data.disciplineInterests = serializeDisciplineSkills(body.disciplineSkills);
    data.experienceLevel = null;
  } else if (body.disciplineInterests !== undefined) {
    // Legacy: interests list only — default each to beginner (or provided experienceLevel).
    const level =
      body.experienceLevel && typeof body.experienceLevel === "string"
        ? body.experienceLevel
        : "beginner";
    const skills: DisciplineSkills = {};
    for (const id of body.disciplineInterests) {
      skills[id] = level;
    }
    data.disciplineInterests = serializeDisciplineSkills(skills);
    data.experienceLevel = null;
  } else if (body.experienceLevel !== undefined) {
    data.experienceLevel = body.experienceLevel || null;
  }
  if (body.notificationPreferences !== undefined) {
    data.notificationPreferences = serializeNotificationPreferences(body.notificationPreferences);
  }

    if (body.newPassword) {
    if (user.guardianUserId) {
      return NextResponse.json(
        {
          error:
            "The household password belongs to the parent login. Switch to the parent account to change it.",
        },
        { status: 400 },
      );
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Password changes are not available." },
        { status: 400 },
      );
    }

    const currentPassword = body.currentPassword ?? "";
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    data.passwordHash = hashPassword(body.newPassword);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes submitted." }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data,
    select: profileSelectFields,
  });

  return NextResponse.json({ profile: toMemberProfile(updated) });
}
