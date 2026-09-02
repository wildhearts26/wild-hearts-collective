"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({
  bookingId,
  sessionStartsAt,
  status,
  isCourse = false,
}: {
  bookingId: string;
  sessionStartsAt: string;
  status: string;
  isCourse?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (status === "cancelled") {
    return null;
  }

  // Drop-in classes can only be cancelled before they start. A 4-week course
  // can still be cancelled from any week so that all four bookings are removed.
  if (!isCourse && new Date(sessionStartsAt) < new Date()) {
    return null;
  }

  async function cancelBooking() {
    const confirmText = isCourse
      ? "Cancel this 4-week course? All four weeks will be cancelled. You receive class credits only if the course has not started and you cancel at least 24 hours before week 1. If the course has already started, there is no refund. Cash refunds can be requested by email."
      : "Cancel this booking? Cancellations at least 24 hours before class receive class credits matching the credit cost of that class (not the cash amount paid). Cash refunds can be requested by email.";

    if (!confirm(confirmText)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/members/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cancel booking.");
      setMessage(data.message);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={cancelBooking}
        className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline disabled:opacity-60"
      >
        {loading ? "Cancelling…" : isCourse ? "Cancel course" : "Cancel"}
      </button>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
