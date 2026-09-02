"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/app/components/admin-confirm-dialog";

const attendanceOptions = [
  { value: "", label: "Not marked" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No show" },
] as const;

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type AdminBookingActionsProps = {
  bookingId: string;
  currentStatus: string;
  currentAttendance?: string | null;
  /** ISO timestamp — attendance is disabled until the class has started. */
  sessionStartsAt?: string | null;
};

export function AdminBookingActions({
  bookingId,
  currentStatus,
  currentAttendance,
  sessionStartsAt,
}: AdminBookingActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [attendance, setAttendance] = useState(currentAttendance ?? "");
  const [refundCredit, setRefundCredit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const classHasStarted =
    !sessionStartsAt || new Date(sessionStartsAt).getTime() <= Date.now();
  const attendanceLocked = !classHasStarted;

  async function patchBooking(body: Record<string, string | boolean>) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update booking.");
      }

      if (data.status) setStatus(data.status);
      if (data.attendance) setAttendance(data.attendance);
      if (data.deleted) {
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update booking.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBooking() {
    setDeleteDialogOpen(false);
    await patchBooking({ action: "delete", refundCredit });
  }

  return (
    <>
      <AdminConfirmDialog
        open={deleteDialogOpen}
        title="Delete this booking?"
        description={
          <>
            <p>
              This permanently removes the booking from the admin list. No cancellation
              email will be sent — intended for test data cleanup.
            </p>
            {refundCredit && (
              <p className="mt-3 font-medium text-plum">
                A class credit refund matching the credit cost of that booking will be
                added to the member&apos;s account.
              </p>
            )}
          </>
        }
        confirmLabel="Delete booking"
        cancelLabel="Keep booking"
        variant="danger"
        loading={loading}
        onConfirm={deleteBooking}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <div className="min-w-0 space-y-2">
      <select
        value={status}
        disabled={loading}
        onChange={(event) => patchBooking({ status: event.target.value })}
        className="block w-full rounded-sm border border-plum/15 bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide text-plum"
      >
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={attendance}
        disabled={loading || attendanceLocked}
        onChange={(event) => {
          if (!event.target.value) return;
          patchBooking({ attendance: event.target.value });
        }}
        className="block w-full rounded-sm border border-plum/15 bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide text-plum disabled:cursor-not-allowed disabled:opacity-60"
        title={
          attendanceLocked
            ? "Attendance can only be marked once the class has started"
            : undefined
        }
      >
        {attendanceOptions.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {attendanceLocked && (
        <p className="text-[11px] leading-snug text-muted">
          Check-in unlocks when the class starts.
        </p>
      )}

      <label className="flex items-center gap-2 text-[11px] text-muted">
        <input
          type="checkbox"
          checked={refundCredit}
          onChange={(event) => setRefundCredit(event.target.checked)}
        />
        Refund as class credits if deleted
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={() => setDeleteDialogOpen(true)}
        className="w-full rounded-sm border border-brand/30 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand hover:bg-brand/5 disabled:opacity-60"
      >
        Delete
      </button>

      {error && <p className="text-xs text-brand">{error}</p>}
    </div>
    </>
  );
}
