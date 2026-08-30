import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MemberRegisterForm } from "@/app/components/member-register-form";
import { getCurrentMember } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const member = await getCurrentMember();
  if (member) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-20">
      <div className="rounded-lg border border-plum/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 h-px w-12 bg-pink" />
        <h1 className="font-display text-4xl text-plum">Create your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Join Wild Hearts Collective to book classes, pay online, and keep track of your
          studio bookings. After you create your account, you can add child members who share
          this email — they book and pay separately.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <MemberRegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
