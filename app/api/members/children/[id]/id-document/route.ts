import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { assertSessionBelongsToHousehold } from "@/lib/household-service";
import { insertGuardianIdDocument } from "@/lib/id-document-storage";
import { ALLOWED_ID_MIME_TYPES, MAX_ID_DOCUMENT_BYTES } from "@/lib/household-config";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id: childId } = await context.params;
  const guardianId = session.guardianId || session.userId;
  const child = await assertSessionBelongsToHousehold(childId, guardianId);

  if (!child || child.id === guardianId) {
    return NextResponse.json(
      { error: "You can only upload identification for a child in your household." },
      { status: 403 },
    );
  }

  const childRecord = await db.user.findUnique({
    where: { id: childId },
    select: { id: true, name: true, memberType: true, guardianUserId: true },
  });

  if (!childRecord || childRecord.memberType !== "child") {
    return NextResponse.json({ error: "Child member not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const file = formData.get("idDocument");
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

  const created = await insertGuardianIdDocument({
    childUserId: childId,
    fileName: file.name || "identification",
    mimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });

  return NextResponse.json({
    ok: true,
    documentId: created.id,
    childId,
    childName: childRecord.name,
  });
}
