"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSavedDialog } from "@/app/components/admin-saved-dialog";
import { formatMoneyFromPence } from "@/lib/booking-config";
import type {
  AdminClassPack,
  StudioPricingSettings,
} from "@/lib/studio-pricing-service";

type AdminPricingPanelProps = {
  initialSettings: StudioPricingSettings;
  initialPacks: AdminClassPack[];
};

type PackDraft = {
  name: string;
  description: string;
  credits: string;
  pricePounds: string;
  validDays: string;
  sortOrder: string;
  active: boolean;
};

function toDraft(pack: AdminClassPack): PackDraft {
  return {
    name: pack.name,
    description: pack.description ?? "",
    credits: String(pack.credits),
    pricePounds: (pack.pricePence / 100).toFixed(2),
    validDays: String(pack.validDays),
    sortOrder: String(pack.sortOrder),
    active: pack.active,
  };
}

const emptyNewPack: PackDraft = {
  name: "",
  description: "",
  credits: "5",
  pricePounds: "",
  validDays: "90",
  sortOrder: "0",
  active: true,
};

export function AdminPricingPanel({
  initialSettings,
  initialPacks,
}: AdminPricingPanelProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [packs, setPacks] = useState(initialPacks);
  const [dropInPounds, setDropInPounds] = useState(
    (initialSettings.dropInPricePence / 100).toFixed(2),
  );
  const [coursePounds, setCoursePounds] = useState(
    (initialSettings.fourWeekCoursePricePence / 100).toFixed(2),
  );
  const [drafts, setDrafts] = useState<Record<string, PackDraft>>(() =>
    Object.fromEntries(initialPacks.map((pack) => [pack.id, toDraft(pack)])),
  );
  const [newPack, setNewPack] = useState<PackDraft>(emptyNewPack);
  const [showNewPack, setShowNewPack] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [packLoadingId, setPackLoadingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savedOpen, setSavedOpen] = useState(false);

  const dropInPreview = useMemo(() => {
    const parsed = Number.parseFloat(dropInPounds);
    if (!Number.isFinite(parsed)) return "—";
    return formatMoneyFromPence(Math.round(parsed * 100));
  }, [dropInPounds]);

  const coursePreview = useMemo(() => {
    const parsed = Number.parseFloat(coursePounds);
    if (!Number.isFinite(parsed)) return "—";
    return formatMoneyFromPence(Math.round(parsed * 100));
  }, [coursePounds]);

  function updateDraft(id: string, patch: Partial<PackDraft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSettingsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropInPricePounds: Number.parseFloat(dropInPounds),
          fourWeekCoursePricePounds: Number.parseFloat(coursePounds),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save studio pricing.");
      }
      setSettings(payload.settings);
      setMessage("Studio pricing saved.");
      setSavedOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save studio pricing.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function savePack(packId: string) {
    const draft = drafts[packId];
    if (!draft) return;

    setPackLoadingId(packId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pricing/packs/${packId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          credits: Number.parseFloat(draft.credits),
          pricePounds: Number.parseFloat(draft.pricePounds),
          validDays: Number.parseInt(draft.validDays, 10),
          sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
          active: draft.active,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save class pack.");
      }

      setPacks((current) =>
        current.map((pack) => (pack.id === packId ? payload.pack : pack)),
      );
      setDrafts((current) => ({
        ...current,
        [packId]: toDraft(payload.pack),
      }));
      setMessage(`Saved “${payload.pack.name}”.`);
      setSavedOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save class pack.");
    } finally {
      setPackLoadingId(null);
    }
  }

  async function createPack(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPack.name,
          description: newPack.description,
          credits: Number.parseFloat(newPack.credits),
          pricePounds: Number.parseFloat(newPack.pricePounds),
          validDays: Number.parseInt(newPack.validDays, 10),
          sortOrder: Number.parseInt(newPack.sortOrder, 10) || 0,
          active: newPack.active,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create class pack.");
      }

      setPacks((current) => [...current, payload.pack].sort((a, b) => a.sortOrder - b.sortOrder));
      setDrafts((current) => ({
        ...current,
        [payload.pack.id]: toDraft(payload.pack),
      }));
      setNewPack(emptyNewPack);
      setShowNewPack(false);
      setMessage(`Created “${payload.pack.name}”.`);
      setSavedOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create class pack.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-10">
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

      <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-plum">Studio pricing</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Drop-in class fee and 4-week course block fee used at checkout.
            </p>
          </div>
          <p className="text-xs text-muted">
            Sources: drop-in {settings.dropInSource === "database" ? "admin" : "env"} ·
            course{" "}
            {settings.fourWeekCourseSource === "database" ? "admin" : "default"}
          </p>
        </div>

        <form onSubmit={saveSettings} className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Drop-in class price (£)
            </span>
            <input
              required
              inputMode="decimal"
              value={dropInPounds}
              onChange={(event) => setDropInPounds(event.target.value)}
              className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
            />
            <p className="mt-1 text-xs text-muted">Preview: {dropInPreview}</p>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              4-week course price (£)
            </span>
            <input
              required
              inputMode="decimal"
              value={coursePounds}
              onChange={(event) => setCoursePounds(event.target.value)}
              className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
            />
            <p className="mt-1 text-xs text-muted">
              Full block fee for beginner-courses. Preview: {coursePreview}
            </p>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={settingsLoading}
              className="rounded-sm bg-sage px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-plum disabled:opacity-60"
            >
              {settingsLoading ? "Saving…" : "Save studio pricing"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-plum">Class passes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Edit price, credit volume, and validity for class packs (and any
              custom packs). Inactive packs stay hidden from members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewPack((value) => !value)}
            className="rounded-sm border border-plum/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
          >
            {showNewPack ? "Cancel new pack" : "Add class pack"}
          </button>
        </div>

        {showNewPack && (
          <form
            onSubmit={createPack}
            className="rounded-lg border border-dashed border-pink/40 bg-pink-soft/40 p-6"
          >
            <h3 className="font-display text-xl text-plum">New class pack</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PackFields
                draft={newPack}
                onChange={(patch) => setNewPack((current) => ({ ...current, ...patch }))}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="mt-5 rounded-sm bg-sage px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-plum disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create pack"}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {packs.map((pack) => {
            const draft = drafts[pack.id] ?? toDraft(pack);
            const loading = packLoadingId === pack.id;

            return (
              <article
                key={pack.id}
                className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl text-plum">{pack.name}</h3>
                    <p className="mt-1 text-xs text-muted">
                      Slug: <span className="font-mono">{pack.slug}</span> ·{" "}
                      {pack.active ? "Live on membership page" : "Hidden from members"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-plum">{pack.priceLabel}</p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PackFields
                    draft={draft}
                    onChange={(patch) => updateDraft(pack.id, patch)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => savePack(pack.id)}
                    className="rounded-sm bg-sage px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-plum disabled:opacity-60"
                  >
                    {loading ? "Saving…" : "Save pack"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const nextActive = !draft.active;
                      void (async () => {
                        setPackLoadingId(pack.id);
                        setError("");
                        try {
                          const response = await fetch(
                            `/api/admin/pricing/packs/${pack.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ active: nextActive }),
                            },
                          );
                          const payload = await response.json();
                          if (!response.ok) {
                            throw new Error(
                              payload.error ?? "Unable to update pack visibility.",
                            );
                          }
                          setPacks((current) =>
                            current.map((item) =>
                              item.id === pack.id ? payload.pack : item,
                            ),
                          );
                          setDrafts((current) => ({
                            ...current,
                            [pack.id]: toDraft(payload.pack),
                          }));
                          setMessage(
                            payload.pack.active
                              ? `“${payload.pack.name}” is now live.`
                              : `“${payload.pack.name}” is now hidden.`,
                          );
                          router.refresh();
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Unable to update pack visibility.",
                          );
                        } finally {
                          setPackLoadingId(null);
                        }
                      })();
                    }}
                    className="rounded-sm border border-plum/15 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand disabled:opacity-60"
                  >
                    {draft.active ? "Hide from members" : "Make live"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <AdminSavedDialog
        open={savedOpen}
        title="Saved"
        description={<p>{message || "Your changes have been saved."}</p>}
        onClose={() => setSavedOpen(false)}
      />
    </div>
  );
}

function PackFields({
  draft,
  onChange,
}: {
  draft: PackDraft;
  onChange: (patch: Partial<PackDraft>) => void;
}) {
  return (
    <>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Name
        </span>
        <input
          required
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <label className="block sm:col-span-2 lg:col-span-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Description
        </span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Credits (volume)
        </span>
        <input
          required
          inputMode="decimal"
          value={draft.credits}
          onChange={(event) => onChange({ credits: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
        <p className="mt-1 text-xs text-muted">Decimals allowed, e.g. 5.5</p>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Price (£)
        </span>
        <input
          required
          inputMode="decimal"
          value={draft.pricePounds}
          onChange={(event) => onChange({ pricePounds: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Valid for (days)
        </span>
        <input
          required
          inputMode="numeric"
          value={draft.validDays}
          onChange={(event) => onChange({ validDays: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Sort order
        </span>
        <input
          inputMode="numeric"
          value={draft.sortOrder}
          onChange={(event) => onChange({ sortOrder: event.target.value })}
          className="mt-1.5 w-full rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-pink focus:ring-2 focus:ring-pink/20"
        />
      </label>

      <label className="flex items-center gap-2 pt-6 text-sm text-plum">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => onChange({ active: event.target.checked })}
          className="h-4 w-4 rounded border-plum/30 text-sage focus:ring-pink/30"
        />
        Active (visible to members)
      </label>
    </>
  );
}
