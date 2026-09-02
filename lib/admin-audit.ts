import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export {
  buildMemberAuditChanges,
  describeCreditChange,
  describeMemberChanges,
  formatAdminAuditSummary,
  type AdminAuditChange,
} from "@/lib/admin-audit-format";

export async function logAdminAction(input: {
  action: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  /** Prefer passing the signed-in admin name from the route/handler. */
  adminLabel?: string;
}) {
  const session = input.adminLabel ? null : await getAdminSession().catch(() => null);
  const adminLabel =
    input.adminLabel?.trim() ||
    session?.name?.trim() ||
    session?.email?.trim() ||
    "An admin";

  await db.adminAuditLog.create({
    data: {
      action: input.action,
      targetUserId: input.targetUserId,
      adminLabel,
      details: input.details ? JSON.stringify(input.details) : null,
    },
  });
}
