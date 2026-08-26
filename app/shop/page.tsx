import type { Metadata } from "next";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { ShopStorefront } from "@/app/components/shop-storefront";
import { listStorefrontShopProducts } from "@/lib/shop-catalog-service";
import { getShopCategories } from "@/lib/shop-categories-service";
import { pageSeo } from "@/lib/page-seo";
import { heroImages } from "@/lib/hero-images";

export const metadata: Metadata = pageSeo({
  title: "Shop",
  description:
    "Gift vouchers, aerial equipment, apparel, and studio essentials from Wild Hearts Collective. Digital e-vouchers available now.",
  path: "/shop",
  image: heroImages.shop,
});

type ShopPageProps = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { cancelled } = await searchParams;
  const [products, categories] = await Promise.all([
    listStorefrontShopProducts(),
    getShopCategories(),
  ]);

  return (
    <>
      <PageHero
        title="Shop"
        subtitle="Gift vouchers you can buy today — plus equipment, apparel, and studio essentials coming soon."
        image="shop"
      />

      <ContentSection className="bg-background">
        <SectionHeading
          title="Studio store"
          subtitle="Browse by category, add gift vouchers to your basket, then checkout securely with Stripe. Digital items arrive by email — everything else is Coming soon."
        />

        <div className="mt-10">
          <ShopStorefront
            products={products}
            categories={categories}
            cancelled={cancelled === "1"}
          />
        </div>
      </ContentSection>
    </>
  );
}
