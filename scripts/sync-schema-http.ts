import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = neon(databaseUrl);

async function run(statement: string) {
  await sql.query(statement);
  console.log(`Applied: ${statement.split("\n")[0]}`);
}

async function runOptional(statement: string) {
  try {
    await run(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Skipped (optional): ${statement.split("\n")[0]} — ${message}`);
  }
}

async function main() {
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellationType" TEXT',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paidWithCredit" BOOLEAN NOT NULL DEFAULT false',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "packPurchaseId" TEXT',
  );
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parQData" JSONB');

  await run(`
    CREATE TABLE IF NOT EXISTS "ClassPack" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "credits" DOUBLE PRECISION NOT NULL,
      "pricePence" INTEGER NOT NULL,
      "validDays" INTEGER NOT NULL DEFAULT 90,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassPack_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassPack_slug_key" ON "ClassPack"("slug")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "ClassPackPurchase" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "packId" TEXT NOT NULL,
      "creditsGranted" INTEGER NOT NULL,
      "creditsRemaining" INTEGER NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "stripeSessionId" TEXT,
      "stripePaymentId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassPackPurchase_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassPackPurchase_stripeSessionId_key" ON "ClassPackPurchase"("stripeSessionId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_userId_idx" ON "ClassPackPurchase"("userId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_status_idx" ON "ClassPackPurchase"("status")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_expiresAt_idx" ON "ClassPackPurchase"("expiresAt")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "CreditTransaction" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "purchaseId" TEXT,
      "bookingId" TEXT,
      "amount" INTEGER NOT NULL,
      "balanceAfter" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "CreditTransaction_bookingId_idx" ON "CreditTransaction"("bookingId")',
  );

  await run(
    'ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER NOT NULL DEFAULT 100',
  );
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "usedAt" TIMESTAMP(3)');
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "bookingId" TEXT');
  await run('ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "metadata" JSONB');
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Voucher_bookingId_key" ON "Voucher"("bookingId")',
  );

  await run(
    'ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'pending\'',
  );
  await run('ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB');
  await run(
    'ALTER TABLE "EngagementLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "EngagementLog_userId_type_idx" ON "EngagementLog"("userId", "type")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "EngagementLog_status_createdAt_idx" ON "EngagementLog"("status", "createdAt")',
  );

  await run('ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER NOT NULL DEFAULT 12');

  await run(`
    CREATE TABLE IF NOT EXISTS "Tutor" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "bio" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
    )
  `);
  await run('CREATE INDEX IF NOT EXISTS "Tutor_active_idx" ON "Tutor"("active")');

  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tutorId" TEXT');
  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3)');
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'scheduled\'',
  );
  await run('ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT');
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await run('CREATE INDEX IF NOT EXISTS "Session_tutorId_idx" ON "Session"("tutorId")');
  await run('CREATE INDEX IF NOT EXISTS "Session_status_idx" ON "Session"("status")');

  await run(`
    CREATE TABLE IF NOT EXISTS "ParQResponse" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "data" JSONB NOT NULL DEFAULT '{}',
      "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ParQResponse_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ParQResponse_userId_key" ON "ParQResponse"("userId")',
  );
  await run('ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "data" JSONB');
  await run(
    'ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP',
  );
  await run(
    'ALTER TABLE "ParQResponse" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await runOptional(
    'UPDATE "ParQResponse" SET "data" = "answers"::jsonb WHERE "data" IS NULL AND "answers" IS NOT NULL',
  );
  await run(
    'UPDATE "ParQResponse" SET "data" = \'{}\'::jsonb WHERE "data" IS NULL',
  );
  await runOptional(
    'UPDATE "ParQResponse" SET "submittedAt" = "completedAt" WHERE "submittedAt" IS NULL AND "completedAt" IS NOT NULL',
  );
  await run(
    'UPDATE "ParQResponse" SET "submittedAt" = "updatedAt" WHERE "submittedAt" IS NULL AND "updatedAt" IS NOT NULL',
  );
  await runOptional('ALTER TABLE "ParQResponse" ALTER COLUMN "answers" DROP NOT NULL');
  await run('ALTER TABLE "ParQResponse" ALTER COLUMN "data" SET NOT NULL');
  await runOptional(
    'UPDATE "User" u SET "parQCompletedAt" = p."completedAt" FROM "ParQResponse" p WHERE u."id" = p."userId" AND u."parQCompletedAt" IS NULL AND p."completedAt" IS NOT NULL',
  );
  await run(
    'UPDATE "User" u SET "parQData" = p."data" FROM "ParQResponse" p WHERE u."id" = p."userId" AND u."parQData" IS NULL AND p."data" IS NOT NULL',
  );

  await run(
    'ALTER TABLE "OAuthAccount" ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "GiftCard" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "initialBalancePence" INTEGER NOT NULL,
      "balancePence" INTEGER NOT NULL,
      "productId" TEXT,
      "productName" TEXT NOT NULL,
      "redeemScope" TEXT NOT NULL DEFAULT 'any',
      "purchaserEmail" TEXT,
      "purchaserName" TEXT,
      "stripeSessionId" TEXT,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
    )
  `);
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_code_key" ON "GiftCard"("code")');
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCard_stripeSessionId_idx" ON "GiftCard"("stripeSessionId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCard_balancePence_idx" ON "GiftCard"("balancePence")',
  );
  await run('CREATE INDEX IF NOT EXISTS "GiftCard_expiresAt_idx" ON "GiftCard"("expiresAt")');

  await run(`
    CREATE TABLE IF NOT EXISTS "GiftCardRedemption" (
      "id" TEXT NOT NULL,
      "giftCardId" TEXT NOT NULL,
      "amountPence" INTEGER NOT NULL,
      "balanceAfter" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "bookingId" TEXT,
      "packPurchaseId" TEXT,
      "userId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GiftCardRedemption_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_giftCardId_createdAt_idx" ON "GiftCardRedemption"("giftCardId", "createdAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_bookingId_idx" ON "GiftCardRedemption"("bookingId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "GiftCardRedemption_packPurchaseId_idx" ON "GiftCardRedemption"("packPurchaseId")',
  );

  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "giftCardId" TEXT',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "giftAmountApplied" INTEGER',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "Booking_giftCardId_idx" ON "Booking"("giftCardId")',
  );

  // Keep the earliest active booking per session + email; cancel newer duplicates.
  await runOptional(`
    UPDATE "Booking" AS b
    SET
      "status" = 'cancelled',
      "cancellationType" = 'duplicate_cleanup',
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE b."id" IN (
      SELECT ranked."id"
      FROM (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "sessionId", lower("email")
            ORDER BY
              CASE WHEN "status" = 'confirmed' THEN 0 ELSE 1 END,
              "createdAt" ASC,
              "id" ASC
          ) AS rn
        FROM "Booking"
        WHERE "status" IN ('confirmed', 'pending')
      ) AS ranked
      WHERE ranked.rn > 1
    )
  `);

  // Prevent the same email from holding more than one active place on a session.
  await runOptional(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Booking_sessionId_email_active_key"
    ON "Booking" ("sessionId", lower("email"))
    WHERE "status" IN ('confirmed', 'pending')
  `);

  await run(
    'ALTER TABLE "ClassPackPurchase" ADD COLUMN IF NOT EXISTS "giftCardId" TEXT',
  );
  await run(
    'ALTER TABLE "ClassPackPurchase" ADD COLUMN IF NOT EXISTS "giftAmountApplied" INTEGER',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassPackPurchase_giftCardId_idx" ON "ClassPackPurchase"("giftCardId")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "ShopOrder" (
      "id" TEXT NOT NULL,
      "stripeSessionId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'paid',
      "sourceType" TEXT NOT NULL DEFAULT 'shop_voucher',
      "purchaserEmail" TEXT,
      "purchaserName" TEXT,
      "totalPence" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'gbp',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ShopOrder_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopOrder_stripeSessionId_key" ON "ShopOrder"("stripeSessionId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrder_createdAt_idx" ON "ShopOrder"("createdAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrder_purchaserEmail_idx" ON "ShopOrder"("purchaserEmail")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrder_status_idx" ON "ShopOrder"("status")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "ShopOrderItem" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "productId" TEXT,
      "productName" TEXT NOT NULL,
      "productSlug" TEXT,
      "category" TEXT,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "unitPricePence" INTEGER NOT NULL,
      "lineTotalPence" INTEGER NOT NULL,
      "fulfillmentType" TEXT NOT NULL DEFAULT 'gift_card',
      "giftCardId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ShopOrderItem_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrderItem_orderId_idx" ON "ShopOrderItem"("orderId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrderItem_productId_idx" ON "ShopOrderItem"("productId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopOrderItem_giftCardId_idx" ON "ShopOrderItem"("giftCardId")',
  );
  await runOptional(`
    ALTER TABLE "ShopOrderItem"
    ADD CONSTRAINT "ShopOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "ShopOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS "ShopProduct" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "pricePence" INTEGER NOT NULL,
      "isAvailable" BOOLEAN NOT NULL DEFAULT false,
      "digitalDelivery" BOOLEAN NOT NULL DEFAULT false,
      "image" TEXT NOT NULL,
      "imageGradient" TEXT NOT NULL DEFAULT 'from-pink-soft via-cream to-sage-light',
      "variants" JSONB,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isArchived" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ShopProduct_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopProduct_slug_key" ON "ShopProduct"("slug")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopProduct_category_idx" ON "ShopProduct"("category")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopProduct_isAvailable_isArchived_idx" ON "ShopProduct"("isAvailable", "isArchived")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopProduct_sortOrder_idx" ON "ShopProduct"("sortOrder")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ShopProduct_createdAt_idx" ON "ShopProduct"("createdAt")',
  );
  await runOptional(`
    ALTER TABLE "ShopOrderItem"
    ADD CONSTRAINT "ShopOrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
  `);

  await run(
    'ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "trackStock" BOOLEAN NOT NULL DEFAULT false',
  );
  await run(
    'ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0',
  );
  await run(
    'ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5',
  );
  await run(
    'ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER',
  );
  await run(
    'ALTER TABLE "ShopProduct" ADD COLUMN IF NOT EXISTS "giftRedeemScope" TEXT',
  );
  await runOptional(`
    UPDATE "ShopProduct"
    SET "giftRedeemScope" = 'beginner-courses'
    WHERE "slug" = 'intro-to-pole-4-week'
      AND ("giftRedeemScope" IS NULL OR "giftRedeemScope" = 'any')
  `);

  await run(
    'ALTER TABLE "GiftCard" ADD COLUMN IF NOT EXISTS "redeemScope" TEXT NOT NULL DEFAULT \'any\'',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "GiftCard_redeemScope_idx" ON "GiftCard"("redeemScope")',
  );
  await runOptional(`
    UPDATE "GiftCard" AS g
    SET "redeemScope" = 'beginner-courses'
    WHERE g."redeemScope" = 'any'
      AND (
        g."productName" ILIKE '%4-Week Course%'
        OR g."productId" IN (
          SELECT p."id" FROM "ShopProduct" p WHERE p."slug" = 'intro-to-pole-4-week'
        )
      )
  `);

  await run(
    'ALTER TABLE "ShopOrder" ADD COLUMN IF NOT EXISTS "fulfillmentMethod" TEXT',
  );
  await run(
    'ALTER TABLE "ShopOrder" ADD COLUMN IF NOT EXISTS "shippingPence" INTEGER NOT NULL DEFAULT 0',
  );
  await run(
    'ALTER TABLE "ShopOrder" ADD COLUMN IF NOT EXISTS "totalWeightGrams" INTEGER',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "ClassFeedback" (
      "id" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "bookingId" TEXT,
      "userId" TEXT,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "classTitle" TEXT,
      "sessionStartsAt" TIMESTAMP(3),
      "rating" INTEGER,
      "comments" TEXT,
      "shareOnWebsite" BOOLEAN NOT NULL DEFAULT false,
      "submittedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassFeedback_pkey" PRIMARY KEY ("id")
    )
  `);
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassFeedback_token_key" ON "ClassFeedback"("token")',
  );
  await run(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ClassFeedback_bookingId_key" ON "ClassFeedback"("bookingId")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassFeedback_email_idx" ON "ClassFeedback"("email")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassFeedback_submittedAt_idx" ON "ClassFeedback"("submittedAt")',
  );
  await run(
    'CREATE INDEX IF NOT EXISTS "ClassFeedback_shareOnWebsite_submittedAt_idx" ON "ClassFeedback"("shareOnWebsite", "submittedAt")',
  );
  await runOptional(`
    ALTER TABLE "ClassFeedback"
    ADD CONSTRAINT "ClassFeedback_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await runOptional(`
    ALTER TABLE "ClassFeedback"
    ADD CONSTRAINT "ClassFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS "StudioSetting" (
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StudioSetting_pkey" PRIMARY KEY ("key")
    )
  `);

  // Per-session / per-class pricing, public description, and fractional credits.
  await run(
    'ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "pricePence" INTEGER',
  );
  await run(
    'ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "creditCost" DOUBLE PRECISION NOT NULL DEFAULT 1',
  );
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "publicDescription" TEXT',
  );
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "displayTitle" TEXT',
  );
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "pricePence" INTEGER',
  );
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "creditCost" DOUBLE PRECISION',
  );
  await run(
    'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "creditsCharged" DOUBLE PRECISION',
  );

  await runOptional(
    'ALTER TABLE "User" ALTER COLUMN "creditsRemaining" TYPE DOUBLE PRECISION USING ("creditsRemaining"::double precision)',
  );
  await runOptional(
    'ALTER TABLE "ClassPackPurchase" ALTER COLUMN "creditsGranted" TYPE DOUBLE PRECISION USING ("creditsGranted"::double precision)',
  );
  await runOptional(
    'ALTER TABLE "ClassPackPurchase" ALTER COLUMN "creditsRemaining" TYPE DOUBLE PRECISION USING ("creditsRemaining"::double precision)',
  );
  await runOptional(
    'ALTER TABLE "ClassPack" ALTER COLUMN "credits" TYPE DOUBLE PRECISION USING ("credits"::double precision)',
  );
  await runOptional(
    'ALTER TABLE "CreditTransaction" ALTER COLUMN "amount" TYPE DOUBLE PRECISION USING ("amount"::double precision)',
  );
  await runOptional(
    'ALTER TABLE "CreditTransaction" ALTER COLUMN "balanceAfter" TYPE DOUBLE PRECISION USING ("balanceAfter"::double precision)',
  );

  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "courseSeriesId" TEXT',
  );
  await run(
    'ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "courseWeek" INTEGER',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "Session_courseSeriesId_idx" ON "Session"("courseSeriesId")',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'employee',
      "permissions" JSONB,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
    )
  `);
  await runOptional(
    'CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email")',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "AdminUser_role_idx" ON "AdminUser"("role")',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "AdminUser_active_idx" ON "AdminUser"("active")',
  );

  await run(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "memberType" TEXT NOT NULL DEFAULT \'adult\'',
  );
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "guardianUserId" TEXT');
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentalConsentAt" TIMESTAMP(3)');
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentalConsentName" TEXT');
  await run(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentalConsentRelationship" TEXT',
  );
  await run('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "parentalConsentVersion" TEXT');
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "User_guardianUserId_idx" ON "User"("guardianUserId")',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "User_memberType_idx" ON "User"("memberType")',
  );
  await runOptional('ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key"');
  await runOptional('DROP INDEX IF EXISTS "User_email_key"');
  await runOptional(
    'CREATE UNIQUE INDEX IF NOT EXISTS "User_email_login_key" ON "User" (email) WHERE "guardianUserId" IS NULL',
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "GuardianIdDocument" (
      "id" TEXT NOT NULL,
      "childUserId" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "data" BYTEA NOT NULL,
      "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "reviewedAt" TIMESTAMP(3),
      "reviewedByAdminId" TEXT,
      "reviewNote" TEXT,
      CONSTRAINT "GuardianIdDocument_pkey" PRIMARY KEY ("id")
    )
  `);
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "GuardianIdDocument_childUserId_idx" ON "GuardianIdDocument"("childUserId")',
  );
  await runOptional(
    'CREATE INDEX IF NOT EXISTS "GuardianIdDocument_status_idx" ON "GuardianIdDocument"("status")',
  );

  await runOptional('DROP INDEX IF EXISTS "Booking_sessionId_email_active_key"');
  await runOptional(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Booking_sessionId_userId_active_key"
    ON "Booking" ("sessionId", "userId")
    WHERE "status" IN ('confirmed', 'pending') AND "userId" IS NOT NULL
  `);
  await runOptional(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Booking_sessionId_guest_email_active_key"
    ON "Booking" ("sessionId", lower("email"))
    WHERE "status" IN ('confirmed', 'pending') AND "userId" IS NULL
  `);

  console.log("Schema sync complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
