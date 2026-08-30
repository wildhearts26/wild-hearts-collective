import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";
import { ID_DOCUMENT_STATUS } from "@/lib/household-config";

/**
 * Neon HTTP + Prisma cannot round-trip Postgres BYTEA (`Bytes`) columns —
 * reads fail with "JS functions cannot be represented as a serde_json::Value".
 * Access ID document binaries through the Neon SQL client with encode/decode instead.
 */

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  return neon(databaseUrl);
}

function createDocumentId() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

export type IdDocumentBinary = {
  id: string;
  childUserId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
  uploadedAt: Date;
  status: string;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

export async function insertGuardianIdDocument(input: {
  childUserId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}) {
  const sql = getSql();
  const id = createDocumentId();
  const hex = Buffer.from(input.bytes).toString("hex");

  await sql`
    INSERT INTO "GuardianIdDocument" (
      "id",
      "childUserId",
      "fileName",
      "mimeType",
      "data",
      "uploadedAt",
      "status"
    )
    VALUES (
      ${id},
      ${input.childUserId},
      ${input.fileName},
      ${input.mimeType},
      decode(${hex}, 'hex'),
      CURRENT_TIMESTAMP,
      ${ID_DOCUMENT_STATUS.pending}
    )
  `;

  return { id };
}

export async function getLatestGuardianIdDocumentBinary(
  childUserId: string,
): Promise<IdDocumentBinary | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      "id",
      "childUserId",
      "fileName",
      "mimeType",
      encode("data", 'base64') AS "dataBase64",
      "uploadedAt",
      "status",
      "reviewedAt",
      "reviewNote"
    FROM "GuardianIdDocument"
    WHERE "childUserId" = ${childUserId}
    ORDER BY "uploadedAt" DESC
    LIMIT 1
  `;

  const row = rows[0] as
    | {
        id: string;
        childUserId: string;
        fileName: string;
        mimeType: string;
        dataBase64: string;
        uploadedAt: string | Date;
        status: string;
        reviewedAt: string | Date | null;
        reviewNote: string | null;
      }
    | undefined;

  if (!row?.dataBase64) return null;

  return {
    id: row.id,
    childUserId: row.childUserId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    data: Buffer.from(row.dataBase64, "base64"),
    uploadedAt: new Date(row.uploadedAt),
    status: row.status,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
    reviewNote: row.reviewNote,
  };
}
