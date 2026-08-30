import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { ID_DOCUMENT_STATUS, type IdDocumentStatus } from "@/lib/household-config";
import { getLatestGuardianIdDocumentBinary } from "@/lib/id-document-storage";
import { notifyParentOfIdDocumentReview } from "@/lib/member-notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.members);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const document = await getLatestGuardianIdDocumentBinary(id);

    if (!document) {
      return NextResponse.json({ error: "No identification document on file." }, { status: 404 });
    }

    const safeName = document.fileName.replace(/[^\w.\- ()[\]]+/g, "_");

    return new NextResponse(new Uint8Array(document.data), {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Length": String(document.data.byteLength),
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[admin:id-document:get]", id, error);
    return NextResponse.json(
      { error: "Unable to load the identification document right now." },
      { status: 500 },
    );
  }
}

type ReviewBody = {
  status?: string;
  reviewNote?: string;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.members);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;
  let body: ReviewBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const status = body.status as IdDocumentStatus | undefined;
  if (status !== ID_DOCUMENT_STATUS.approved && status !== ID_DOCUMENT_STATUS.rejected) {
    return NextResponse.json({ error: "Please approve or reject the document." }, { status: 400 });
  }

  const child = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      guardianUserId: true,
      guardian: { select: { id: true, name: true, email: true } },
    },
  });

  if (!child) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const document = await db.guardianIdDocument.findFirst({
    where: { childUserId: id },
    orderBy: { uploadedAt: "desc" },
    select: { id: true },
  });

  if (!document) {
    return NextResponse.json({ error: "No identification document on file." }, { status: 404 });
  }

  const reviewNote = body.reviewNote?.trim() || null;

  const updated = await db.guardianIdDocument.update({
    where: { id: document.id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewNote,
    },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      reviewNote: true,
    },
  });

  await logAdminAction({
    action: status === ID_DOCUMENT_STATUS.approved ? "member.id_approved" : "member.id_rejected",
    targetUserId: id,
    details: { documentId: updated.id, status },
  });

  const parentName = child.guardian?.name ?? "Parent/guardian";
  const toEmail = child.guardian?.email ?? child.email;

  await notifyParentOfIdDocumentReview({
    toEmail,
    parentName,
    childName: child.name,
    status,
    reviewNote,
  });

  return NextResponse.json({ document: updated });
}
