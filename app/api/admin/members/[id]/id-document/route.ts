import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { ID_DOCUMENT_STATUS, type IdDocumentStatus } from "@/lib/household-config";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.members);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;
  const document = await db.guardianIdDocument.findFirst({
    where: { childUserId: id },
    orderBy: { uploadedAt: "desc" },
  });

  if (!document) {
    return NextResponse.json({ error: "No identification document on file." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.fileName.replaceAll('"', "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
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

  const document = await db.guardianIdDocument.findFirst({
    where: { childUserId: id },
    orderBy: { uploadedAt: "desc" },
    select: { id: true },
  });

  if (!document) {
    return NextResponse.json({ error: "No identification document on file." }, { status: 404 });
  }

  const updated = await db.guardianIdDocument.update({
    where: { id: document.id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewNote: body.reviewNote?.trim() || null,
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

  return NextResponse.json({ document: updated });
}
