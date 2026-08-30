import type { Metadata } from "next";
import Link from "next/link";
import { AddChildMemberForm } from "@/app/components/add-child-member-form";
import { MemberSwitcher } from "@/app/components/member-switcher";
import { ReuploadChildIdForm } from "@/app/components/reupload-child-id-form";
import { getCurrentMember } from "@/lib/member-auth";
import { getLatestIdDocumentMeta } from "@/lib/household-service";
import { idDocumentStatusLabel, memberTypeLabel } from "@/lib/household-config";
import { BOOKING_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Family members",
  robots: { index: false, follow: false },
};

export default async function AccountFamilyPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const guardian = member.household.find((item) => item.memberType !== "child");
  const guardianName = guardian?.name ?? member.name;

  const childStatuses = await Promise.all(
    member.household
      .filter((person) => person.memberType === "child")
      .map(async (person) => {
        const document = await getLatestIdDocumentMeta(person.id);
        return [person.id, document?.status ?? null] as const;
      }),
  );
  const statusByChildId = Object.fromEntries(childStatuses);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <section className="rounded-sm border border-plum/10 bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Household
        </p>
        <h2 className="mt-2 font-display text-3xl text-plum">Family members</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Everyone in this household signs in with {member.email}. Switch to a child before
          booking or paying so their classes and credits stay on their own membership.
        </p>

        {member.household.length > 1 ? (
          <div className="mt-6 max-w-md">
            <MemberSwitcher members={member.household} />
          </div>
        ) : null}

        <ul className="mt-6 divide-y divide-plum/10">
          {member.household.map((person) => {
            const idStatus =
              person.memberType === "child" ? statusByChildId[person.id] ?? null : null;

            return (
              <li key={person.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-plum">
                      {person.name}
                      {person.isActive ? (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brand">
                          Active
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">
                      {memberTypeLabel(person.memberType)}
                      {idStatus ? ` · ID ${idDocumentStatusLabel(idStatus)}` : ""}
                    </p>
                  </div>
                  {person.isActive ? (
                    <Link
                      href={BOOKING_URL}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Book as {person.name.split(" ")[0]}
                    </Link>
                  ) : null}
                </div>
                {person.memberType === "child" ? (
                  <ReuploadChildIdForm
                    childId={person.id}
                    childName={person.name}
                    status={idStatus}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {member.isChild &&
      (!member.parentalConsentComplete ||
        !member.idDocumentUploaded ||
        member.idDocumentStatus === "rejected") ? (
        <section className="rounded-sm border border-brand/20 bg-pink-soft/50 p-6">
          <h3 className="font-display text-2xl text-plum">Action needed before booking</h3>
          <p className="mt-2 text-sm text-muted">
            {member.idDocumentStatus === "rejected"
              ? "The parent/guardian identification for this child was not accepted. Upload a new document below or from the parent profile."
              : "This child cannot book until parental consent and proof of identification are on file."}
          </p>
        </section>
      ) : null}

      <section className="rounded-sm border border-plum/10 bg-surface p-6">
        <AddChildMemberForm guardianName={guardianName} />
      </section>
    </div>
  );
}
