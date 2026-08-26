import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  createAdminSession,
  listAdminSessions,
} from "@/lib/admin-session-service";
import { revalidateBookableScheduleSurfaces } from "@/lib/revalidate-public-pages";

export async function GET(request: Request) {
  const admin = await requireAdmin([
    ADMIN_PERMISSIONS.schedule,
    ADMIN_PERMISSIONS.checkin,
  ]);
  if (!admin.authed) return admin.response;

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "42");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rangeParam = searchParams.get("range");
  const range =
    rangeParam === "today" || rangeParam === "past" || rangeParam === "schedule"
      ? rangeParam
      : undefined;

  try {
    const now = new Date();
    const sessions = await listAdminSessions(
      from || to
        ? {
            from: from ? new Date(from) : now,
            to: to
              ? new Date(to)
              : new Date(now.getTime() + 1000 * 60 * 60 * 24 * Math.min(days, 90)),
          }
        : { range: range ?? "schedule" },
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to list admin sessions:", error);
    return NextResponse.json(
      { error: "Unable to load schedule." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.schedule);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const classSlug = typeof body.classSlug === "string" ? body.classSlug : "";
    const date = typeof body.date === "string" ? body.date : "";
    const startTime = typeof body.startTime === "string" ? body.startTime : "";
    const endTime = typeof body.endTime === "string" ? body.endTime : undefined;
    const capacity = Number(body.capacity);
    const tutorId =
      typeof body.tutorId === "string" && body.tutorId ? body.tutorId : null;
    const adminNotes =
      typeof body.adminNotes === "string" ? body.adminNotes : undefined;
    const displayTitle =
      typeof body.displayTitle === "string"
        ? body.displayTitle
        : body.displayTitle === null
          ? ""
          : undefined;
    const publicDescription =
      typeof body.publicDescription === "string"
        ? body.publicDescription
        : body.publicDescription === null
          ? ""
          : undefined;
    const pricePounds =
      body.pricePounds === null || body.pricePounds === ""
        ? null
        : body.pricePounds !== undefined
          ? body.pricePounds
          : undefined;
    const creditCost =
      body.creditCost === null || body.creditCost === ""
        ? null
        : body.creditCost !== undefined
          ? body.creditCost
          : undefined;
    const repeatMode =
      body.repeatMode === "weeks" || body.repeatMode === "until"
        ? body.repeatMode
        : "none";
    const repeatWeeks =
      body.repeatWeeks === null || body.repeatWeeks === ""
        ? null
        : body.repeatWeeks;
    const repeatUntil =
      typeof body.repeatUntil === "string" ? body.repeatUntil : null;

    if (!classSlug || !date || !startTime || !Number.isFinite(capacity)) {
      return NextResponse.json(
        { error: "Class type, date, start time, and capacity are required." },
        { status: 400 },
      );
    }

    const created = await createAdminSession({
      classSlug,
      date,
      startTime,
      endTime,
      capacity,
      tutorId,
      adminNotes,
      displayTitle,
      publicDescription,
      pricePounds,
      creditCost,
      repeatMode,
      repeatWeeks,
      repeatUntil,
    });

    revalidateBookableScheduleSurfaces();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
