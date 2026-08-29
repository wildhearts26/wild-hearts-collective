"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLASS_TYPE_OPTIONS } from "@/lib/admin-studio-config";
import type { TimetableClass, TimetableDay } from "@/lib/site-data";
import { AdminSavedDialog } from "@/app/components/admin-saved-dialog";

const inputClass =
  "w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20";

const selectClass =
  "w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20";

const WEEKLY_DAY_COUNT = 7;

type DayDraft = {
  key: string;
  day: string;
  classes: ClassDraft[];
};

type ClassDraft = {
  key: string;
  time: string;
  title: string;
  note: string;
  bookClassSlug: string;
};

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDraft(days: TimetableDay[]): DayDraft[] {
  return days.map((day) => ({
    key: newKey(),
    day: day.day,
    classes: day.classes.map((item) => ({
      key: newKey(),
      time: item.time ?? "",
      title: item.title,
      note: item.note ?? "",
      bookClassSlug: item.bookClassSlug ?? "",
    })),
  }));
}

function emptyClass(): ClassDraft {
  return {
    key: newKey(),
    time: "",
    title: "",
    note: "",
    bookClassSlug: "",
  };
}

function toPayload(days: DayDraft[]): TimetableDay[] {
  return days.map((day) => ({
    day: day.day.trim(),
    classes: day.classes
      .map(
        (item): TimetableClass => ({
          time: item.time.trim(),
          title: item.title.trim(),
          ...(item.note.trim() ? { note: item.note.trim() } : {}),
          ...(item.bookClassSlug.trim()
            ? { bookClassSlug: item.bookClassSlug.trim() }
            : {}),
        }),
      )
      .filter((item) => item.title.length > 0),
  }));
}

