export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;

export type ExperienceLevelId = (typeof EXPERIENCE_LEVELS)[number]["id"];

export const DISCIPLINE_INTERESTS = [
  { id: "pole", label: "Pole" },
  { id: "aerial-hoop", label: "Aerial Hoop" },
  { id: "silks", label: "Silks" },
  { id: "flexibility", label: "Flexibility" },
  { id: "creative-workshops", label: "Creative Workshops" },
  { id: "family", label: "Family Classes" },
  { id: "teens", label: "Teen Classes" },
  { id: "children", label: "Children's Classes" },
  { id: "aerial-workshops", label: "Aerial Workshops" },
  { id: "pole-workshops", label: "Pole Workshops" },
  { id: "beginner-courses", label: "4-Week Beginner Courses" },
] as const;

export type DisciplineInterestId = (typeof DISCIPLINE_INTERESTS)[number]["id"];

/** Map of discipline id → skill level id, e.g. { pole: "advanced", "aerial-hoop": "beginner" } */
export type DisciplineSkills = Partial<Record<DisciplineInterestId, ExperienceLevelId>> &
  Record<string, string>;

export const EXPERIENCE_LEVEL_IDS = new Set(
  EXPERIENCE_LEVELS.map((level) => level.id),
);

export const DISCIPLINE_INTEREST_IDS = new Set(
  DISCIPLINE_INTERESTS.map((discipline) => discipline.id),
);

export function isExperienceLevelId(value: string): value is ExperienceLevelId {
  return EXPERIENCE_LEVEL_IDS.has(value as ExperienceLevelId);
}

export function isDisciplineInterestId(value: string): value is DisciplineInterestId {
  return DISCIPLINE_INTEREST_IDS.has(value as DisciplineInterestId);
}

export const NOTIFICATION_KEYS = [
  { id: "classReminders", label: "Class reminders" },
  { id: "scheduleChanges", label: "Schedule changes" },
  { id: "membershipRenewals", label: "Membership renewals" },
  { id: "marketing", label: "Marketing communications" },
] as const;

export type NotificationPreferences = {
  classReminders: boolean;
  scheduleChanges: boolean;
  membershipRenewals: boolean;
  marketing: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  classReminders: true,
  scheduleChanges: true,
  membershipRenewals: true,
  marketing: false,
};

export const ACCOUNT_STATUS = {
  active: "active",
  suspended: "suspended",
  banned: "banned",
} as const;

export function accountStatusLabel(status: string) {
  switch (status) {
    case ACCOUNT_STATUS.suspended:
      return "Suspended";
    case ACCOUNT_STATUS.banned:
      return "Banned";
    default:
      return "Active";
  }
}

export const MEMBERSHIP_EVENT_TYPE = {
  started: "started",
  paused: "paused",
  resumed: "resumed",
  cancelled: "cancelled",
  terminated: "terminated",
  planChanged: "plan_changed",
} as const;

export const CANCELLATION_REASONS = [
  "Too expensive",
  "Schedule no longer suits me",
  "Moving away",
  "Injury or health",
  "Trying something else",
  "Other",
] as const;
