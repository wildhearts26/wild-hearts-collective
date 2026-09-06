"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminTutorRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: { sessions: number };
};

const inputClass =
  "w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  active: true,
};

export function AdminTutorsPanel({
  initialTutors,
}: {
  initialTutors: AdminTutorRecord[];
}) {
  const router = useRouter();
  const [tutors, setTutors] = useState(initialTutors);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function startCreate() {
    setEditingId("new");
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function startEdit(tutor: AdminTutorRecord) {
    setEditingId(tutor.id);
    setForm({
      name: tutor.name,
      email: tutor.email ?? "",
      phone: tutor.phone ?? "",
      bio: tutor.bio ?? "",
      active: tutor.active,
    });
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/admin/tutors" : `/api/admin/tutors/${editingId}`;
      const method = isNew ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          bio: form.bio.trim() || null,
          active: form.active,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save instructor.");

      const saved = data.tutor as AdminTutorRecord;
      setTutors((current) => {
        if (isNew) {
          return [...current, saved].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        }
        return current.map((tutor) => (tutor.id === saved.id ? saved : tutor));
      });
      setEditingId(null);
      setForm(emptyForm);
      setMessage(isNew ? "Instructor added." : "Instructor updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save instructor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(tutor: AdminTutorRecord) {
    const hasSessions = tutor._count.sessions > 0;
    const confirmed = window.confirm(
      hasSessions
        ? `${tutor.name} has ${tutor._count.sessions} session(s). Deactivate instead of deleting?`
        : `Remove ${tutor.name} permanently?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tutors/${tutor.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove instructor.");

      if (data.deactivated && data.tutor) {
        setTutors((current) =>
          current.map((item) => (item.id === tutor.id ? data.tutor : item)),
        );
        setMessage(`${tutor.name} deactivated (kept for past sessions).`);
      } else {
        setTutors((current) => current.filter((item) => item.id !== tutor.id));
        setMessage(`${tutor.name} removed.`);
      }
      if (editingId === tutor.id) cancelEdit();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove instructor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivate(tutor: AdminTutorRecord) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tutors/${tutor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reactivate.");

      setTutors((current) =>
        current.map((item) => (item.id === tutor.id ? data.tutor : item)),
      );
      setMessage(`${tutor.name} reactivated.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reactivate.");
    } finally {
      setLoading(false);
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="space-y-8">
      {(message || error) && (
        <div
          className={`rounded-sm px-4 py-3 text-sm ${
            error
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-sage/30 bg-sage-light text-plum"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {tutors.filter((t) => t.active).length} active · {tutors.length} total
        </p>
        {!isEditing && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
          >
            Add instructor
          </button>
        )}
      </div>

      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-plum/10 bg-surface p-4 shadow-sm sm:p-6"
        >
          <h2 className="font-display text-2xl text-plum">
            {editingId === "new" ? "Add instructor" : "Edit instructor"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm sm:col-span-2">
              <span className="font-semibold text-plum">Name</span>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className={inputClass}
                placeholder="e.g. Sarah"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-plum">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClass}
                placeholder="Optional"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-plum">Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className={inputClass}
                placeholder="Optional"
              />
            </label>
            <label className="block space-y-2 text-sm sm:col-span-2">
              <span className="font-semibold text-plum">Bio</span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
                className={inputClass}
                placeholder="Short note shown in admin (optional)"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-plum sm:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, active: event.target.checked }))
                }
              />
              Active — available for session assignment
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-sm bg-sage px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand disabled:opacity-60"
            >
              {loading ? "Saving…" : editingId === "new" ? "Add instructor" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
              className="rounded-sm border border-plum/15 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink hover:text-brand disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        {tutors.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No instructors yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-plum/10 sm:hidden">
              {tutors.map((tutor) => (
                <li
                  key={tutor.id}
                  className={`space-y-3 p-4 ${tutor.active ? "" : "bg-cream/50 opacity-80"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-plum">{tutor.name}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          tutor.active
                            ? "bg-emerald-50 text-emerald-900"
                            : "bg-plum/10 text-plum"
                        }`}
                      >
                        {tutor.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="shrink-0 text-xs text-muted">
                      {tutor._count.sessions} session{tutor._count.sessions === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm text-muted">
                    {tutor.email ? (
                      <a
                        href={`mailto:${tutor.email}`}
                        className="block break-all hover:underline"
                      >
                        {tutor.email}
                      </a>
                    ) : (
                      <p className="text-xs">No email</p>
                    )}
                    {tutor.phone ? <p>{tutor.phone}</p> : null}
                    {tutor.bio ? <p className="text-muted">{tutor.bio}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-plum/10 pt-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => startEdit(tutor)}
                      className="text-sm font-semibold text-brand hover:underline disabled:opacity-60"
                    >
                      Edit
                    </button>
                    {!tutor.active ? (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleReactivate(tutor)}
                        className="text-sm font-semibold text-sage hover:underline disabled:opacity-60"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRemove(tutor)}
                        className="text-sm font-semibold text-brand hover:underline disabled:opacity-60"
                      >
                        {tutor._count.sessions > 0 ? "Deactivate" : "Remove"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden min-w-0 sm:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                  <tr>
                    <th className="w-[22%] px-4 py-3 font-semibold">Name</th>
                    <th className="w-[28%] px-4 py-3 font-semibold">Contact</th>
                    <th className="w-[22%] px-4 py-3 font-semibold">Bio</th>
                    <th className="w-[10%] px-4 py-3 font-semibold">Sessions</th>
                    <th className="w-[18%] px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor) => (
                    <tr
                      key={tutor.id}
                      className={`border-b border-plum/8 align-top last:border-b-0 ${
                        tutor.active ? "" : "bg-cream/50 opacity-80"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-plum">{tutor.name}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            tutor.active
                              ? "bg-emerald-50 text-emerald-900"
                              : "bg-plum/10 text-plum"
                          }`}
                        >
                          {tutor.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {tutor.email ? (
                          <a
                            href={`mailto:${tutor.email}`}
                            className="block truncate hover:underline"
                          >
                            {tutor.email}
                          </a>
                        ) : (
                          <p className="text-xs">No email</p>
                        )}
                        {tutor.phone && <p className="mt-1 truncate">{tutor.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 text-muted">{tutor.bio || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{tutor._count.sessions}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => startEdit(tutor)}
                            className="text-sm font-semibold text-brand hover:underline disabled:opacity-60"
                          >
                            Edit
                          </button>
                          {!tutor.active ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleReactivate(tutor)}
                              className="text-sm font-semibold text-sage hover:underline disabled:opacity-60"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleRemove(tutor)}
                              className="text-sm font-semibold text-brand hover:underline disabled:opacity-60"
                            >
                              {tutor._count.sessions > 0 ? "Deactivate" : "Remove"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
