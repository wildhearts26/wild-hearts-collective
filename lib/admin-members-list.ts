export const ADMIN_MEMBER_SORT = {
  nameAsc: "name-asc",
  nameDesc: "name-desc",
  creditsDesc: "credits-desc",
  creditsAsc: "credits-asc",
  bookingsDesc: "bookings-desc",
  bookingsAsc: "bookings-asc",
  joinedDesc: "joined-desc",
  joinedAsc: "joined-asc",
} as const;

export type AdminMemberSort = (typeof ADMIN_MEMBER_SORT)[keyof typeof ADMIN_MEMBER_SORT];

export const ADMIN_MEMBER_SORT_OPTIONS: Array<{ value: AdminMemberSort; label: string }> = [
  { value: ADMIN_MEMBER_SORT.nameAsc, label: "Name (A–Z)" },
  { value: ADMIN_MEMBER_SORT.nameDesc, label: "Name (Z–A)" },
  { value: ADMIN_MEMBER_SORT.creditsDesc, label: "Most credits" },
  { value: ADMIN_MEMBER_SORT.creditsAsc, label: "Fewest credits" },
  { value: ADMIN_MEMBER_SORT.bookingsDesc, label: "Most bookings" },
  { value: ADMIN_MEMBER_SORT.bookingsAsc, label: "Fewest bookings" },
  { value: ADMIN_MEMBER_SORT.joinedDesc, label: "Newest members" },
  { value: ADMIN_MEMBER_SORT.joinedAsc, label: "Oldest members" },
];

export function parseAdminMemberSort(value: string | undefined): AdminMemberSort {
  const match = ADMIN_MEMBER_SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? ADMIN_MEMBER_SORT.nameAsc;
}

export function adminMemberOrderBy(sort: AdminMemberSort) {
  switch (sort) {
    case ADMIN_MEMBER_SORT.nameDesc:
      return { name: "desc" as const };
    case ADMIN_MEMBER_SORT.creditsDesc:
      return { creditsRemaining: "desc" as const };
    case ADMIN_MEMBER_SORT.creditsAsc:
      return { creditsRemaining: "asc" as const };
    case ADMIN_MEMBER_SORT.bookingsDesc:
      return { bookings: { _count: "desc" as const } };
    case ADMIN_MEMBER_SORT.bookingsAsc:
      return { bookings: { _count: "asc" as const } };
    case ADMIN_MEMBER_SORT.joinedDesc:
      return { createdAt: "desc" as const };
    case ADMIN_MEMBER_SORT.joinedAsc:
      return { createdAt: "asc" as const };
    case ADMIN_MEMBER_SORT.nameAsc:
    default:
      return { name: "asc" as const };
  }
}
