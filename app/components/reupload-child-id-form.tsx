"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { idDocumentStatusLabel } from "@/lib/household-config";

type ReuploadChildIdFormProps = {
  childId: string;
  childName: string;
  status: string | null;
};

export function ReuploadChildIdForm({
  childId,
  childName,
  status,
}: ReuploadChildIdFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/members/children/${childId}/id-document`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to upload identification.");
        return;
      }
      form.reset();
      setMessage(`New identification uploaded for ${childName}. The studio will review it.`);
      router.refresh();
    } catch {
      setError("Unable to upload identification. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status !== "rejected" && status !== "pending") {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-sm border border-plum/10 bg-white px-4 py-4"
      encType="multipart/form-data"
    >
      <p className="text-sm text-plum">
        Identification status for {childName}:{" "}
        <strong>{idDocumentStatusLabel(status ?? "pending")}</strong>
        {status === "rejected"
          ? ". Upload a clearer photo or scan of your own ID so they can book again."
          : ". You can replace the document while it is awaiting review."}
      </p>
      <input
        name="idDocument"
        type="file"
        required
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-sage file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white"
      />
      {message ? (
        <p className="text-sm text-sage" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Uploading…" : "Upload new identification"}
      </button>
    </form>
  );
}
