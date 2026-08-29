import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/app/components/section-heading";
import { BOOKING_URL } from "@/lib/constants";
import {
  timetable as defaultTimetable,
  type TimetableClass,
  type TimetableDay,
} from "@/lib/site-data";

/** Poster pixel size of public/Timetable.png — used to crop the header/footer artwork. */
const POSTER_W = 941;
const POSTER_H = 1672;
/** Top of the first day card on the original poster (~25.7%). */
const HEADER_H = Math.round(POSTER_H * 0.25);
/** Bottom heart motif below Sunday (~5.5%). */
const FOOTER_H = Math.round(POSTER_H * 0.055);

const WEEKLY_DAY_COUNT = 7;
const CARD_LEFT = "10.1%";
const CARD_RIGHT = "7.5%";
/** Matches the cream fill inside the PNG day cards. */
const CARD_CREAM = "#fbf8f2";
const INK = "#4a5d4e";

/** Public display only — admin/data can keep full day names. */
const DAY_SHORT_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function shortDayLabel(day: string) {
  const key = day.trim().toLowerCase();
  return DAY_SHORT_LABELS[key] ?? day.slice(0, 3);
}

function bookHref(item: TimetableClass) {
  if (item.bookClassSlug) return `${BOOKING_URL}?class=${item.bookClassSlug}`;
  return BOOKING_URL;
}

function DayCard({ day }: { day: TimetableDay }) {
  return (
    <article
      className="rounded-[2.2cqw] border border-[#d7d0c4]/90"
      style={{ backgroundColor: CARD_CREAM }}
    >
      <div className="flex items-stretch gap-[2cqw] px-[2.4cqw] py-[1.5cqw]">
        <p
          className="flex w-[14cqw] shrink-0 items-center text-[2.85cqw] font-semibold uppercase leading-tight tracking-[0.08em]"
          style={{ color: INK, fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {shortDayLabel(day.day)}
        </p>
        <div
          className="w-px shrink-0 self-stretch opacity-50"
          style={{ backgroundColor: INK }}
          aria-hidden
        />
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-[0.35cqw] py-[0.2cqw]">
          {day.classes.map((item, index) => {
            const href = bookHref(item);
            const hasTime = Boolean(item.time?.trim());
            const compact = day.classes.length > 1 || Boolean(item.note);
            return (
              <li key={`${day.day}-${index}-${item.title}`} className="min-w-0">
                <Link
                  href={href}
                  className="group block rounded-[0.6cqw] outline-none transition hover:bg-[#efe8dc]/80 focus-visible:ring-2 focus-visible:ring-sage/35"
                >
                  <div
                    className="flex min-w-0 items-baseline gap-[1.4cqw] px-[0.4cqw] py-[0.2cqw]"
                    style={{
                      color: INK,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}
                  >
                    {hasTime ? (
                      <span
                        className={`w-[22cqw] shrink-0 tabular-nums leading-snug tracking-wide ${
                          compact ? "text-[2.15cqw]" : "text-[2.45cqw]"
                        }`}
                      >
                        {item.time}
                      </span>
                    ) : null}
                    <span
                      className={`min-w-0 flex-1 leading-snug group-hover:underline ${
                        compact ? "text-[2.2cqw]" : "text-[2.55cqw]"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  {item.note ? (
                    <p
                      className="px-[0.4cqw] pb-[0.25cqw] text-[1.65cqw] italic leading-snug opacity-80"
                      style={{
                        color: INK,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        paddingLeft: hasTime
                          ? "calc(22cqw + 1.4cqw + 0.4cqw)"
                          : undefined,
                      }}
                    >
                      ({item.note.replace(/^\(|\)$/g, "")})
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

/**
 * Marketing timetable: botanical poster header/footer from Timetable.png,
 * with HTML day cards that grow and shrink with the number of classes.
 */
export function Timetable({
  days = defaultTimetable,
}: {
  days?: TimetableDay[];
}) {
  const weeklyDays = days.slice(0, WEEKLY_DAY_COUNT);
  const promotionalRows = days.slice(WEEKLY_DAY_COUNT);

  return (
    <div className="w-full">
      <SectionHeading
        title="Timetable"
        subtitle="Our weekly studio pattern. Tap a class to open booking — live dates and availability are confirmed there."
      />

      <div
        className="relative mt-12 w-full overflow-hidden rounded-sm bg-surface shadow-sm ring-1 ring-plum/5"
        style={{
          containerType: "inline-size",
          backgroundColor: CARD_CREAM,
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[14%]">
          <Image
            src="/timetable/leaves-left.png"
            alt=""
            fill
            sizes="14vw"
            className="object-cover object-top"
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[14%]">
          <Image
            src="/timetable/leaves-right.png"
            alt=""
            fill
            sizes="14vw"
            className="object-cover object-top"
          />
        </div>

        <div
          className="relative z-10 w-full overflow-hidden"
          style={{ aspectRatio: `${POSTER_W} / ${HEADER_H}` }}
        >
          <Image
            src="/Timetable.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 72rem"
            className="pointer-events-none object-cover object-top"
          />
        </div>

        <div
          className="relative z-10 flex flex-col gap-[1.15cqw] py-[0.8cqw]"
          style={{ paddingLeft: CARD_LEFT, paddingRight: CARD_RIGHT }}
        >
          {weeklyDays.map((day, index) => (
            <DayCard key={`${day.day}-${index}`} day={day} />
          ))}
        </div>

        <div
          className="relative z-10 w-full overflow-hidden"
          style={{ aspectRatio: `${POSTER_W} / ${FOOTER_H}` }}
        >
          <Image
            src="/Timetable.png"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 72rem"
            className="pointer-events-none object-cover object-bottom"
          />
        </div>
      </div>

      {promotionalRows.length > 0 ? (
        <section
          className="mt-8 space-y-3"
          aria-label="Upcoming courses and special events"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Courses &amp; special events
          </p>
          {promotionalRows.map((row, index) => (
            <div
              key={`${row.day}-${index}`}
              className="rounded-sm border border-plum/10 bg-surface px-5 py-4 shadow-sm ring-1 ring-plum/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {row.day}
              </p>
              <ul className="mt-2 space-y-1.5">
                {row.classes.map((item, classIndex) => (
                  <li key={`${item.title}-${classIndex}`} className="text-sm text-plum">
                    <Link
                      href={bookHref(item)}
                      className="font-semibold hover:underline"
                    >
                      {item.time ? `${item.time} · ` : ""}
                      {item.title}
                    </Link>
                    {item.note ? (
                      <span className="text-muted"> — {item.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          One-offs, tutors, and open sessions are listed in the live booking
          schedule when they are available to book.
        </p>
        <Link
          href={BOOKING_URL}
          className="inline-flex shrink-0 rounded-sm bg-sage px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
        >
          Book a class
        </Link>
      </div>
    </div>
  );
}
