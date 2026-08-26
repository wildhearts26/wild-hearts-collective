import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  cancelAdminSession,
  getAdminSessionRoster,
  updateAdminSession,
} from "@/lib/admin-session-service";
import { revalidateBookableScheduleSurfaces } from "@/lib/revalidate-public-pages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin([
    ADMIN_PERMISSIONS.schedule,
    ADMIN_PERMISSIONS.checkin,
  ]);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const roster = await getAdminSessionRoster(id);
    if (!roster) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json(roster);
  } catch (error) {
    console.error("Failed to load session roster:", error);
    return NextResponse.json(
      { error: "Unable to load session roster." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.schedule);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const session = await updateAdminSession(id, {
      date: typeof body.date === "string" ? body.date : undefined,
      startTime: typeof body.startTime === "string" ? body.startTime : undefined,
      endTime: typeof body.endTime === "string" ? body.endTime : undefined,
      capacity:
        body.capacity != null && Number.isFinite(Number(body.capacity))
          ? Number(body.capacity)
          : undefined,
      tutorId:
        body.tutorId === null
          ? null
          : typeof body.tutorId === "string"
            ? body.tutorId
            : undefined,
      clearTutor: body.clearTutor === true,
      adminNotes:
        body.adminNotes === null
          ? null
          : typeof body.adminNotes === "string"
            ? body.adminNotes
            : undefined,
      displayTitle:
        body.displayTitle === null
          ? null
          : typeof body.displayTitle === "string"
            ? body.displayTitle
            : undefined,
      publicDescription:
        body.publicDescription === null
          ? null
          : typeof body.publicDescription === "string"
            ? body.publicDescription
            : undefined,
      pricePounds:
        body.pricePounds === null || body.pricePounds === ""
          ? null
          : body.pricePounds !== undefined
            ? body.pricePounds
            : undefined,
      creditCost:
        body.creditCost === null || body.creditCost === ""
          ? null
          : body.creditCost !== undefined
            ? body.creditCost
            : undefined,
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    revalidateBookableScheduleSurfaces();
    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.schedule);
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let reason = "";
  try {
    const body = await request.json();
    reason = typeof body.reason === "string" ? body.reason : "";
  } catch {
    // optional body
  }

  try {
    const result = await cancelAdminSession(id, reason || undefined);
    if (!result) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    revalidateBookableScheduleSurfaces();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
