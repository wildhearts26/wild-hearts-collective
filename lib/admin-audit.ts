import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export {
  buildMemberAuditChanges,
  formatAdminAuditSummary,
  type AdminAuditChange,
} from "@/lib/admin-audit-format";

export async function logAdminAction(input: {
  action: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  /** Override when session is unavailable (e.g. background jobs). */
  adminLabel?: string;
}) {
  const session = await getAdminSession().catch(() => null);
  const adminLabel =
    input.adminLabel?.trim() ||
    session?.name?.trim() ||
    session?.email?.trim() ||
    "admin";

  await db.adminAuditLog.create({
    data: {
      action: input.action,
      targetUserId: input.targetUserId,
      adminLabel,
      details: input.details ? JSON.stringify(input.details) : null,
    },
  });
}
