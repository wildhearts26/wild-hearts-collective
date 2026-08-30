import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonDatabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) return false;

  try {
    return new URL(rawUrl).hostname.includes("neon.tech");
  } catch {
    return rawUrl.includes("neon.tech");
  }
}

function normalizeTcpDatabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const isNeonPooler = url.hostname.includes("-pooler");

    if (isNeonPooler) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;

  if (isNeonDatabaseUrl(rawUrl)) {
    // Prefer HTTPS fetch so serverless does not open a WebSocket. Bundling `ws`
    // on Vercel crashes with "b.mask is not a function" and drops the connection.
    neonConfig.poolQueryViaFetch = true;
    if (!process.env.VERCEL) {
      neonConfig.webSocketConstructor = ws;
    }
    const adapter = new PrismaNeon({ connectionString: rawUrl! });
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const databaseUrl = normalizeTcpDatabaseUrl(rawUrl);
  return new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Dev HMR can keep an old Prisma client missing newly added models — recreate when stale. */
function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    "shopProduct" in cached &&
    "studioSetting" in cached &&
    "adminUser" in cached &&
    "guardianIdDocument" in cached
  ) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const db = getPrismaClient();
