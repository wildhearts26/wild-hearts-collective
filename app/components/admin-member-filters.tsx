"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ADMIN_MEMBER_SORT,
  ADMIN_MEMBER_SORT_OPTIONS,
  type AdminMemberSort,
} from "@/lib/admin-members-list";

type AdminMemberFiltersProps = {
  initialQuery: string;
  initialSort: AdminMemberSort;
};

export function AdminMemberFilters({ initialQuery, initialSort }: AdminMemberFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<AdminMemberSort>(initialSort);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (sort && sort !== ADMIN_MEMBER_SORT.nameAsc) params.set("sort", sort);
    else params.delete("sort");
    router.push(`/admin/members?${params.toString()}`);
  }

  return (
    <form
      onSubmit={applyFilters}
      className="mt-8 grid gap-3 rounded-lg border border-plum/10 bg-surface p-4 sm:grid-cols-[1.4fr_1fr_auto]"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or phone"
        className="rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
      />
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value as AdminMemberSort)}
        className="rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        aria-label="Sort members"
      >
        {ADMIN_MEMBER_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
      >
        Apply
      </button>
    </form>
  );
}
