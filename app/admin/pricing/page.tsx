import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminPricingPanel } from "@/app/components/admin-pricing-panel";
import { requireAdminPage } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  getStudioPricingSettings,
  listAdminClassPacks,
  type AdminClassPack,
  type StudioPricingSettings,
} from "@/lib/studio-pricing-service";

export const metadata: Metadata = {
  title: "Admin Passes & Pricing",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  const session = await requireAdminPage(ADMIN_PERMISSIONS.pricing);

  let settings: StudioPricingSettings | null = null;
  let packs: AdminClassPack[] = [];
  let loadError = "";

  try {
    [settings, packs] = await Promise.all([
      getStudioPricingSettings(),
      listAdminClassPacks(),
    ]);
  } catch (error) {
    console.error("Failed to load admin pricing page:", error);
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load passes and pricing. Please try again.";
    settings = await getStudioPricingSettings().catch(() => null);
    packs = [];
  }

  if (!settings) {
    return (
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
        <h1 className="font-display text-4xl text-plum">Passes &amp; pricing</h1>
        <p className="mt-6 rounded-sm border border-brand/30 bg-pink-soft px-4 py-3 text-sm text-brand">
          {loadError ||
            "Unable to load pricing right now. This is usually a brief database connection drop — refresh the page and try again."}
        </p>
        <AdminNav active="pricing" permissions={session.permissions} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">
            Passes &amp; pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Update drop-in and course prices, plus class pass prices, credit volume,
            and validity. Schedule sessions separately under Schedule.
          </p>
          <AdminNav active="pricing" permissions={session.permissions} />
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <AdminLogoutButton />
          <Link
            href="/membership"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View membership page
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <AdminPricingPanel initialSettings={settings} initialPacks={packs} />
      </div>
    </div>
  );
}
