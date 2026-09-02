"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClassPackPurchaseRow = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerId: string;
  packName: string;
  purchasedAt: string;
  purchasedLabel: string;
  creditsGranted: number;
  creditsRemaining: number;
  creditsRemainingLabel: string;
  status: string;
};

type AnalyticsData = {
  summary: {
    occupancyPercent: number;
    totalSessions: number;
    totalBookings: number;
    activeStudents: number;
    retentionRate: number;
    classPacksSold: number;
    engagementEmailsSent: number;
    noShowsTracked: number;
  };
  popularClasses: Array<{
    slug: string;
    title: string;
    bookings: number;
    sessions: number;
    occupancyPercent: number;
  }>;
  peakHours: Array<{ hour: string; bookings: number }>;
  monthlyBookingTrend: Array<{ month: string; bookings: number }>;
  attendanceBreakdown: { attended: number; noShow: number };
  classPackPurchases: ClassPackPurchaseRow[];
  periodDays: number;
};

function packStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "exhausted":
      return "Used up";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [packsOpen, setPacksOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? "Unable to load analytics.");
        }
        if (payload.error) throw new Error(payload.error);
        setData({
          ...payload,
          classPackPurchases: Array.isArray(payload.classPackPurchases)
            ? payload.classPackPurchases
            : [],
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load analytics."));
  }, []);

  if (error) {
    return <p className="text-sm text-brand">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted">Loading analytics…</p>;
  }

  const stats = [
    { label: "Overall fill rate (30d)", value: `${data.summary.occupancyPercent}%` },
    { label: "Confirmed bookings", value: String(data.summary.totalBookings) },
    { label: "Active students (30d)", value: String(data.summary.activeStudents) },
    { label: "Retention rate", value: `${data.summary.retentionRate}%` },
    { label: "Engagement emails", value: String(data.summary.engagementEmailsSent) },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-4xl text-plum">{stat.value}</p>
          </div>
        ))}

        <div className="rounded-sm border border-plum/10 bg-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Class passes sold
            </p>
            <button
              type="button"
              onClick={() => setPacksOpen((open) => !open)}
              aria-expanded={packsOpen}
              aria-controls="class-pack-purchases"
              className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
            >
              {packsOpen ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-2 font-display text-4xl text-plum">{data.summary.classPacksSold}</p>
          <p className="mt-2 text-xs text-muted">
            Last {data.periodDays} days.{" "}
            {packsOpen
              ? "Purchase details listed below."
              : "Show to view buyer, date, pass type, and remaining credits."}
          </p>
        </div>
      </div>

      {packsOpen && (
        <section id="class-pack-purchases" className="-mt-4">
          <h2 className="font-display text-3xl text-plum">Class pass purchases</h2>
          <p className="mt-2 text-sm text-muted">
            Completed purchases in the last {data.periodDays} days — member, purchase date, pass
            type, and credits still available on that pass.
          </p>
          <div className="mt-4 overflow-hidden rounded-sm border border-plum/10 bg-surface">
            {data.classPackPurchases.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                No class passes sold in the last {data.periodDays} days.
              </p>
            ) : (
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[40rem] table-fixed text-left text-sm">
                  <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                    <tr>
                      <th className="w-[28%] px-3 py-3">Buyer</th>
                      <th className="w-[26%] px-3 py-3">Purchased</th>
                      <th className="w-[24%] px-3 py-3">Pass</th>
                      <th className="w-[22%] px-3 py-3">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.classPackPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-plum/10 align-top last:border-b-0">
                        <td className="px-3 py-3">
                          <Link
                            href={`/admin/members/${purchase.buyerId}`}
                            className="truncate font-medium text-plum hover:text-pink hover:underline"
                            title={purchase.buyerName}
                          >
                            {purchase.buyerName}
                          </Link>
                          <a
                            href={`mailto:${purchase.buyerEmail}`}
                            className="mt-0.5 block truncate text-xs text-muted hover:text-pink hover:underline"
                            title={purchase.buyerEmail}
                          >
                            {purchase.buyerEmail}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-muted">{purchase.purchasedLabel}</td>
                        <td className="px-3 py-3">
                          <p className="truncate font-medium text-plum" title={purchase.packName}>
                            {purchase.packName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{packStatusLabel(purchase.status)}</p>
                        </td>
                        <td className="px-3 py-3 text-muted">{purchase.creditsRemainingLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-3xl text-plum">Popular classes</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Totals for the last {data.periodDays} days. Bookings and fill rate combine every
          scheduled session of that class type — not a single session. For example, one full
          class of 12 plus six empty sessions shows 12 bookings and about 14% fill rate.
        </p>
        <div className="mt-4 overflow-hidden rounded-sm border border-plum/10 bg-surface">
          <div className="min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="w-[40%] px-3 py-3">Class</th>
                  <th className="w-[18%] px-3 py-3">Sessions</th>
                  <th className="w-[20%] px-3 py-3">Bookings</th>
                  <th className="w-[22%] px-3 py-3">Fill rate</th>
                </tr>
              </thead>
            <tbody>
              {data.popularClasses.map((item) => (
                <tr key={item.slug} className="border-b border-plum/10">
                  <td className="px-3 py-3">
                    <p className="truncate font-medium text-plum" title={item.title}>
                      {item.title}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted">{item.sessions}</td>
                  <td className="px-3 py-3 text-muted">{item.bookings}</td>
                  <td className="px-3 py-3 text-muted">{item.occupancyPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-plum">Peak hours</h2>
          <ul className="mt-4 space-y-2">
            {data.peakHours.map((item) => (
              <li
                key={item.hour}
                className="flex items-center justify-between rounded-sm border border-plum/10 bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-plum">{item.hour}:00</span>
                <span className="text-muted">{item.bookings} bookings</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-3xl text-plum">Monthly bookings</h2>
          <ul className="mt-4 space-y-2">
            {data.monthlyBookingTrend.map((item) => (
              <li
                key={item.month}
                className="flex items-center justify-between rounded-sm border border-plum/10 bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-plum">{item.month}</span>
                <span className="text-muted">{item.bookings}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-plum">Attendance breakdown</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-sm text-muted">Attended</p>
            <p className="mt-2 font-display text-4xl text-plum">{data.attendanceBreakdown.attended}</p>
          </div>
          <div className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-sm text-muted">No shows</p>
            <p className="mt-2 font-display text-4xl text-plum">{data.attendanceBreakdown.noShow}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
