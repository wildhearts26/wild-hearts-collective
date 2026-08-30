export const MEMBER_TYPE = {
  adult: "adult",
  child: "child",
} as const;

export type MemberType = (typeof MEMBER_TYPE)[keyof typeof MEMBER_TYPE];

export const PARENTAL_CONSENT_VERSION = "2026-08";

/** Child members are under 18 on the date of signup. */
export const CHILD_MAX_AGE = 17;

export const ID_DOCUMENT_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type IdDocumentStatus =
  (typeof ID_DOCUMENT_STATUS)[keyof typeof ID_DOCUMENT_STATUS];

export const ALLOWED_ID_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MAX_ID_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const PARENTAL_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Legal guardian",
  "Carer",
  "Other",
] as const;

export function ageOnDate(dateOfBirth: Date, on = new Date()) {
  let age = on.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = on.getMonth() - dateOfBirth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isChildAge(dateOfBirth: Date, on = new Date()) {
  const age = ageOnDate(dateOfBirth, on);
  return age >= 0 && age <= CHILD_MAX_AGE;
}

export function memberTypeLabel(memberType: string) {
  return memberType === MEMBER_TYPE.child ? "Child member" : "Adult member";
}

export function idDocumentStatusLabel(status: string) {
  switch (status) {
    case ID_DOCUMENT_STATUS.approved:
      return "Approved";
    case ID_DOCUMENT_STATUS.rejected:
      return "Rejected";
    default:
      return "Pending review";
  }
}
