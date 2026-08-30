import { db } from "@/lib/db";
import {
  ALLOWED_ID_MIME_TYPES,
  ID_DOCUMENT_STATUS,
  MEMBER_TYPE,
  MAX_ID_DOCUMENT_BYTES,
  PARENTAL_CONSENT_VERSION,
  isChildAge,
} from "@/lib/household-config";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";

const householdMemberSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  memberType: true,
  guardianUserId: true,
  dateOfBirth: true,
  parentalConsentAt: true,
} as const;

export type HouseholdMemberSummary = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  memberType: string;
  isActive: boolean;
  dateOfBirth: string | null;
  parentalConsentComplete: boolean;
};

export class ChildConsentRequiredError extends Error {
  constructor(
    message = "Parental consent and proof of identification are required before this child can book classes.",
  ) {
    super(message);
    this.name = "ChildConsentRequiredError";
  }
}

export function isChildMember(user: { memberType?: string | null; guardianUserId?: string | null }) {
  return user.memberType === MEMBER_TYPE.child || Boolean(user.guardianUserId);
}

export async function findLoginUserByEmail(email: string) {
  return db.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      guardianUserId: null,
    },
  });
}

export function resolveGuardianId(user: { id: string; guardianUserId: string | null }) {
  return user.guardianUserId ?? user.id;
}

export async function assertSessionBelongsToHousehold(
  userId: string,
  guardianId: string,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, guardianUserId: true },
  });

  if (!user) return null;
  if (user.id !== guardianId && user.guardianUserId !== guardianId) {
    return null;
  }
  return user;
}

export async function listHouseholdMembers(guardianId: string, activeUserId?: string) {
  const guardian = await db.user.findUnique({
    where: { id: guardianId },
    select: householdMemberSelect,
  });

  if (!guardian || guardian.guardianUserId) {
    return [] as HouseholdMemberSummary[];
  }

  const children = await db.user.findMany({
    where: { guardianUserId: guardianId },
    select: householdMemberSelect,
    orderBy: { createdAt: "asc" },
  });

  return [guardian, ...children].map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    image: member.image,
    memberType: member.memberType,
    isActive: member.id === (activeUserId ?? guardianId),
    dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : null,
    parentalConsentComplete: member.memberType !== MEMBER_TYPE.child || Boolean(member.parentalConsentAt),
  }));
}

export async function getLatestIdDocumentMeta(childUserId: string) {
  return db.guardianIdDocument.findFirst({
    where: { childUserId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      uploadedAt: true,
      status: true,
      reviewedAt: true,
      reviewNote: true,
    },
  });
}

export async function assertChildCanBook(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      memberType: true,
      guardianUserId: true,
      parentalConsentAt: true,
    },
  });

  if (!user || !isChildMember(user)) {
    return;
  }

  if (!user.parentalConsentAt) {
    throw new ChildConsentRequiredError(
      "A parent or guardian must give consent before this child can book classes.",
    );
  }

  const document = await db.guardianIdDocument.findFirst({
    where: { childUserId: userId },
    select: { id: true },
  });

  if (!document) {
    throw new ChildConsentRequiredError(
      "A parent or guardian must upload proof of identification before this child can book classes.",
    );
  }
}

export type CreateChildMemberInput = {
  guardianId: string;
  name: string;
  dateOfBirth: Date;
  phone?: string | null;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  medicalNotes?: string | null;
  injuriesLimitations?: string | null;
  allergiesSafetyAlerts?: string | null;
  parentalConsentName: string;
  parentalConsentRelationship: string;
  idDocument: {
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
  };
};

export async function createChildMember(input: CreateChildMemberInput) {
  const guardian = await db.user.findUnique({
    where: { id: input.guardianId },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      guardianUserId: true,
      memberType: true,
    },
  });

  if (!guardian || guardian.guardianUserId) {
    throw new Error("Only the parent or guardian login can add child members.");
  }

  if (!isChildAge(input.dateOfBirth)) {
    throw new Error(
      "Child members must be under 18. Please create a standard adult account instead.",
    );
  }

  if (!ALLOWED_ID_MIME_TYPES.has(input.idDocument.mimeType)) {
    throw new Error("Please upload a JPG, PNG, WebP, or PDF identification document.");
  }

  if (input.idDocument.bytes.length === 0) {
    throw new Error("Please upload a parent or guardian identification document.");
  }

  if (input.idDocument.bytes.length > MAX_ID_DOCUMENT_BYTES) {
    throw new Error("Identification document must be 4 MB or smaller.");
  }

  const documentBytes = toPrismaBytes(input.idDocument.bytes);

  const child = await db.user.create({
    data: {
      name: input.name,
      email: guardian.email,
      phone: input.phone ?? null,
      dateOfBirth: input.dateOfBirth,
      emergencyContactName: input.emergencyContactName,
      emergencyContactRelationship: input.emergencyContactRelationship,
      emergencyContactPhone: input.emergencyContactPhone,
      medicalNotes: input.medicalNotes ?? null,
      injuriesLimitations: input.injuriesLimitations ?? null,
      allergiesSafetyAlerts: input.allergiesSafetyAlerts ?? null,
      memberType: MEMBER_TYPE.child,
      guardianUserId: guardian.id,
      emailVerifiedAt: guardian.emailVerifiedAt,
      phoneVerifiedAt: guardian.phoneVerifiedAt,
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.active,
      parentalConsentAt: new Date(),
      parentalConsentName: input.parentalConsentName,
      parentalConsentRelationship: input.parentalConsentRelationship,
      parentalConsentVersion: PARENTAL_CONSENT_VERSION,
      idDocuments: {
        create: {
          fileName: input.idDocument.fileName,
          mimeType: input.idDocument.mimeType,
          data: documentBytes,
          status: ID_DOCUMENT_STATUS.pending,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      memberType: true,
      dateOfBirth: true,
    },
  });

  return child;
}

function toPrismaBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}
