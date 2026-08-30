"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PARENTAL_RELATIONSHIPS } from "@/lib/household-config";

const inputClass =
  "mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1";

type AddChildMemberFormProps = {
  guardianName: string;
};

export function AddChildMemberForm({ guardianName }: AddChildMemberFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("consentGiven", consentGiven ? "true" : "false");

    try {
      const response = await fetch("/api/members/children", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to add child member.");
        return;
      }

      form.reset();
      setConsentGiven(false);
      setMessage(`${data.child.name} has been added as a child member.`);
      router.refresh();
    } catch {
      setError("Unable to add child member. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
      <div>
        <h3 className="font-display text-2xl text-plum">Child member details</h3>
        <p className="mt-2 text-sm text-muted">
          Child members use the same household email and complete the same studio
          information. They book and pay separately once you switch to their profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="child-name" className="block text-sm font-semibold text-plum">
            Child&apos;s full name
          </label>
          <input id="child-name" name="name" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="child-dob" className="block text-sm font-semibold text-plum">
            Date of birth
          </label>
          <input id="child-dob" name="dateOfBirth" type="date" required className={inputClass} />
          <p className="mt-1 text-xs text-muted">Child members must be under 18.</p>
        </div>
        <div>
          <label htmlFor="child-phone" className="block text-sm font-semibold text-plum">
            Phone <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="child-phone" name="phone" type="tel" className={inputClass} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-brand">
          Emergency contact
        </h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="emergency-name" className="block text-sm font-semibold text-plum">
              Name
            </label>
            <input
              id="emergency-name"
              name="emergencyContactName"
              type="text"
              required
              defaultValue={guardianName}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emergency-relationship" className="block text-sm font-semibold text-plum">
              Relationship
            </label>
            <select
              id="emergency-relationship"
              name="emergencyContactRelationship"
              required
              defaultValue="Mother"
              className={inputClass}
            >
              {PARENTAL_RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="emergency-phone" className="block text-sm font-semibold text-plum">
              Phone
            </label>
            <input
              id="emergency-phone"
              name="emergencyContactPhone"
              type="tel"
              required
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label htmlFor="medical-notes" className="block text-sm font-semibold text-plum">
            Medical notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="medical-notes" name="medicalNotes" rows={3} className={inputClass} />
        </div>
        <div>
          <label htmlFor="injuries" className="block text-sm font-semibold text-plum">
            Injuries or limitations <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="injuries" name="injuriesLimitations" rows={3} className={inputClass} />
        </div>
        <div>
          <label htmlFor="allergies" className="block text-sm font-semibold text-plum">
            Allergies or safety alerts <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="allergies" name="allergiesSafetyAlerts" rows={3} className={inputClass} />
        </div>
      </div>

      <div className="rounded-sm border border-plum/10 bg-pink-soft/40 p-5">
        <h4 className="font-display text-2xl text-plum">Parental consent</h4>
        <p className="mt-2 text-sm text-muted">
          A parent or legal guardian must give consent and upload proof of identification
          before this child can take part in classes.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="consent-name" className="block text-sm font-semibold text-plum">
              Parent or guardian name
            </label>
            <input
              id="consent-name"
              name="parentalConsentName"
              type="text"
              required
              defaultValue={guardianName}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="consent-relationship" className="block text-sm font-semibold text-plum">
              Relationship to child
            </label>
            <select
              id="consent-relationship"
              name="parentalConsentRelationship"
              required
              defaultValue="Mother"
              className={inputClass}
            >
              {PARENTAL_RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="id-document" className="block text-sm font-semibold text-plum">
            Proof of identification
          </label>
          <input
            id="id-document"
            name="idDocument"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className={`${inputClass} file:mr-3 file:rounded-sm file:border-0 file:bg-sage file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white`}
          />
          <p className="mt-1 text-xs text-muted">
            Upload a photo or scan of your passport, driving licence, or similar photo ID
            (JPG, PNG, WebP, or PDF, max 4 MB). This is stored privately for studio review.
          </p>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-plum">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(event) => setConsentGiven(event.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I am the parent or legal guardian of this child. I give consent for them to become a
            member of Wild Hearts Collective and take part in studio activities. I confirm the
            identification document I am uploading is mine.
          </span>
        </label>
      </div>

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
        className="rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Adding child member…" : "Add child member"}
      </button>
    </form>
  );
}
