import { sendVerificationCodeEmail } from "@/lib/email";
import { sendVerificationSms } from "@/lib/sms";
import {
  createVerificationCode,
  getAvailableChannels,
  maskEmail,
  maskPhone,
} from "@/lib/verification";
import {
  type VerificationChannel,
  type VerificationPurpose,
  VERIFICATION_CHANNEL,
  VERIFICATION_PURPOSE,
} from "@/lib/verification-config";
import { db } from "@/lib/db";

type SendCodeUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

export async function deliverVerificationCode(
  user: SendCodeUser,
  purpose: VerificationPurpose,
  channel: VerificationChannel,
) {
  const available = getAvailableChannels(user);
  if (!available.includes(channel)) {
    if (channel === VERIFICATION_CHANNEL.phone) {
      throw new Error("Phone verification is not available for this account.");
    }
    throw new Error("Email verification is not available.");
  }

  const { code } = await createVerificationCode({
    userId: user.id,
    email: user.email,
    phone: user.phone ?? undefined,
    purpose,
    channel,
  });

  if (channel === VERIFICATION_CHANNEL.phone && user.phone) {
    const smsContext =
      purpose === VERIFICATION_PURPOSE.passwordReset
        ? "password reset"
        : "account verification";
    const result = await sendVerificationSms(user.phone, code, smsContext);
    if (result.skipped) {
      throw new Error("SMS verification is not configured. Please use email instead.");
    }
    return { destination: maskPhone(user.phone), channel };
  }

  await sendVerificationCodeEmail(
    user.email,
    user.name,
    code,
    purpose === VERIFICATION_PURPOSE.passwordReset ? "password_reset" : "signup",
  );

  return { destination: maskEmail(user.email), channel: VERIFICATION_CHANNEL.email };
}

export async function findUserForPasswordReset(email: string) {
  return db.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      guardianUserId: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      passwordHash: true,
    },
  });
}

export async function markEmailVerified(userId: string) {
  const now = new Date();
  await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: now },
  });
  await db.user.updateMany({
    where: { guardianUserId: userId },
    data: { emailVerifiedAt: now },
  });
}

export async function markPhoneVerified(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { phoneVerifiedAt: new Date() },
  });
}

export function isEmailVerified(user: { emailVerifiedAt: Date | null }) {
  return Boolean(user.emailVerifiedAt);
}
