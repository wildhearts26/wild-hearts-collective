import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isDisciplineInterestId,
  isExperienceLevelId,
  type DisciplineSkills,
  type NotificationPreferences,
} from "@/lib/profile-config";

export type ProfileUserRecord = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  dateOfBirth: Date | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  injuriesLimitations: string | null;
  allergiesSafetyAlerts: string | null;
  safetyConsentAt: Date | null;
  experienceLevel: string | null;
  disciplineInterests: string | null;
  notificationPreferences: string | null;
  membershipPlan: string;
  membershipStatus: string;
  accountStatus: string;
  membershipStartedAt: Date | null;
  membershipRenewsAt: Date | null;
  membershipPausedAt: Date | null;
  membershipResumeAt: Date | null;
  membershipCancelledAt: Date | null;
  cancellationReason: string | null;
  creditsRemaining: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  memberType?: string | null;
  guardianUserId?: string | null;
  parentalConsentAt?: Date | null;
  parentalConsentName?: string | null;
  parentalConsentRelationship?: string | null;
  parentalConsentVersion?: string | null;
  createdAt: Date;
};

export type MemberProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  dateOfBirth: string | null;
  emergencyContact: {
    name: string | null;
    relationship: string | null;
    phone: string | null;
  };
  healthSafety: {
    medicalNotes: string | null;
    injuriesLimitations: string | null;
    allergiesSafetyAlerts: string | null;
    safetyConsentAt: string | null;
  };
  /** @deprecated Prefer disciplineSkills — kept for older clients. */
  experienceLevel: string | null;
  disciplineInterests: string[];
  disciplineSkills: DisciplineSkills;
  notificationPreferences: NotificationPreferences;
  membership: {
    plan: string;
    status: string;
    accountStatus: string;
    startedAt: string | null;
    renewsAt: string | null;
    pausedAt: string | null;
    resumeAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    creditsRemaining: number;
    hasStripeSubscription: boolean;
  };
  memberType: string;
  isChild: boolean;
  guardianUserId: string | null;
  parentalConsent: {
    givenAt: string | null;
    name: string | null;
    relationship: string | null;
    version: string | null;
  };
  profileCompletion: {
    percent: number;
    missingSteps: string[];
  };
  createdAt: string;
};

