import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { findLoginUserByEmail } from "@/lib/household-service";
import { deliverVerificationCode } from "@/lib/verification-service";
import { db } from "@/lib/db";
import {
  type VerificationChannel,
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";

type SendBody = {
  purpose?: string;
  channel?: VerificationChannel;
  email?: string;
};

export async function POST(request: Request) {
  let body: SendBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const purpose =
    body.purpose === VERIFICATION_PURPOSE.passwordReset
      ? VERIFICATION_PURPOSE.passwordReset
      : VERIFICATION_PURPOSE.signupVerify;
  const channel = body.channel === VERIFICATION_CHANNEL.phone
    ? VERIFICATION_CHANNEL.phone
    : VERIFICATION_CHANNEL.email;

  const session = await getMemberSession();
  let user = session
    ? await db.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, phone: true },
      })
    : null;

  if (!user && body.email) {
    user = await findLoginUserByEmail(body.email.trim().toLowerCase()).then((found) =>
      found
        ? { id: found.id, email: found.email, name: found.name, phone: found.phone }
        : null,
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  try {
    const delivery = await deliverVerificationCode(user, purpose, channel);
    return NextResponse.json({ ok: true, ...delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
