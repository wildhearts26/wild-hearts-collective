import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createMemberSessionToken,
  setMemberSessionCookie,
  toPublicMember,
} from "@/lib/member-auth";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { deliverVerificationCode } from "@/lib/verification-service";
import { notifyAdminOfNewMember } from "@/lib/member-notifications";
import { findLoginUserByEmail } from "@/lib/household-service";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { VERIFICATION_CHANNEL, VERIFICATION_PURPOSE } from "@/lib/verification-config";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
};

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const phone = body.phone?.trim() || null;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const existing = await findLoginUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.active,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      membershipPlan: true,
      membershipStatus: true,
      membershipRenewsAt: true,
      createdAt: true,
    },
  });

  await Promise.all([
    db.booking.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    }),
    db.waitlistEntry.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    }),
  ]);

  const delivery = await deliverVerificationCode(
    user,
    VERIFICATION_PURPOSE.signupVerify,
    VERIFICATION_CHANNEL.email,
  );

  await notifyAdminOfNewMember({
    name: user.name,
    email: user.email,
    phone: user.phone,
    signupMethod: "email",
    emailVerified: false,
  });

  const token = createMemberSessionToken(user.id, user.id);
  const cookieStore = await cookies();
  cookieStore.set(setMemberSessionCookie(token));

  return NextResponse.json({
    user: toPublicMember(user),
    requiresVerification: true,
    verification: delivery,
  });
}
