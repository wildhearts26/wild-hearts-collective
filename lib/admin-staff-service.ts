import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ADMIN_ROLES,
  type AdminPermission,
  type AdminRole,
  isAdminRole,
  resolveAdminPermissions,
  ROLE_DEFAULT_PERMISSIONS,
  sanitizePermissions,
} from "@/lib/admin-permissions";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureBootstrapAdmin } from "@/lib/admin-bootstrap";

export { ensureBootstrapAdmin } from "@/lib/admin-bootstrap";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function permissionsToDb(
  value: AdminPermission[] | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return sanitizePermissions(value);
}

export async function authenticateAdmin(email: string, password: string) {
  await ensureBootstrapAdmin();

  const normalized = normalizeEmail(email);
  if (!normalized || !password) return null;

  const admin = await db.adminUser.findUnique({ where: { email: normalized } });
  if (!admin || !admin.active) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;
  if (!isAdminRole(admin.role)) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
    permissions: resolveAdminPermissions(admin.role as AdminRole, admin.permissions),
  };
}

export async function listAdminUsers() {
  await ensureBootstrapAdmin();
  const users = await db.adminUser.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminRole,
    active: user.active,
    permissions: resolveAdminPermissions(user.role as AdminRole, user.permissions),
    permissionOverrides:
      user.permissions == null
        ? null
        : sanitizePermissions(user.permissions),
    usesRoleDefaults: user.permissions == null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
  permissions?: AdminPermission[] | null;
  active?: boolean;
}) {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Email is required.");
  if (!input.name.trim()) throw new Error("Name is required.");
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!isAdminRole(input.role)) throw new Error("Invalid role.");

  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) throw new Error("An admin with that email already exists.");

  const permissions =
    input.role === ADMIN_ROLES.master
      ? null
      : input.permissions === undefined
        ? null
        : input.permissions === null
          ? null
          : sanitizePermissions(input.permissions);

  const user = await db.adminUser.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      role: input.role,
      permissions: permissionsToDb(permissions),
      active: input.active !== false,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminRole,
    permissions: resolveAdminPermissions(user.role as AdminRole, user.permissions),
  };
}

export async function updateAdminUser(
  id: string,
  input: {
    email?: string;
    name?: string;
    password?: string;
    role?: AdminRole;
    permissions?: AdminPermission[] | null;
    active?: boolean;
  },
  actorId: string,
) {
  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) throw new Error("Staff account not found.");

  if (existing.role === ADMIN_ROLES.master && input.active === false) {
    const masters = await db.adminUser.count({
      where: { role: ADMIN_ROLES.master, active: true },
    });
    if (masters <= 1) {
      throw new Error("You cannot deactivate the last master admin.");
    }
  }

  if (id === actorId && input.active === false) {
    throw new Error("You cannot deactivate your own account.");
  }

  if (
    id === actorId &&
    input.role &&
    input.role !== ADMIN_ROLES.master &&
    existing.role === ADMIN_ROLES.master
  ) {
    const masters = await db.adminUser.count({
      where: { role: ADMIN_ROLES.master, active: true },
    });
    if (masters <= 1) {
      throw new Error("You cannot demote the last master admin.");
    }
  }

  const data: {
    email?: string;
    name?: string;
    passwordHash?: string;
    role?: string;
    permissions?: Prisma.InputJsonValue | typeof Prisma.DbNull;
    active?: boolean;
  } = {};

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!email) throw new Error("Email is required.");
    data.email = email;
  }
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Name is required.");
    data.name = input.name.trim();
  }
  if (input.password !== undefined && input.password.length > 0) {
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    data.passwordHash = hashPassword(input.password);
  }
  if (input.role !== undefined) {
    if (!isAdminRole(input.role)) throw new Error("Invalid role.");
    data.role = input.role;
  }
  if (input.permissions !== undefined) {
    const role = (input.role ?? existing.role) as AdminRole;
    data.permissions = permissionsToDb(
      role === ADMIN_ROLES.master
        ? null
        : input.permissions === null
          ? null
          : sanitizePermissions(input.permissions),
    );
  }
  if (input.active !== undefined) {
    data.active = input.active;
  }

  try {
    const user = await db.adminUser.update({ where: { id }, data });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AdminRole,
      active: user.active,
      permissions: resolveAdminPermissions(user.role as AdminRole, user.permissions),
      permissionOverrides:
        user.permissions == null ? null : sanitizePermissions(user.permissions),
      usesRoleDefaults: user.permissions == null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unique constraint")) {
      throw new Error("An admin with that email already exists.");
    }
    throw error;
  }
}

export function defaultPermissionsForRole(role: AdminRole) {
  return [...ROLE_DEFAULT_PERMISSIONS[role]];
}
