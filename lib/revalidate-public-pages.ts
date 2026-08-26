import { revalidatePath } from "next/cache";

/** Bust cached membership and class-pack surfaces after admin pricing edits. */
export function revalidateMembershipPricingPages() {
  revalidatePath("/membership");
  revalidatePath("/account/credits");
  revalidatePath("/api/bundles");
}

/** Bust homepage marketing timetable after Admin → Timetable saves. */
export function revalidateMarketingTimetablePages() {
  revalidatePath("/", "layout");
  revalidatePath("/");
}

/** Bust shop storefront after category or catalog changes. */
export function revalidateShopCatalogPages() {
  revalidatePath("/shop");
}

/** Bust bookable schedule surfaces after Admin → Schedule create/edit/cancel. */
export function revalidateBookableScheduleSurfaces() {
  revalidatePath("/book");
  revalidatePath("/api/sessions");
}
