import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { listHouseholdMembers } from "@/lib/household-service";

export async function GET() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const guardianId = session.guardianId || session.userId;
  const members = await listHouseholdMembers(guardianId, session.userId);

  return NextResponse.json({ members, guardianId, activeUserId: session.userId });
}
