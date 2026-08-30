import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { createChildMember, listHouseholdMembers } from "@/lib/household-service";
import { ALLOWED_ID_MIME_TYPES, MAX_ID_DOCUMENT_BYTES } from "@/lib/household-config";
import { notifyAdminOfNewMember } from "@/lib/member-notifications";

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const guardianId = session.guardianId || session.userId;
  const members = await listHouseholdMembers(guardianId, session.userId);
  return NextResponse.json({
    members: members.filter((member) => member.memberType === "child"),
  });
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const name = readRequired(formData, "name");
  const dateOfBirthRaw = readRequired(formData, "dateOfBirth");
  const phone = readRequired(formData, "phone") || null;
  const emergencyContactName = readRequired(formData, "emergencyContactName");
  const emergencyContactRelationship = readRequired(formData, "emergencyContactRelationship");
  const emergencyContactPhone = readRequired(formData, "emergencyContactPhone");
  const medicalNotes = readRequired(formData, "medicalNotes") || null;
  const injuriesLimitations = readRequired(formData, "injuriesLimitations") || null;
  const allergiesSafetyAlerts = readRequired(formData, "allergiesSafetyAlerts") || null;
  const parentalConsentName = readRequired(formData, "parentalConsentName");
  const parentalConsentRelationship = readRequired(formData, "parentalConsentRelationship");
  const consentGiven = readRequired(formData, "consentGiven") === "true";
  const file = formData.get("idDocument");

  if (!name || !dateOfBirthRaw) {
    return NextResponse.json(
      { error: "Child name and date of birth are required." },
      { status: 400 },
    );
  }

  if (!emergencyContactName || !emergencyContactRelationship || !emergencyContactPhone) {
    return NextResponse.json(
      { error: "Emergency contact details are required for child members." },
      { status: 400 },
    );
  }

  if (!parentalConsentName || !parentalConsentRelationship || !consentGiven) {
    return NextResponse.json(
      { error: "A parent or guardian must give consent for this child member." },
      { status: 400 },
    );
  }

  const dateOfBirth = new Date(`${dateOfBirthRaw}T00:00:00`);
  if (Number.isNaN(dateOfBirth.getTime())) {
    return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Please upload a parent or guardian identification document." },
      { status: 400 },
    );
  }

  if (!ALLOWED_ID_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, WebP, or PDF identification document." },
      { status: 400 },
    );
  }

  if (file.size > MAX_ID_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: "Identification document must be 4 MB or smaller." },
      { status: 400 },
    );
  }

  const guardianId = session.guardianId || session.userId;

  try {
    const child = await createChildMember({
      guardianId,
      name,
      dateOfBirth,
      phone,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      medicalNotes,
      injuriesLimitations,
      allergiesSafetyAlerts,
      parentalConsentName,
      parentalConsentRelationship,
      idDocument: {
        fileName: file.name || "identification",
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      },
    });

    await notifyAdminOfNewMember({
      name: child.name,
      email: child.email,
      phone,
      signupMethod: "email",
      emailVerified: true,
      memberType: "child",
    });

    return NextResponse.json({ child }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add child member.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
