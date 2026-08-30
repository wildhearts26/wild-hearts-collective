import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createMemberSessionToken,
  setMemberSessionCookie,
  toPublicMember,
} from "@/lib/member-auth";
import { findLoginUserByEmail } from "@/lib/household-service";
import { verifyPassword } from "@/lib/password";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const user = await findLoginUserByEmail(email);

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    if (user && !user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Please continue with Google." },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = createMemberSessionToken(user.id, user.id);
  const cookieStore = await cookies();
  cookieStore.set(setMemberSessionCookie(token));

  return NextResponse.json({
    user: toPublicMember({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      image: user.image,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      membershipPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      membershipRenewsAt: user.membershipRenewsAt,
      createdAt: user.createdAt,
    }),
    requiresVerification: !user.emailVerifiedAt,
  });
}
