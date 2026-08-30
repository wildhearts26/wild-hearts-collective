import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createMemberSessionToken,
  getMemberSession,
  setMemberSessionCookie,
} from "@/lib/member-auth";
import { assertSessionBelongsToHousehold } from "@/lib/household-service";

type SwitchBody = {
  memberId?: string;
};

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: SwitchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const memberId = body.memberId?.trim();
  if (!memberId) {
    return NextResponse.json({ error: "Please choose a household member." }, { status: 400 });
  }

  const guardianId = session.guardianId || session.userId;
  const target = await assertSessionBelongsToHousehold(memberId, guardianId);
  if (!target) {
    return NextResponse.json(
      { error: "That member is not part of this household." },
      { status: 403 },
    );
  }

  const token = createMemberSessionToken(target.id, guardianId);
  const cookieStore = await cookies();
  cookieStore.set(setMemberSessionCookie(token));

  return NextResponse.json({ ok: true, activeUserId: target.id });
}