export function AdminTimetablePanel({
  initialDays,
  initialSource,
  initialVisible = true,
}: {
  initialDays: TimetableDay[];
  initialSource: "database" | "default";
  initialVisible?: boolean;
}) {
  const router = useRouter();
  const [days, setDays] = useState(() => toDraft(initialDays));
  const [source, setSource] = useState(initialSource);
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savedOpen, setSavedOpen] = useState(false);

  function updateDay(dayKey: string, patch: Partial<Pick<DayDraft, "day">>) {
    setDays((current) =>
      current.map((day) => (day.key === dayKey ? { ...day, ...patch } : day)),
    );
  }

  function updateClass(
    dayKey: string,
    classKey: string,
    patch: Partial<Omit<ClassDraft, "key">>,
  ) {
    setDays((current) =>
      current.map((day) => {
        if (day.key !== dayKey) return day;
        return {
          ...day,
          classes: day.classes.map((item) =>
            item.key === classKey ? { ...item, ...patch } : item,
          ),
        };
      }),
    );
  }

  function addClass(dayKey: string) {
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey
          ? { ...day, classes: [...day.classes, emptyClass()] }
          : day,
      ),
    );
  }

  function removeClass(dayKey: string, classKey: string) {
    setDays((current) =>
      current.map((day) => {
        if (day.key !== dayKey) return day;
        return {
          ...day,
          classes: day.classes.filter((item) => item.key !== classKey),
        };
      }),
    );
  }

  function moveClass(dayKey: string, classKey: string, direction: -1 | 1) {
    setDays((current) =>
      current.map((day) => {
        if (day.key !== dayKey) return day;
        const index = day.classes.findIndex((item) => item.key === classKey);
        if (index < 0) return day;
        const next = index + direction;
        if (next < 0 || next >= day.classes.length) return day;
        const classes = [...day.classes];
        const [row] = classes.splice(index, 1);
        classes.splice(next, 0, row);
        return { ...day, classes };
      }),
    );
  }

  function addDay() {
    setDays((current) => [
      ...current,
      { key: newKey(), day: "New day", classes: [emptyClass()] },
    ]);
  }

  function removeDay(dayKey: string) {
    setDays((current) => current.filter((day) => day.key !== dayKey));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(days);
      const response = await fetch("/api/admin/timetable", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: payload, visible }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save timetable.");
      }

      setDays(toDraft(data.days));
      setSource(data.source ?? "database");
      if (typeof data.visible === "boolean") setVisible(data.visible);
      setMessage("Marketing timetable saved. The homepage will show this version.");
      setSavedOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save timetable.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVisibilityToggle(nextVisible: boolean) {
    setVisibilityLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/timetable", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update visibility.");
      }
      setVisible(typeof data.visible === "boolean" ? data.visible : nextVisible);
      setMessage(
        nextVisible
          ? "Homepage timetable is now visible."
          : "Homepage timetable is now hidden.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update visibility.");
    } finally {
      setVisibilityLoading(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSave} className="space-y-8">
      {(message || error) && (
        <div
          className={`rounded-sm border px-4 py-3 text-sm ${
            error
              ? "border-brand/30 bg-pink-soft text-brand"
              : "border-sage/40 bg-sage-light text-plum"
          }`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-plum/10 bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-plum">Show on homepage</p>
          <p className="mt-1 text-sm text-muted">
            When off, the timetable section is hidden on the public homepage.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-plum">
          <span className="text-xs uppercase tracking-wider text-muted">
            {visible ? "Visible" : "Hidden"}
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-sage"
            checked={visible}
            disabled={visibilityLoading || loading}
            onChange={(event) => handleVisibilityToggle(event.target.checked)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Source: {source === "database" ? "admin (database)" : "site defaults"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addDay}
            className="rounded-sm border border-plum/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
          >
            Add promotion
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-sage px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save timetable"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((day, dayIndex) => (
          <section
            key={day.key}
            className="rounded-lg border border-plum/10 bg-surface p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {dayIndex < WEEKLY_DAY_COUNT ? "Day name" : "Date / promotion label"}
                </span>
                <input
                  required
                  value={day.day}
                  onChange={(event) =>
                    updateDay(day.key, { day: event.target.value })
                  }
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
              <button
                type="button"
                onClick={() => removeDay(day.key)}
                className="rounded-sm border border-brand/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand transition hover:bg-pink-soft"
              >
                Remove day
              </button>
            </div>

            <ul className="mt-5 space-y-4">
              {day.classes.map((item, index) => (
                <li
                  key={item.key}
                  className="rounded-sm border border-plum/10 bg-white p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Time
                      </span>
                      <input
                        value={item.time}
                        onChange={(event) =>
                          updateClass(day.key, item.key, {
                            time: event.target.value,
                          })
                        }
                        placeholder="e.g. 6:00 – 7:00"
                        className={`mt-1.5 ${inputClass}`}
                      />
                    </label>
                    <label className="block sm:col-span-1 lg:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Class title
                      </span>
                      <input
                        required
                        value={item.title}
                        onChange={(event) =>
                          updateClass(day.key, item.key, {
                            title: event.target.value,
                          })
                        }
                        className={`mt-1.5 ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Book link
                      </span>
                      <select
                        value={item.bookClassSlug}
                        onChange={(event) =>
                          updateClass(day.key, item.key, {
                            bookClassSlug: event.target.value,
                          })
                        }
                        className={`mt-1.5 ${selectClass}`}
                      >
                        <option value="">General /book</option>
                        {CLASS_TYPE_OPTIONS.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.label} ({option.slug})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Note (optional)
                    </span>
                    <input
                      value={item.note}
                      onChange={(event) =>
                        updateClass(day.key, item.key, {
                          note: event.target.value,
                        })
                      }
                      placeholder="Shown under the class title"
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveClass(day.key, item.key, -1)}
                      className="rounded-sm border border-plum/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === day.classes.length - 1}
                      onClick={() => moveClass(day.key, item.key, 1)}
                      className="rounded-sm border border-plum/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClass(day.key, item.key)}
                      className="rounded-sm border border-brand/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand transition hover:bg-pink-soft"
                    >
                      Remove class
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => addClass(day.key)}
              className="mt-4 rounded-sm border border-plum/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
            >
              Add class
            </button>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-plum/10 pt-6">
        <p className="max-w-xl text-sm text-muted">
          The first seven rows are the weekly homepage timetable. Each day’s card grows
          and shrinks automatically with the classes you add, including Saturday and
          Sunday. Additional promotions appear below it on the homepage — use a date or
          label such as “1 September”. Each weekday needs at least one class. Class
          rows with a book link open{" "}
          <code className="text-xs">/book?class=…</code>; blank uses{" "}
          <code className="text-xs">/book</code>.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-sage px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save timetable"}
        </button>
      </div>
    </form>
    <AdminSavedDialog
      open={savedOpen}
      title="Timetable saved"
      description={<p>The homepage timetable has been updated.</p>}
      onClose={() => setSavedOpen(false)}
    />
    </>
  );
}
