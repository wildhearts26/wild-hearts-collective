import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { revalidateMembershipPricingPages } from "@/lib/revalidate-public-pages";
import {
  createAdminClassPack,
  getStudioPricingSettings,
  listAdminClassPacks,
  updateStudioPricingSettings,
} from "@/lib/studio-pricing-service";

export async function GET() {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.pricing);
  if (!admin.authed) return admin.response;

  try {
    const [settings, packs] = await Promise.all([
      getStudioPricingSettings(),
      listAdminClassPacks(),
    ]);
    return NextResponse.json({ settings, packs });
  } catch (error) {
    console.error("Failed to load admin pricing:", error);
    return NextResponse.json(
      { error: "Unable to load pricing." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.pricing);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const hasPrices =
      body.dropInPricePounds != null &&
      body.fourWeekCoursePricePounds != null;

    if (!hasPrices) {
      return NextResponse.json(
        { error: "Provide drop-in and course prices." },
        { status: 400 },
      );
    }

    const update: Parameters<typeof updateStudioPricingSettings>[0] = {};

    const dropInPounds =
      typeof body.dropInPricePounds === "number"
        ? body.dropInPricePounds
        : Number.parseFloat(String(body.dropInPricePounds));
    const coursePounds =
      typeof body.fourWeekCoursePricePounds === "number"
        ? body.fourWeekCoursePricePounds
        : Number.parseFloat(String(body.fourWeekCoursePricePounds));

    if (!Number.isFinite(dropInPounds) || !Number.isFinite(coursePounds)) {
      return NextResponse.json(
        { error: "Enter valid drop-in and course prices." },
        { status: 400 },
      );
    }

    update.dropInPricePence = Math.round(dropInPounds * 100);
    update.fourWeekCoursePricePence = Math.round(coursePounds * 100);

    const settings = await updateStudioPricingSettings(update);

    revalidateMembershipPricingPages();
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update pricing.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.pricing);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const pricePounds =
      typeof body.pricePounds === "number"
        ? body.pricePounds
        : Number.parseFloat(String(body.pricePounds ?? ""));

    if (!Number.isFinite(pricePounds)) {
      return NextResponse.json(
        { error: "Enter a valid pack price." },
        { status: 400 },
      );
    }

    const pack = await createAdminClassPack({
      name: typeof body.name === "string" ? body.name : "",
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description:
        typeof body.description === "string" ? body.description : null,
      credits:
        typeof body.credits === "number"
          ? body.credits
          : Number.parseFloat(String(body.credits ?? "")),
      pricePence: Math.round(pricePounds * 100),
      validDays:
        typeof body.validDays === "number"
          ? body.validDays
          : Number.parseInt(String(body.validDays ?? ""), 10),
      active: typeof body.active === "boolean" ? body.active : true,
      sortOrder:
        typeof body.sortOrder === "number"
          ? body.sortOrder
          : Number.parseInt(String(body.sortOrder ?? "0"), 10) || 0,
    });

    revalidateMembershipPricingPages();
    return NextResponse.json({ pack }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create class pack.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