function parseJsonArray(value: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Reads per-discipline skill levels from `disciplineInterests`.
 * Supports the new map shape and the legacy string-array + global experienceLevel.
 */
export function parseDisciplineSkills(
  interestsValue: string | null,
  experienceLevel: string | null = null,
): DisciplineSkills {
  if (!interestsValue) return {};

  try {
    const parsed = JSON.parse(interestsValue) as unknown;

    if (Array.isArray(parsed)) {
      const fallback =
        experienceLevel && isExperienceLevelId(experienceLevel)
          ? experienceLevel
          : "beginner";
      const skills: DisciplineSkills = {};
      for (const item of parsed) {
        if (typeof item === "string" && isDisciplineInterestId(item)) {
          skills[item] = fallback;
        }
      }
      return skills;
    }

    if (parsed && typeof parsed === "object") {
      const skills: DisciplineSkills = {};
      for (const [discipline, level] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        if (
          isDisciplineInterestId(discipline) &&
          typeof level === "string" &&
          isExperienceLevelId(level)
        ) {
          skills[discipline] = level;
        }
      }
      return skills;
    }
  } catch {
    return {};
  }

  return {};
}

export function serializeDisciplineSkills(skills: DisciplineSkills) {
  const cleaned: DisciplineSkills = {};

  for (const [discipline, level] of Object.entries(skills)) {
    if (isDisciplineInterestId(discipline) && isExperienceLevelId(level)) {
      cleaned[discipline] = level;
    }
  }

  return JSON.stringify(cleaned);
}

/** @deprecated Use serializeDisciplineSkills */
export function serializeDisciplineInterests(interests: string[]) {
  const skills: DisciplineSkills = {};
  for (const id of interests) {
    if (isDisciplineInterestId(id)) {
      skills[id] = "beginner";
    }
  }
  return serializeDisciplineSkills(skills);
}

export function parseNotificationPreferences(value: string | null): NotificationPreferences {
  if (!value) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function serializeNotificationPreferences(prefs: NotificationPreferences) {
  return JSON.stringify(prefs);
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function calculateProfileCompletion(user: ProfileUserRecord) {
  const skills = parseDisciplineSkills(user.disciplineInterests, user.experienceLevel);

  const steps: { id: string; label: string; complete: boolean }[] = [
    { id: "photo", label: "Add a profile photo", complete: Boolean(user.image) },
    { id: "phone", label: "Add your phone number", complete: Boolean(user.phone) },
    {
      id: "emergency",
      label: "Add an emergency contact",
      complete: Boolean(user.emergencyContactName && user.emergencyContactPhone),
    },
    {
      id: "skills",
      label: "Choose interests and set a skill level for each",
      complete: Object.keys(skills).length > 0,
    },
    {
      id: "safety",
      label: "Review health & safety information",
      complete: Boolean(user.safetyConsentAt),
    },
  ];

  const completeCount = steps.filter((step) => step.complete).length;
  const percent = Math.round((completeCount / steps.length) * 100);

  return {
    percent,
    missingSteps: steps.filter((step) => !step.complete).map((step) => step.label),
  };
}

export function toMemberProfile(user: ProfileUserRecord): MemberProfile {
  const disciplineSkills = parseDisciplineSkills(
    user.disciplineInterests,
    user.experienceLevel,
  );
  const disciplineInterests = Object.keys(disciplineSkills);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    image: user.image,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    emergencyContact: {
      name: user.emergencyContactName,
      relationship: user.emergencyContactRelationship,
      phone: user.emergencyContactPhone,
    },
    healthSafety: {
      medicalNotes: user.medicalNotes,
      injuriesLimitations: user.injuriesLimitations,
      allergiesSafetyAlerts: user.allergiesSafetyAlerts,
      safetyConsentAt: toIso(user.safetyConsentAt),
    },
    experienceLevel: user.experienceLevel,
    disciplineInterests,
    disciplineSkills,
    notificationPreferences: parseNotificationPreferences(user.notificationPreferences),
    membership: {
      plan: user.membershipPlan,
      status: user.membershipStatus,
      accountStatus: user.accountStatus,
      startedAt: toIso(user.membershipStartedAt ?? user.createdAt),
      renewsAt: toIso(user.membershipRenewsAt),
      pausedAt: toIso(user.membershipPausedAt),
      resumeAt: toIso(user.membershipResumeAt),
      cancelledAt: toIso(user.membershipCancelledAt),
      cancellationReason: user.cancellationReason,
      creditsRemaining: user.creditsRemaining,
      hasStripeSubscription: Boolean(user.stripeSubscriptionId),
    },
    memberType: user.memberType === "child" || user.guardianUserId ? "child" : "adult",
    isChild: user.memberType === "child" || Boolean(user.guardianUserId),
    guardianUserId: user.guardianUserId ?? null,
    parentalConsent: {
      givenAt: toIso(user.parentalConsentAt ?? null),
      name: user.parentalConsentName ?? null,
      relationship: user.parentalConsentRelationship ?? null,
      version: user.parentalConsentVersion ?? null,
    },
    profileCompletion: calculateProfileCompletion(user),
    createdAt: user.createdAt.toISOString(),
  };
}

export const profileSelectFields = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  dateOfBirth: true,
  emergencyContactName: true,
  emergencyContactRelationship: true,
  emergencyContactPhone: true,
  medicalNotes: true,
  injuriesLimitations: true,
  allergiesSafetyAlerts: true,
  safetyConsentAt: true,
  experienceLevel: true,
  disciplineInterests: true,
  notificationPreferences: true,
  membershipPlan: true,
  membershipStatus: true,
  accountStatus: true,
  membershipStartedAt: true,
  membershipRenewsAt: true,
  membershipPausedAt: true,
  membershipResumeAt: true,
  membershipCancelledAt: true,
  cancellationReason: true,
  creditsRemaining: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  memberType: true,
  guardianUserId: true,
  parentalConsentAt: true,
  parentalConsentName: true,
  parentalConsentRelationship: true,
  parentalConsentVersion: true,
  createdAt: true,
} as const;
