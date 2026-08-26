import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { pageSeo } from "@/lib/page-seo";
import { searchSite } from "@/lib/search-index";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const query = q.trim();

  return pageSeo({
    title: query ? `Search results for ${query}` : "Search",
    description:
      "Search Wild Hearts Collective classes, team pages, booking, parties, hire, and studio information.",
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    index: !query,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? searchSite(query) : [];

  return (
    <ContentSection>
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum sm:text-5xl">
          Search Wild Hearts Collective
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Find classes, instructors, booking, parties, hire, and studio FAQs.
        </p>
      </div>

      <p className="geo-citation mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted">
        Wild Hearts Collective is an inclusive aerial and pole studio in Mansfield
        offering pole, aerial hoop, silks, and creative arts for all ages,
        abilities, and backgrounds.
      </p>

      <form action="/search" method="get" className="mx-auto mt-10 flex max-w-xl gap-3">
        <label htmlFor="site-search" className="sr-only">
          Search query
        </label>
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="e.g. pole, hoop, booking, parties"
          className="w-full rounded-sm border border-plum/15 bg-surface px-4 py-3 text-sm text-plum outline-none ring-pink/40 placeholder:text-muted focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-sm bg-plum px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand"
        >
          Search
        </button>
      </form>

      {query.length > 0 && query.length < 2 ? (
        <p className="mx-auto mt-8 max-w-xl text-sm text-muted">
          Enter at least two characters.
        </p>
      ) : null}

      {query.length >= 2 ? (
        <section className="mx-auto mt-12 max-w-2xl" aria-live="polite">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-sage">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
          </h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No matching pages. Try “pole”, “hoop”, “book”, or browse{" "}
              <Link href="/classes" className="font-medium text-plum hover:underline">
                classes
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-plum/10 border-y border-plum/10">
              {results.map((item) => (
                <li key={item.href} className="py-5">
                  <Link
                    href={item.href}
                    className="font-display text-2xl text-plum transition hover:text-sage"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </ContentSection>
  );
}
