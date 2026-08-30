import { notifyAdminOfNewMember } from "@/lib/member-notifications";
import { findLoginUserByEmail } from "@/lib/household-service";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { db } from "@/lib/db";

type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
};

type GoogleUserResult = {
  user: Awaited<ReturnType<typeof db.user.update>>;
  isNew: boolean;
};

function isCustomUploadedPhoto(image: string | null | undefined) {
  return Boolean(image?.startsWith("data:"));
}

/**
 * Prefer a fresh Google picture on each Google sign-in, but never overwrite
 * a member-uploaded data URL photo.
 */
export function resolveProfileImage(
  currentImage: string | null,
  googlePicture?: string | null,
) {
  if (isCustomUploadedPhoto(currentImage)) {
    return currentImage;
  }

  if (googlePicture) {
    return googlePicture;
  }

  return currentImage;
}

async function syncGoogleAccountPhoto(
  userId: string,
  oauthAccountId: string | null,
  googlePicture: string | undefined,
) {
  if (!googlePicture) return;

  if (oauthAccountId) {
    await db.oAuthAccount.update({
      where: { id: oauthAccountId },
      data: { profileImageUrl: googlePicture },
    });
    return;
  }

  await db.oAuthAccount.updateMany({
    where: { userId, provider: "google" },
    data: { profileImageUrl: googlePicture },
  });
}

/**
 * If a Google-linked member has no display photo (or only a stale empty value),
 * copy the stored Google profile image onto User.image.
 */
export async function ensureGoogleProfileImage(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      image: true,
      oauthAccounts: {
        where: { provider: "google" },
        select: { id: true, profileImageUrl: true },
        take: 1,
      },
    },
  });

  if (!user) return null;

  const googleAccount = user.oauthAccounts[0];
  if (!googleAccount) {
    return user.image;
  }

  if (isCustomUploadedPhoto(user.image)) {
    return user.image;
  }

  const googlePhoto = googleAccount.profileImageUrl;
  if (!googlePhoto) {
    return user.image;
  }

  if (user.image === googlePhoto) {
    return user.image;
  }

  // Backfill missing or outdated non-custom photos from the Google account record.
  if (!user.image || user.image.includes("googleusercontent.com")) {
    const updated = await db.user.update({
      where: { id: userId },
      data: { image: googlePhoto },
      select: { image: true },
    });
    return updated.image;
  }

  return user.image;
}

export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<GoogleUserResult> {
  const email = profile.email.trim().toLowerCase();
  const googlePicture = profile.picture?.trim() || undefined;

  const existingAccount = await db.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    const user = await db.user.update({
      where: { id: existingAccount.userId },
      data: {
        name: profile.name || existingAccount.user.name,
        image: resolveProfileImage(existingAccount.user.image, googlePicture),
        emailVerifiedAt: existingAccount.user.emailVerifiedAt ?? new Date(),
      },
    });

    await syncGoogleAccountPhoto(user.id, existingAccount.id, googlePicture);

    return { user, isNew: false };
  }

  const existingUser = await findLoginUserByEmail(email);

  if (existingUser) {
    await db.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider: "google",
        providerAccountId: profile.id,
        profileImageUrl: googlePicture ?? null,
      },
    });

    const user = await db.user.update({
      where: { id: existingUser.id },
      data: {
        name: profile.name || existingUser.name,
        image: resolveProfileImage(existingUser.image, googlePicture),
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
      },
    });

    await syncGoogleAccountPhoto(user.id, null, googlePicture);

    return { user, isNew: false };
  }

  const user = await db.user.create({
    data: {
      email,
      name: profile.name || email.split("@")[0] || "Member",
      image: googlePicture ?? null,
      emailVerifiedAt: profile.verified_email === false ? null : new Date(),
      membershipPlan: MEMBERSHIP_PLAN.account,
      membershipStatus: MEMBERSHIP_STATUS.active,
      oauthAccounts: {
        create: {
          provider: "google",
          providerAccountId: profile.id,
          profileImageUrl: googlePicture ?? null,
        },
      },
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

  await notifyAdminOfNewMember({
    name: user.name,
    email: user.email,
    phone: user.phone,
    signupMethod: "google",
    emailVerified: Boolean(user.emailVerifiedAt),
  });

  return { user, isNew: true };
}
