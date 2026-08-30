import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findOrCreateGoogleUser } from "@/lib/google-auth-service";
import {
  clearGoogleOAuthCookies,
  exchangeGoogleCode,
  fetchGoogleProfile,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleAuthConfigured,
  verifyOAuthState,
} from "@/lib/google-auth";
import {
  createMemberSessionToken,
  setMemberSessionCookie,
} from "@/lib/member-auth";
import { getAppBaseUrl } from "@/lib/booking-config";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${getAppBaseUrl()}/login?error=google_not_configured`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextPath = cookieStore.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value ?? "/account";

  await clearGoogleOAuthCookies();

  if (error || !code || !state || !savedState || state !== savedState || !verifyOAuthState(state)) {
    return NextResponse.redirect(`${getAppBaseUrl()}/login?error=google_auth_failed`);
  }

  try {
    const tokenResponse = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(tokenResponse.access_token);

    if (!profile.email) {
      return NextResponse.redirect(`${getAppBaseUrl()}/login?error=google_no_email`);
    }

    const { user } = await findOrCreateGoogleUser(profile);
    const loginId = user.guardianUserId ?? user.id;
    const sessionToken = createMemberSessionToken(loginId, loginId);
    cookieStore.set(setMemberSessionCookie(sessionToken));

    return NextResponse.redirect(`${getAppBaseUrl()}${nextPath.startsWith("/") ? nextPath : "/account"}`);
  } catch {
    return NextResponse.redirect(`${getAppBaseUrl()}/login?error=google_auth_failed`);
  }
}
