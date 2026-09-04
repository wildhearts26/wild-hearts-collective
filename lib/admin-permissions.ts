/** Studio staff roles and capability catalog (Option 2: role templates + overrides). */

export const ADMIN_ROLES = {
  master: "master",
  director: "director",
  employee: "employee",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export const ADMIN_PERMISSIONS = {
  dashboard: "dashboard",
  schedule: "schedule",
  bookings: "bookings",
  /** Mark attendance / check people into classes. */
  checkin: "checkin",
  members: "members",
  tutors: "tutors",
  shop: "shop",
  pricing: "pricing",
  timetable: "timetable",
  analytics: "analytics",
  /** Create and edit staff accounts + permission toggles. */
  staff: "staff",
  /** Dangerous resets / wipe tools. */
  system: "system",
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ADMIN_PERMISSION_META: {
  id: AdminPermission;
  label: string;
  description: string;
}[] = [
  {
    id: ADMIN_PERMISSIONS.dashboard,
    label: "Dashboard",
    description: "Studio overview and today’s classes.",
  },
  {
    id: ADMIN_PERMISSIONS.schedule,
    label: "Schedule",
    description: "Create and edit bookable class sessions.",
  },
  {
    id: ADMIN_PERMISSIONS.bookings,
    label: "Bookings",
    description: "View and manage bookings and waitlists.",
  },
  {
    id: ADMIN_PERMISSIONS.checkin,
    label: "Check-in",
    description: "Mark attendance on class rosters.",
  },
  {
    id: ADMIN_PERMISSIONS.members,
    label: "Members",
    description: "View and edit member accounts.",
  },
  {
    id: ADMIN_PERMISSIONS.tutors,
    label: "Instructors",
    description: "Manage instructors.",
  },
  {
    id: ADMIN_PERMISSIONS.shop,
    label: "Shop",
    description: "Products, inventory, categories, and shipping.",
  },
  {
    id: ADMIN_PERMISSIONS.pricing,
    label: "Passes & pricing",
    description: "Class packs and studio pricing.",
  },
  {
    id: ADMIN_PERMISSIONS.timetable,
    label: "Marketing timetable",
    description: "Homepage weekly timetable editor.",
  },
  {
    id: ADMIN_PERMISSIONS.analytics,
    label: "Analytics",
    description: "Studio analytics and engagement tools.",
  },
  {
    id: ADMIN_PERMISSIONS.staff,
    label: "Staff accounts",
    description: "Create admin users and set their access.",
  },
  {
    id: ADMIN_PERMISSIONS.system,
    label: "System resets",
    description: "Dangerous wipe / reset tools (master only by default).",
  },
];

const ALL_PERMISSIONS = ADMIN_PERMISSION_META.map((item) => item.id);

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  master: [...ALL_PERMISSIONS],
  director: ALL_PERMISSIONS.filter(
    (id) => id !== ADMIN_PERMISSIONS.staff && id !== ADMIN_PERMISSIONS.system,
  ),
  employee: [ADMIN_PERMISSIONS.checkin, ADMIN_PERMISSIONS.dashboard],
};

export function isAdminRole(value: string): value is AdminRole {
  return (
    value === ADMIN_ROLES.master ||
    value === ADMIN_ROLES.director ||
    value === ADMIN_ROLES.employee
  );
}

export function isAdminPermission(value: string): value is AdminPermission {
  return ALL_PERMISSIONS.includes(value as AdminPermission);
}

export function sanitizePermissions(values: unknown): AdminPermission[] {
  if (!Array.isArray(values)) return [];
  const unique = new Set<AdminPermission>();
  for (const value of values) {
    if (typeof value === "string" && isAdminPermission(value)) {
      unique.add(value);
    }
  }
  return [...unique];
}

/**
 * Effective permissions for a staff user.
 * When `permissionOverrides` is non-null, it replaces the role template entirely.
 */
export function resolveAdminPermissions(
  role: AdminRole,
  permissionOverrides: unknown,
): AdminPermission[] {
  if (role === ADMIN_ROLES.master) {
    return [...ROLE_DEFAULT_PERMISSIONS.master];
  }

  if (permissionOverrides != null) {
    return sanitizePermissions(permissionOverrides);
  }

  return [...ROLE_DEFAULT_PERMISSIONS[role]];
}

export function adminHasPermission(
  permissions: readonly AdminPermission[],
  required: AdminPermission | AdminPermission[],
) {
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((permission) => permissions.includes(permission));
}

/** Nav / page access: check-in staff can open the schedule to reach rosters. */
export function canAccessAdminSection(
  permissions: readonly AdminPermission[],
  section: AdminPermission,
) {
  if (adminHasPermission(permissions, section)) return true;
  if (
    section === ADMIN_PERMISSIONS.schedule &&
    adminHasPermission(permissions, ADMIN_PERMISSIONS.checkin)
  ) {
    return true;
  }
  return false;
}

export function roleLabel(role: AdminRole) {
  switch (role) {
    case ADMIN_ROLES.master:
      return "Master admin";
    case ADMIN_ROLES.director:
      return "Director";
    case ADMIN_ROLES.employee:
      return "Employee";
    default:
      return role;
  }
}
