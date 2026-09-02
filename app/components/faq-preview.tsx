import Link from "next/link";
import { homepageFaqs } from "@/lib/geo";

export function FaqPreview() {
  const previewFaqs = homepageFaqs();

  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-5 h-px w-12 bg-pink" />
          <h2 className="font-display text-4xl text-plum sm:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Quick answers about booking, what to wear, and what to expect in
            the studio.
          </p>
        </div>

        <ul className="mt-12 divide-y divide-plum/10 rounded-sm border border-plum/10 bg-surface">
          {previewFaqs.map((item) => (
            <li key={item.question}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium text-plum transition hover:bg-pink-soft/50 [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-pink transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted">
          <Link
            href="/faqs"
            className="font-semibold text-brand hover:text-brand-hover hover:underline"
          >
            View all FAQs
          </Link>
        </p>
      </div>
    </section>
  );
}
