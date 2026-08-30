import {
  sendMembershipCancelledAdminEmail,
  sendMembershipPausedAdminEmail,
  sendNewMemberRegisteredEmail,
  sendChildIdDocumentReviewEmail,
} from "@/lib/email";

export async function notifyAdminOfNewMember(member: {
  name: string;
  email: string;
  phone?: string | null;
  signupMethod: "email" | "google";
  emailVerified: boolean;
  memberType?: "adult" | "child";
}) {
  try {
    await sendNewMemberRegisteredEmail(member);
  } catch (error) {
    console.error("[member-notify]", error);
  }
}

export async function notifyParentOfIdDocumentReview(input: {
  toEmail: string;
  parentName: string;
  childName: string;
  status: "approved" | "rejected";
  reviewNote?: string | null;
}) {
  try {
    await sendChildIdDocumentReviewEmail(input);
  } catch (error) {
    console.error("[member-notify:id-review]", error);
  }
}

export async function notifyAdminOfMembershipCancelled(input: {
  name: string;
  email: string;
  cancelledBy?: "member" | "admin" | "system";
  reason?: string | null;
  immediate?: boolean;
  finalAccessDate?: Date | null;
}) {
  try {
    await sendMembershipCancelledAdminEmail(
      { name: input.name, email: input.email },
      {
        cancelledBy: input.cancelledBy,
        reason: input.reason,
        immediate: input.immediate,
        finalAccessDate: input.finalAccessDate,
      },
    );
  } catch (error) {
    console.error("[member-notify:cancel]", error);
  }
}

export async function notifyAdminOfMembershipPaused(input: {
  name: string;
  email: string;
  pausedBy?: "member" | "admin";
  pauseStart?: Date | null;
  resumeAt?: Date | null;
}) {
  try {
    await sendMembershipPausedAdminEmail(
      { name: input.name, email: input.email },
      {
        cancelledBy: input.pausedBy,
        pauseStart: input.pauseStart,
        resumeAt: input.resumeAt,
      },
    );
  } catch (error) {
    console.error("[member-notify:pause]", error);
  }
}
