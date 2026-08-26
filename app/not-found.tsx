import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sage">
        404
      </p>
      <h1 className="mt-4 font-display text-5xl text-plum sm:text-6xl">
        Page not found
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        That link does not match a page on Wild Hearts Collective. Try the
        homepage, class list, or get in touch.
      </p>
      <ul className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
        <li>
          <Link href="/" className="text-plum hover:text-sage hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link href="/classes" className="text-plum hover:text-sage hover:underline">
            Classes
          </Link>
        </li>
        <li>
          <Link href="/book" className="text-plum hover:text-sage hover:underline">
            Book
          </Link>
        </li>
        <li>
          <Link href="/contact" className="text-plum hover:text-sage hover:underline">
            Contact
          </Link>
        </li>
      </ul>
    </section>
  );
}
