"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type MemberSummary = {
  name: string;
};

function TopBarLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`text-white/90 transition hover:text-white ${className}`.trim()}
    >
      {label}
    </Link>
  );
}

function TopBarSeparator() {
  return (
    <span className="text-white/35" aria-hidden="true">
      |
    </span>
  );
}

function AccountDropdown({
  member,
  onLoggedOut,
}: {
  member: MemberSummary | null;
  onLoggedOut: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/members/logout", { method: "POST" });
      onLoggedOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const menuItemClass =
    "block w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-plum transition hover:bg-pink-soft hover:text-brand";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 uppercase tracking-[0.18em] text-white/90 transition hover:text-white"
      >
        Account
        <span
          className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-sm border border-plum/10 bg-white py-1 shadow-lg ring-1 ring-plum/5"
        >
          {member ? (
            <>
              <Link
                href="/account"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                My account
              </Link>
              <Link
                href="/account/family"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                Family members
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={loggingOut}
                onClick={handleLogout}
                className={`${menuItemClass} disabled:opacity-60`}
              >
                {loggingOut ? "Signing out…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MemberTopBar({ overlayMode }: { overlayMode?: boolean }) {
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadMember() {
      fetch("/api/members/me")
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled) {
            setMember(data.user ?? null);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
    }

    loadMember();

    function refreshOnFocus() {
      if (document.visibilityState === "hidden") return;
      loadMember();
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  const onDark = !overlayMode;

  return (
    <div
      className={`border-b text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
        onDark
          ? "border-sage-hover/30 bg-sage text-white"
          : "border-white/10 bg-black/20 text-white backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-2 md:px-6">
        {!loaded ? (
          <span className="text-white/50">Loading…</span>
        ) : (
          <>
            <TopBarLink href="/membership" label="Membership" />
            <TopBarSeparator />
            <AccountDropdown
              member={member}
              onLoggedOut={() => setMember(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function FooterMemberLinks() {
  const router = useRouter();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setMember(data.user ?? null);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/members/logout", { method: "POST" });
      setMember(null);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const secondaryLinkClass =
    "rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-plum transition hover:border-sage hover:text-sage disabled:opacity-60";

  return (
    <div className="mt-5 overflow-hidden rounded-sm border border-plum/10 bg-white/70 p-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sage-light text-[11px] font-bold text-sage"
          aria-hidden="true"
        >
          ♥
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sage">
            Member access
          </p>
          <p className="text-[12px] leading-snug text-muted">
            Book, manage, and grow with us
          </p>
        </div>
      </div>

      <nav aria-label="Member access" className="mt-4 flex flex-col gap-2">
        <Link
          href="/membership"
          className="group inline-flex w-full items-center justify-between rounded-sm bg-sage px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-sage-hover"
        >
          <span>Membership</span>
          <span
            className="text-base transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            →
          </span>
        </Link>

        {!loaded ? (
          <p className="px-1 py-2 text-[11px] text-muted">Loading…</p>
        ) : member ? (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/account" className={secondaryLinkClass}>
              My account
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={secondaryLinkClass}
            >
              {loggingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/register" className={secondaryLinkClass}>
              Sign up
            </Link>
            <Link href="/login" className={secondaryLinkClass}>
              Login
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
